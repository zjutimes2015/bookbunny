/**
 * Pro 动画导出
 *
 * 一本 Pro 动画 = N 页「动画 + 配音」+ 服务端合成一段完整 MP4。
 *
 * Vercel 单个函数最长 300s，而一页动画就要 1–3 分钟，
 * 所以采用链式结构：一次调用只推进一页，处理完自触发下一次。
 *
 *   POST 建任务 → after(第 0 页) → 第 1 页 → … → 全部完成后合成 → done
 *
 * 每页产物立即转存 R2（Replicate 的输出 URL 一小时就失效），
 * 合成阶段再按页序拼接、混入配乐。
 */

import { NextRequest, NextResponse, after } from 'next/server'
import { sql } from '@/lib/neon'
import { getSessionUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { isR2Configured, assetUrl } from '@/lib/r2'
import { requireHuman, humanCheckFailedResponse } from '@/lib/turnstile'
import { PRO_CREDITS_PER_BOOK } from '@/lib/payments/waffo'
import { mirrorToR2, assembleProVideo } from '@/lib/api/pro-video'
import type { PageOutline } from '@/lib/types/book'

export const runtime = 'nodejs'
export const maxDuration = 300 // Vercel Hobby 上限

/** 每本 Pro 动画消耗的 Pro 动画额度（与 Waffo 商品发放口径一致） */
const PRO_COST = PRO_CREDITS_PER_BOOK

/**
 * Pro 动画最多做多少页。
 *
 * Pro 包定价（$55/5 本、$100/10 本）是按 8 页一本反推的 80% 毛利：
 *   8 页 = 8 × $0.25(Wan 3 480p 5s) + $0.04(TTS) + $0.15(音乐) ≈ $2.20/本
 * 12 页 = $3.20/本，$11/本 只有 70.8% 毛利，所以必须卡页数上限。
 */
const PRO_MAX_PAGES = 8

/** 超过这个时长还没被推进，说明链条断了，GET 轮询时补一脚 */
const STALE_MS = 180_000

// ─── 数据类型 ────────────────────────────────────────────────────────

interface ProPageJob {
  index: number
  /** 该页插图地址（建任务时从 books.page_image_urls 带入） */
  imageUrl?: string
  /** 该页文字，用于生成动画提示词与配音 */
  pageText?: string
  clip: 'pending' | 'generating' | 'done' | 'error'
  audio: 'pending' | 'generating' | 'done' | 'error'
  videoUrl?: string
  audioUrl?: string
  retries: number
}

interface AnimateProBody {
  bookId: string
  pages: PageOutline[]
  pageImages?: string[]
  turnstileToken?: string
}

// ─── 内部自触发 ──────────────────────────────────────────────────────

function selfUrl(genId: string): string {
  const site = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
  return `${site}/api/animate-pro?advance=1&genId=${encodeURIComponent(genId)}`
}

function isInternal(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  return req.headers.get('x-internal-token') === expected
}

/** 触发下一次推进。必须 await，否则函数结束请求会被回收 */
async function kick(genId: string): Promise<void> {
  try {
    await fetch(selfUrl(genId), {
      method: 'POST',
      headers: { 'x-internal-token': process.env.CRON_SECRET || '' },
      signal: AbortSignal.timeout(10_000),
    })
  } catch (err) {
    console.error(`[animate-pro] ${genId}: kick failed:`, err)
  }
}

// ─── POST：建任务 / 推进一页 ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 内网推进：一次只处理一页
  //
  // 这里必须立刻返回 202，把翻页放到 after() 里做：
  // 上一跳的 kick 只等「已接受」，如果同步处理完才返回，kick 会一直挂到超时，
  // 链条就在这一页之后断掉。
  if (req.nextUrl.searchParams.get('advance') === '1') {
    if (!isInternal(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const genId = req.nextUrl.searchParams.get('genId')
    if (!genId) return NextResponse.json({ error: 'Missing genId' }, { status: 400 })

    after(async () => {
      try {
        const advanced = await advance(genId)
        if (advanced) await kick(genId)
      } catch (err) {
        console.error(`[animate-pro] ${genId}: advance failed:`, err)
        await markError(genId)
      }
    })

    return NextResponse.json({ ok: true }, { status: 202 })
  }

  try {
    const body = (await req.json()) as AnimateProBody

    if (!body.bookId || !Array.isArray(body.pages) || body.pages.length === 0) {
      return NextResponse.json({ error: 'Missing bookId or pages' }, { status: 400 })
    }

    // 页数上限：Pro 包按 8 页定价，超过就会击穿毛利。
    // 这里只截取前 N 页（正文优先），不做整本拒绝，避免用户白等。
    const animatable = body.pages.slice(0, PRO_MAX_PAGES)

    // 人机校验（Pro 是最贵的操作，必须挡）
    const human = await requireHuman(req, body.turnstileToken)
    if (!human.ok) return humanCheckFailedResponse()

    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Pro 动画是独立商品：只消耗 Pro 动画面包额度
    if (user.proCredits < PRO_COST) {
      return NextResponse.json(
        {
          error: `Pro animation requires ${PRO_COST} Pro credits. Buy a Pro Animation Pack (5 books for $55).`,
          code: 'insufficient_pro_credits',
          required: PRO_COST,
          available: user.proCredits,
          purchaseUrl: '/pricing#pro-animation',
        },
        { status: 402 },
      )
    }

    // 成本高：每人每天最多 5 本
    const rate = await checkRateLimit(`animate-pro:user:${user.id}:day`, 5, 86400)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Daily Pro animation limit reached. Try again tomorrow.', code: 'rate_limited' },
        { status: 429 },
      )
    }

    // 原子扣减：并发请求下不会扣成负数
    const deducted = await sql`
      UPDATE bookbunny_users
      SET pro_animation_credits = pro_animation_credits - ${PRO_COST}, updated_at = NOW()
      WHERE id = ${user.id} AND pro_animation_credits >= ${PRO_COST}
      RETURNING pro_animation_credits
    `
    if (deducted.length === 0) {
      return NextResponse.json(
        {
          error: `Pro animation requires ${PRO_COST} Pro credits. Buy a Pro Animation Pack (5 books for $55).`,
          code: 'insufficient_pro_credits',
          required: PRO_COST,
          available: 0,
          purchaseUrl: '/pricing#pro-animation',
        },
        { status: 402 },
      )
    }

    const genId = `apro_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // 插图与文字在建任务时固化下来，后续每页推进不必再回查 books 表
    const pages: ProPageJob[] = animatable.map((p, i) => ({
      index: i,
      imageUrl: body.pageImages?.[i],
      pageText: p.pageText,
      clip: 'pending',
      audio: 'pending',
      retries: 0,
    }))

    await sql`
      INSERT INTO pro_animation_jobs (id, book_id, user_id, status, total_pages, completed_pages, pages, created_at)
      VALUES (${genId}, ${body.bookId}, ${user.id}, 'pending', ${animatable.length}, 0, ${JSON.stringify(pages)}::jsonb, NOW())
    `

    after(async () => { await kick(genId) })

    return NextResponse.json({
      genId,
      totalPages: animatable.length,
      // 超出上限的页不参与动画，明确告知用户成品只覆盖前 N 页
      truncated: body.pages.length > animatable.length,
      maxPages: PRO_MAX_PAGES,
    })
  } catch (err) {
    console.error('Animate pro POST error:', err)
    return NextResponse.json({ error: 'Failed to create animation job' }, { status: 500 })
  }
}

// ─── GET：轮询进度 ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const genId = req.nextUrl.searchParams.get('genId')
  if (!genId) return NextResponse.json({ error: 'Missing genId' }, { status: 400 })

  const rows = await sql`
    SELECT status, total_pages, pages, music_url, cover_url, final_video_url, updated_at
    FROM pro_animation_jobs
    WHERE id = ${genId}
    LIMIT 1
  `
  const job = rows[0]
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const jobPages = (job.pages || []) as ProPageJob[]
  const settled = jobPages.filter(p => p.clip === 'done' || p.clip === 'error').length

  // 自愈：链条断了（实例回收/网络失败）时补一脚，用户刷新页面即可恢复
  if (job.status === 'running' || job.status === 'pending') {
    const age = Date.now() - new Date(job.updated_at).getTime()
    const busy = jobPages.some(p => p.clip === 'generating')
    if (!busy && age > STALE_MS) {
      after(async () => { await kick(genId) })
    }
  }

  return NextResponse.json({
    status: job.status,
    total: job.total_pages,
    completed: settled,
    pages: jobPages.map(p => ({
      index: p.index,
      clip: p.clip,
      audio: p.audio,
      videoUrl: p.videoUrl,
      audioUrl: p.audioUrl,
    })),
    musicUrl: job.music_url,
    coverUrl: job.cover_url,
    finalVideoUrl: job.final_video_url,
  })
}

// ─── 推进一页 ────────────────────────────────────────────────────────

/** @returns 是否真的推进了一页（false 表示被别人抢走或已完成） */
async function advance(genId: string): Promise<boolean> {
  const rows = await sql`
    SELECT book_id, user_id, status, pages
    FROM pro_animation_jobs
    WHERE id = ${genId}
    LIMIT 1
  `
  const job = rows[0]
  if (!job) return false
  if (job.status === 'done' || job.status === 'error') return false

  const pages = (job.pages || []) as ProPageJob[]
  const pendingIdx = pages.findIndex(p => p.clip === 'pending')

  if (pendingIdx === -1) {
    // 没有待处理页：若还有页在别人手里，让对方的链条继续；否则收尾合成
    if (pages.some(p => p.clip === 'generating')) return false
    await finalize(genId, job.book_id, job.user_id, pages)
    return false
  }

  // 原子抢占这一页，避免两条链同时处理同一页
  const claimedPage: ProPageJob = { ...pages[pendingIdx], clip: 'generating', audio: 'generating' }
  const claimed = await sql`
    UPDATE pro_animation_jobs
    SET pages = jsonb_set(pages, ARRAY[${String(pendingIdx)}], ${JSON.stringify(claimedPage)}::jsonb, false),
        status = 'running',
        updated_at = NOW()
    WHERE id = ${genId}
      AND jsonb_extract_path_text(pages, ${String(pendingIdx)}, 'clip') = 'pending'
    RETURNING id
  `
  if (claimed.length === 0) return false

  const finished = await processPage({
    bookId: job.book_id,
    page: pages[pendingIdx],
    pageNumber: pendingIdx,
  })

  await sql`
    UPDATE pro_animation_jobs
    SET pages = jsonb_set(pages, ARRAY[${String(pendingIdx)}], ${JSON.stringify(finished)}::jsonb, false),
        updated_at = NOW()
    WHERE id = ${genId}
  `

  return true
}

interface ProcessPageResult {
  bookId: string
  page: ProPageJob
  pageNumber: number
}

/**
 * Replicate 要能从公网取图，站内的 /api/assets/* 相对地址它读不到。
 * 这里统一转成 CDN 地址（未配置 R2_PUBLIC_URL 时退回站点绝对地址）。
 */
function toPublicUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url

  const key = url.startsWith('/api/assets/') ? url.slice('/api/assets/'.length) : url
  const built = assetUrl(key)
  if (/^https?:\/\//i.test(built)) return built

  const site = (process.env.SITE_URL || '').replace(/\/+$/, '')
  return site ? `${site}${built}` : built
}

/** 生成一页的动画与配音，并立即转存 R2（Replicate 的输出会过期） */
async function processPage(opts: ProcessPageResult): Promise<ProPageJob> {
  const { bookId, page, pageNumber } = opts
  const result: ProPageJob = { ...page, clip: 'error', audio: 'error' }

  if (!page.imageUrl || page.imageUrl.startsWith('data:')) {
    // 没有可访问的插图地址，Replicate 无法取图；直接判失败，不浪费调用
    console.error(`[animate-pro] page ${pageNumber}: missing image url`)
    return result
  }

  if (!isR2Configured()) {
    console.error('[animate-pro] R2 is not configured; cannot persist clips')
    return result
  }

  const imageUrl = toPublicUrl(page.imageUrl)
  const { animatePage, generateTTS } = await import('@/lib/api/replicate-pro')

  // 动画
  try {
    const clip = await animatePage(imageUrl, page.pageText ?? '', {
      duration: 5,
      resolution: '480p',
    })
    if (clip.ok && clip.url) {
      result.videoUrl = await mirrorToR2(clip.url, `books/${bookId}/pro/clip-${String(pageNumber).padStart(3, '0')}.mp4`)
      result.clip = 'done'
    }
  } catch (err) {
    console.error(`[animate-pro] page ${pageNumber}: animate failed:`, err)
  }

  // 配音
  try {
    const audio = await generateTTS(page.pageText ?? '', { language: 'en-US', speed: 0.85 })
    if (audio.ok && audio.url) {
      result.audioUrl = await mirrorToR2(audio.url, `books/${bookId}/pro/audio-${String(pageNumber).padStart(3, '0')}.mp3`)
      result.audio = 'done'
    }
  } catch (err) {
    console.error(`[animate-pro] page ${pageNumber}: tts failed:`, err)
  }

  return result
}

// ─── 收尾：配乐 + 合成 ───────────────────────────────────────────────

async function finalize(
  genId: string,
  bookId: string,
  userId: string,
  pages: ProPageJob[],
): Promise<void> {
  const donePages = pages.filter(p => p.clip === 'done' && p.videoUrl)

  if (donePages.length === 0) {
    // 全部失败：退回本次扣掉的额度，不让用户为失败付费
    await refund(userId)
    await sql`
      UPDATE pro_animation_jobs SET status = 'error', updated_at = NOW() WHERE id = ${genId}
    `
    return
  }

  try {
    // 配乐：失败不影响成品，静音交付
    let musicUrl: string | undefined
    try {
      const { generateMusic } = await import('@/lib/api/replicate-pro')
      const music = await generateMusic('gentle bedtime story for children')
      if (music.ok && music.url) {
        musicUrl = await mirrorToR2(music.url, `books/${bookId}/pro/music.mp3`)
        await sql`UPDATE pro_animation_jobs SET music_url = ${musicUrl}, updated_at = NOW() WHERE id = ${genId}`
      } else {
        console.error(`[animate-pro] ${genId}: music failed: ${music.error}`)
      }
    } catch (err) {
      console.error(`[animate-pro] ${genId}: music failed:`, err)
    }

    const { url } = await assembleProVideo({
      bookId,
      segments: donePages.map(p => ({ videoUrl: p.videoUrl, audioUrl: p.audioUrl })),
      musicUrl,
    })

    await sql`
      UPDATE pro_animation_jobs
      SET status = 'done',
          final_video_url = ${url},
          completed_pages = ${donePages.length},
          updated_at = NOW()
      WHERE id = ${genId}
    `
  } catch (err) {
    console.error(`[animate-pro] ${genId}: assemble failed:`, err)
    await refund(userId)
    await sql`
      UPDATE pro_animation_jobs SET status = 'error', updated_at = NOW() WHERE id = ${genId}
    `
  }
}

async function refund(userId: string): Promise<void> {
  try {
    await sql`
      UPDATE bookbunny_users
      SET pro_animation_credits = COALESCE(pro_animation_credits, 0) + ${PRO_COST}, updated_at = NOW()
      WHERE id = ${userId}
    `
  } catch (err) {
    console.error('[animate-pro] refund failed:', err)
  }
}

async function markError(genId: string): Promise<void> {
  try {
    await sql`
      UPDATE pro_animation_jobs SET status = 'error', updated_at = NOW() WHERE id = ${genId}
    `
  } catch {}
}
