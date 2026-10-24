import { NextRequest, NextResponse, after } from 'next/server'
import { sql } from '@/lib/neon'
import {
  pagesToOutline,
  ASPECT_SIZE,
  DEFAULT_ASPECT,
  normalizeAspect,
  type PageOutline,
  type StyleLexicon,
} from '@/lib/types/book'
import { getSessionUser, getClientIp } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { isR2Configured, uploadBase64Image, bookKey, keyFromAssetUrl, getObjectFile } from '@/lib/r2'
import { requireHuman, attachPassCookie, humanCheckFailedResponse } from '@/lib/turnstile'

export const runtime = 'nodejs'
export const maxDuration = 300

/** 单次生图请求的页数上限（客户端传入的 outline 必须封顶，否则一次请求就能烧掉整月毛利） */
const MAX_PAGES_PER_REQUEST = 24

interface JobPage {
  index: number
  status: 'pending' | 'generating' | 'done' | 'failed'
  imageUrl?: string
  imageB64?: string
}

// 硬编码风格后缀：仅在既无 styleLexicon、也无 style 参数、也无 visualStyle 时兜底
const FALLBACK_STYLE = ', childrens book illustration, soft watercolor style, warm colors, storybook quality'

// 文档 5.7：批量/试生成统一硬性约束——同一风格、不出文字、预留排版留白、每页只表达一个核心情节点
const BOOK_CONSTRAINTS = 'consistent art style across the whole book, no text, no letters, no words in the image, leave clean empty space for text layout, one single core story moment per page'

/** 由风格词库 6 类拼装前缀（插画技法/色彩氛围/角色造型/场景复杂度/画面质感/禁止项） */
function buildStylePrefix(lexicon?: StyleLexicon): string {
  if (!lexicon) return ''
  return [
    lexicon.technique,
    lexicon.colorMood,
    lexicon.characterStyling,
    lexicon.sceneComplexity,
    lexicon.texture,
    lexicon.forbidden,
  ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0).join(', ')
}

/**
 * 由表B（视觉与生图）字段拼装单页生图 prompt。
 * consistencyLine：角色一致性固定句，每页都注入，锁定主角长相。
 */
function buildPrompt(
  page: PageOutline,
  providedStyle?: string,
  styleLexicon?: StyleLexicon,
  consistencyLine?: string,
): string {
  const prefix = buildStylePrefix(styleLexicon)

  const parts = [
    page.pageText,
    page.visualStyle,
    page.colorMood,
    page.coreVisualElements?.join(', '),
    page.supportingVisualElements?.join(', '),
    page.composition,
    page.textWhitespace,
    page.forbiddenElements?.length ? `avoid: ${page.forbiddenElements.join(', ')}` : '',
    page.imagePromptPoints,
  ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0)

  let styleSuffix = ''
  if (!page.visualStyle) {
    if (providedStyle) styleSuffix = providedStyle
    else if (!styleLexicon) styleSuffix = FALLBACK_STYLE
  }

  return [prefix, consistencyLine, ...parts, BOOK_CONSTRAINTS, styleSuffix]
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .join(', ')
}

/** 调用 FLUX 生图，返回 base64（失败抛错） */
async function callFlux(prompt: string, size: string, image?: string): Promise<string> {
  const OR_KEY = process.env.OPENROUTER_API_KEY
  const body: Record<string, unknown> = {
    model: 'black-forest-labs/flux.2-flex',
    prompt,
    n: 1,
    size,
  }
  if (image) body.image = image

  const res = await fetch('https://openrouter.ai/api/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OR_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`FLUX error ${res.status}`)
  const data = await res.json()
  const b64 = data.data?.[0]?.b64_json
  if (!b64) throw new Error('No image data')
  return b64 as string
}

/**
 * 续集场景拿不到内存里的 base64，只有 R2 资源地址：
 * 按地址反推 key 取回字节，让主角参考图跨集复用，长相不漂移。
 */
async function referenceBase64FromUrl(url?: string | null): Promise<string | undefined> {
  const key = keyFromAssetUrl(url)
  if (!key) return undefined
  const file = await getObjectFile(key)
  if (!file) return undefined
  return Buffer.from(file.body).toString('base64')
}

export async function POST(req: NextRequest) {
  try {
    const { outline, pages, characterImageB64, characterImageUrl, style, styleLexicon, consistencyLine, aspect, language, bookId, turnstileToken } =
      await req.json()
    void language

    const pageOutline: PageOutline[] = Array.isArray(outline)
      ? outline
      : Array.isArray(pages) ? pagesToOutline(pages) : []

    if (pageOutline.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // 单次请求的页数上限：outline 完全由客户端传入，不封顶的话
    // 一次请求就能触发几百张生图，直接击穿毛利。上限取 24 页
    // （整本最大 12 页 + 批量生成余量），足够所有正常流程。
    if (pageOutline.length > MAX_PAGES_PER_REQUEST) {
      return NextResponse.json(
        {
          error: `Too many pages in one request (max ${MAX_PAGES_PER_REQUEST}).`,
          code: 'too_many_pages',
        },
        { status: 400 },
      )
    }

    // 人机校验：生图是最贵的一步，必须挡在服务端
    const human = await requireHuman(req, turnstileToken)
    if (!human.ok) return humanCheckFailedResponse()

    // 鉴权 + 限流：付费用户额度最高，登录免费用户次之，游客只能跑一次试生成
    const user = await getSessionUser(req)
    const limit = user
      ? user.isPaid || user.tier !== 'free' ? 300 : 20
      : 5
    const rateKey = user ? `gen:user:${user.id}:day` : `gen:ip:${getClientIp(req)}:day`
    const rate = await checkRateLimit(rateKey, limit, 86400)
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: user
            ? 'Daily illustration limit reached. Try again tomorrow or upgrade your plan.'
            : 'Free trial limit reached. Sign in to keep creating books.',
          code: 'rate_limited',
        },
        { status: 429 },
      )
    }

    const size = ASPECT_SIZE[normalizeAspect(aspect)] ?? ASPECT_SIZE[DEFAULT_ASPECT]
    const genId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const jobPages: JobPage[] = pageOutline.map(p => ({
      index: p.pageNumber,
      status: 'pending',
    }))

    await sql`
      INSERT INTO generation_jobs (id, book_id, status, total, completed, pages)
      VALUES (${genId}, ${bookId || null}, 'running', ${pageOutline.length}, 0, ${JSON.stringify(jobPages)}::jsonb)
    `

    // 响应返回后继续执行（Vercel 上不会被立即冻结）
    const referenceB64 =
      typeof characterImageB64 === 'string' && characterImageB64
        ? characterImageB64
        : await referenceBase64FromUrl(characterImageUrl)

    after(
      runGeneration({
        genId,
        bookId: typeof bookId === 'string' ? bookId : null,
        outline: pageOutline,
        characterImageB64: referenceB64,
        style,
        styleLexicon,
        consistencyLine,
        size,
      }),
    )

    const res = NextResponse.json({ genId, total: pageOutline.length, size })
    return human.issued ? attachPassCookie(res) : res
  } catch (err) {
    console.error('Generate pages error:', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const genId = req.nextUrl.searchParams.get('genId')
  if (!genId) return NextResponse.json({ error: 'Missing genId' }, { status: 400 })

  const rows = await sql`
    SELECT status, total, completed, pages
    FROM generation_jobs
    WHERE id = ${genId}
    LIMIT 1
  `
  const job = rows[0]
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const jobPages = (job.pages || []) as JobPage[]
  return NextResponse.json({
    status: job.status,
    total: job.total,
    completed: job.completed,
    pages: jobPages.map(p => ({
      index: p.index,
      status: p.status,
      imageUrl: p.status === 'done' ? p.imageUrl : undefined,
      imageB64: p.status === 'done' ? p.imageB64 : undefined,
    })),
  })
}

async function runGeneration(opts: {
  genId: string
  bookId: string | null
  outline: PageOutline[]
  characterImageB64?: string
  style?: string
  styleLexicon?: StyleLexicon
  consistencyLine?: string
  size: string
}) {
  const { genId, bookId, outline, characterImageB64, style, styleLexicon, consistencyLine, size } = opts
  const pages: JobPage[] = outline.map(p => ({ index: p.pageNumber, status: 'pending' }))
  const refImage = characterImageB64 ? `data:image/png;base64,${characterImageB64}` : undefined
  const canUpload = isR2Configured() && !!bookId
  let completed = 0

  const flush = async (status: 'running' | 'done' | 'error') => {
    await sql`
      UPDATE generation_jobs
      SET status = ${status}, completed = ${completed}, pages = ${JSON.stringify(pages)}::jsonb, updated_at = NOW()
      WHERE id = ${genId}
    `
  }

  for (let i = 0; i < outline.length; i++) {
    const prompt = buildPrompt(outline[i], style, styleLexicon, consistencyLine)
    pages[i] = { index: outline[i].pageNumber, status: 'generating' }
    await flush('running')

    try {
      let b64: string
      try {
        b64 = await callFlux(prompt, size, refImage)
      } catch (err) {
        // 非默认尺寸失败时，回退到安全尺寸 1024x1024 再试一次
        if (size !== ASPECT_SIZE[DEFAULT_ASPECT]) {
          b64 = await callFlux(prompt, ASPECT_SIZE[DEFAULT_ASPECT], refImage)
        } else {
          throw err
        }
      }

      let imageUrl: string | undefined
      if (canUpload) {
        try {
          imageUrl = await uploadBase64Image(
            bookKey(bookId!, 'page', outline[i].pageNumber),
            `data:image/png;base64,${b64}`,
          )
        } catch (err) {
          console.error('R2 upload failed for page', outline[i].pageNumber, err)
        }
      }

      pages[i] = imageUrl
        ? { index: outline[i].pageNumber, status: 'done', imageUrl }
        : { index: outline[i].pageNumber, status: 'done', imageB64: b64 }
    } catch {
      pages[i] = { index: outline[i].pageNumber, status: 'failed' }
    }

    completed = pages.filter(p => p.status === 'done' || p.status === 'failed').length
    await flush('running')
  }

  const allDone = pages.every(p => p.status === 'done')
  await flush(allDone ? 'done' : 'error')

  if (bookId) {
    await persistBookImages(bookId, pages)
  }
}

/** 把本批图片 URL 按「页码-1」写入 books.page_image_urls（保留其它批次已有值） */
async function persistBookImages(bookId: string, pages: JobPage[]) {
  try {
    const rows = await sql`SELECT page_image_urls FROM books WHERE id = ${bookId} LIMIT 1`
    if (rows.length === 0) return

    const urls: string[] = Array.isArray(rows[0].page_image_urls) ? [...rows[0].page_image_urls] : []
    for (const p of pages) {
      if (!p.imageUrl) continue
      const idx = Math.max(0, p.index - 1)
      while (urls.length <= idx) urls.push('')
      urls[idx] = p.imageUrl
    }

    await sql`UPDATE books SET page_image_urls = ${urls} WHERE id = ${bookId}`
  } catch (err) {
    console.error('Persist book images failed:', err)
  }
}
