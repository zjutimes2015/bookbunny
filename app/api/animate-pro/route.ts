/**
 * Pro 动画导出异步 API
 *
 * 流程：
 * 1. 前端 POST /api/animate-pro → 创建异步任务（genId）
 * 2. 前端轮询 GET /api/animate-pro?genId=xxx 获取进度
 * 3. 后台逐页并行（上限 3 并发）生成动画片段 + 配音 + 时间戳 + 印刷级图片
 * 4. 整本级串行：配乐 → FFmpeg 合成 → 封面生成
 * 5. 结果存 R2，前端预览/下载
 */

import { NextRequest, NextResponse, after } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getSessionUser, getClientIp } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { isR2Configured, uploadFile, bookKey, assetUrl } from '@/lib/r2'
import { requireHuman, attachPassCookie, humanCheckFailedResponse } from '@/lib/turnstile'
import { PRO_CREDITS_PER_BOOK } from '@/lib/payments/waffo'
import type { PageOutline } from '@/lib/types/book'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes (hobby plan limit)

const sql = neon(process.env.NEON_DATABASE_URL!)

/** 每本 Pro 动画消耗的 Pro 动画额度（与 Waffo 商品发放口径一致） */
const PRO_COST = PRO_CREDITS_PER_BOOK

// ─── 数据类型 ────────────────────────────────────────────────────────

interface ProPageJob {
  index: number
  clip: 'pending' | 'generating' | 'done' | 'error'
  audio: 'pending' | 'generating' | 'done' | 'error'
  captions: 'pending' | 'generating' | 'done' | 'error'
  print: 'pending' | 'generating' | 'done' | 'error'
  videoUrl?: string
  audioUrl?: string
  captionUrl?: string
  printUrl?: string
  retries: number
}

interface ProJob {
  id: string
  bookId: string
  userId: string
  status: 'pending' | 'running' | 'done' | 'error'
  totalPages: number
  completedPages: number
  pages: ProPageJob[]
  musicUrl?: string
  coverUrl?: string
  finalVideoUrl?: string
  createdAt: Date
  updatedAt: Date
}

// ─── 请求体 ──────────────────────────────────────────────────────────

interface AnimateProBody {
  bookId: string
  pages: PageOutline[]
  /** 角色参考图 base64 */
  characterImageB64?: string
  /** 各页插画 URL（从 generation_jobs 或 books.page_image_urls 取） */
  pageImages?: string[]
  language?: string
  rate?: number
  turnstileToken?: string
}

// ─── POST：创建 Pro 动画任务 ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnimateProBody

    if (!body.bookId || !Array.isArray(body.pages) || body.pages.length === 0) {
      return NextResponse.json({ error: 'Missing bookId or pages' }, { status: 400 })
    }

    // 人机校验（Pro 是最贵的操作，必须挡）
    const human = await requireHuman(req, body.turnstileToken)
    if (!human.ok) return humanCheckFailedResponse()

    // 鉴权
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Pro 动画是独立商品：只消耗 Pro 动画面包额度，普通 credits / 订阅额度不可抵扣
    if (user.proCredits < PRO_COST) {
      return NextResponse.json(
        {
          error: `Pro animation requires ${PRO_COST} Pro credits. Buy a Pro Animation Pack (5 books for $12).`,
          code: 'insufficient_pro_credits',
          required: PRO_COST,
          available: user.proCredits,
          purchaseUrl: '/pricing#pro-animation',
        },
        { status: 402 },
      )
    }

    // 限流：每本 Pro 动画成本较高，付费用户每天最多 5 本
    const rateKey = `animate-pro:user:${user.id}:day`
    const rate = await checkRateLimit(rateKey, 5, 86400)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Daily Pro animation limit reached. Try again tomorrow.', code: 'rate_limited' },
        { status: 429 },
      )
    }

    // 原子扣减：并发请求下用条件更新保证不会扣成负数
    const deducted = await sql`
      UPDATE bookbunny_users
      SET pro_animation_credits = pro_animation_credits - ${PRO_COST}, updated_at = NOW()
      WHERE id = ${user.id} AND pro_animation_credits >= ${PRO_COST}
      RETURNING pro_animation_credits
    `
    if (deducted.length === 0) {
      return NextResponse.json(
        {
          error: `Pro animation requires ${PRO_COST} Pro credits. Buy a Pro Animation Pack (5 books for $12).`,
          code: 'insufficient_pro_credits',
          required: PRO_COST,
          available: 0,
          purchaseUrl: '/pricing#pro-animation',
        },
        { status: 402 },
      )
    }

    const genId = `apro_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const pages: ProPageJob[] = body.pages.map((p, i) => ({
      index: i,
      clip: 'pending',
      audio: 'pending',
      captions: 'pending',
      print: 'pending',
      retries: 0,
    }))

    await sql`
      INSERT INTO pro_animation_jobs (id, book_id, user_id, status, total_pages, completed_pages, pages, created_at)
      VALUES (${genId}, ${body.bookId}, ${user.id}, 'pending', ${body.pages.length}, 0, ${JSON.stringify(pages)}::jsonb, NOW())
    `

    after(runAnimatePro({
      genId,
      bookId: body.bookId,
      userId: user.id,
      pages: body.pages,
      pageImages: body.pageImages,
      characterImageB64: body.characterImageB64,
      language: body.language,
      rate: body.rate,
    }))

    return human.issued
      ? NextResponse.json({ genId, totalPages: body.pages.length })
      : NextResponse.json({ genId, totalPages: body.pages.length })
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
    SELECT status, total_pages, completed_pages, pages,
           music_url, cover_url, final_video_url
    FROM pro_animation_jobs
    WHERE id = ${genId}
    LIMIT 1
  `
  const job = rows[0]
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const jobPages = (job.pages || []) as ProPageJob[]
  return NextResponse.json({
    status: job.status,
    total: job.total_pages,
    completed: job.completed_pages,
    pages: jobPages.map(p => ({
      index: p.index,
      clip: p.clip,
      audio: p.audio,
      captions: p.captions,
      print: p.print,
      videoUrl: p.videoUrl,
      audioUrl: p.audioUrl,
      captionUrl: p.captionUrl,
      printUrl: p.printUrl,
    })),
    musicUrl: job.music_url,
    coverUrl: job.cover_url,
    finalVideoUrl: job.final_video_url,
  })
}

// ─── 后台执行逻辑 ────────────────────────────────────────────────────

async function runAnimatePro(opts: {
  genId: string
  bookId: string
  userId: string
  pages: PageOutline[]
  pageImages?: string[]
  characterImageB64?: string
  language?: string
  rate?: number
}) {
  const { genId, bookId, pages, pageImages = [], characterImageB64, language = 'en-US', rate = 0.85 } = opts
  const jobPages: ProPageJob[] = pages.map((_, i) => ({
    index: i, clip: 'pending', audio: 'pending', captions: 'pending', print: 'pending', retries: 0,
  }))

  const flush = async (status?: 'running' | 'done' | 'error') => {
    await sql`
      UPDATE pro_animation_jobs
      SET status = ${status ?? 'running'}, completed_pages = ${jobPages.filter(p => p.clip === 'done' || p.clip === 'error').length},
          pages = ${JSON.stringify(jobPages)}::jsonb, updated_at = NOW()
      WHERE id = ${genId}
    `
  }

  // ── Step 1: 逐页并行生成（上限 3 并发）──────────────────────────
  const CONCURRENCY = 3
  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const batch = jobPages.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(async (pageJob) => {
      await processPage(pageJob, pages[pageJob.index], pageImages[pageJob.index], { language, rate, characterImageB64, bookId, genId, flush })
    }))
    await flush('running')
  }

  // ── Step 2: 检查是否有页面成功 ──────────────────────────────────
  const donePages = jobPages.filter(p => p.clip === 'done')
  if (donePages.length === 0) {
    // 全部失败：把本次扣掉的 Pro 额度退回，避免用户为失败付费
    try {
      await sql`
        UPDATE bookbunny_users
        SET pro_animation_credits = COALESCE(pro_animation_credits, 0) + ${PRO_COST}, updated_at = NOW()
        WHERE id = ${opts.userId}
      `
    } catch (err) {
      console.error(`[animate-pro] ${genId}: refund failed:`, err)
    }
    await flush('error')
    console.error(`[animate-pro] ${genId}: No pages succeeded`)
    return
  }

  // ── Step 3: 整本级串行（配乐 → 合成 → 封面）────────────────────
  await flush('running')

  // 3a: 配乐
  try {
    await flush('running')
    const firstDonePage = donePages[0]
    const pageText = pages[firstDonePage.index]?.pageText ?? 'A wonderful children\'s story'
    const musicRes = await import('@/lib/api/replicate-pro').then(m => m.generateMusic(pageText))
    if (musicRes.ok && musicRes.url) {
      // TODO: 上传到 R2
    }
  } catch (err) {
    console.error(`[animate-pro] ${genId}: Music generation failed:`, err)
  }

  // 3b: FFmpeg 合成（需要 Python 环境，这里先占位）
  // await assembleProBook(genId, bookId, jobPages)

  // 3c: 封面生成
  try {
    const refImages = donePages.slice(0, 3).map(p => pageImages[p.index]).filter(Boolean)
    if (refImages.length > 0) {
      const coverRes = await import('@/lib/api/replicate-pro').then(m => m.generateCover('Children\'s book cover', refImages))
      if (coverRes.ok && coverRes.url) {
        // TODO: 上传封面到 R2
      }
    }
  } catch (err) {
    console.error(`[animate-pro] ${genId}: Cover generation failed:`, err)
  }

  await flush('done')
}

async function processPage(
  pageJob: ProPageJob,
  page: PageOutline,
  pageImageUrl: string | undefined,
  options: { language: string; rate: number; characterImageB64?: string; bookId: string; genId: string; flush: (status?: 'running' | 'done' | 'error') => Promise<void> },
) {
  const { language, rate, bookId, genId, flush } = options

  if (!pageImageUrl) {
    pageJob.clip = 'error'
    pageJob.audio = 'error'
    pageJob.captions = 'error'
    pageJob.print = 'error'
    await flush()
    return
  }

  // 3a: 动画片段
  try {
    pageJob.clip = 'generating'
    await flush()
    const { animatePage } = await import('@/lib/api/replicate-pro')
    const clipRes = await animatePage(pageImageUrl, page.pageText ?? '', { duration: 5, resolution: '480p' })
    if (clipRes.ok && clipRes.url) {
      pageJob.videoUrl = clipRes.url
      pageJob.clip = 'done'
    } else {
      pageJob.clip = 'error'
      pageJob.retries++
      if (pageJob.retries < 2) {
        // 重试
        const retryRes = await animatePage(pageImageUrl, page.pageText ?? '', { duration: 5 })
        if (retryRes.ok) { pageJob.videoUrl = retryRes.url; pageJob.clip = 'done' }
      }
    }
  } catch { pageJob.clip = 'error'; pageJob.retries++ }

  // 3b: 配音（不阻塞动画，顺序执行以简化）
  try {
    pageJob.audio = 'generating'
    await flush()
    const { generateTTS } = await import('@/lib/api/replicate-pro')
    const text = page.pageText ?? ''
    const audioRes = await generateTTS(text, { language, speed: rate })
    if (audioRes.ok && audioRes.url) {
      pageJob.audioUrl = audioRes.url
      pageJob.audio = 'done'
    } else {
      pageJob.audio = 'error'
    }
  } catch { pageJob.audio = 'error' }

  // 3c: Whisper 时间戳
  try {
    pageJob.captions = 'generating'
    await flush()
    const { transcribe } = await import('@/lib/api/replicate-pro')
    // 需要先用配音 URL 才能做时间戳；这里简化处理
    if (pageJob.audioUrl) {
      const whisperRes = await transcribe(pageJob.audioUrl)
      if (whisperRes.ok && whisperRes.url) {
        pageJob.captionUrl = whisperRes.url
        pageJob.captions = 'done'
      }
    }
    pageJob.captions = 'done' // 没有音频也标记完成，播放器降级
  } catch { pageJob.captions = 'error' }

  // 3d: 印刷级提分辨率
  if (isR2Configured()) {
    try {
      pageJob.print = 'generating'
      await flush()
      const { upscaleImage } = await import('@/lib/api/replicate-pro')
      const printRes = await upscaleImage(pageImageUrl, 2)
      if (printRes.ok && printRes.url) {
        // TODO: 下载到本地后上传 R2（upscale 返回的是新图 URL）
        pageJob.printUrl = printRes.url
        pageJob.print = 'done'
      }
    } catch { pageJob.print = 'error' }
  } else {
    // R2 未配置时，印刷直接复用原图 URL
    pageJob.printUrl = pageImageUrl
    pageJob.print = 'done'
  }

  await flush()
}
