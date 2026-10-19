import { NextRequest, NextResponse } from 'next/server'
import {
  pagesToOutline,
  ASPECT_SIZE,
  DEFAULT_ASPECT,
  normalizeAspect,
  type PageOutline,
  type StyleLexicon,
} from '@/lib/types/book'

const store = new Map<string, {
  total: number; completed: number; status: string
  pages: { index: number; status: string; imageB64?: string }[]
}>()

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

export async function POST(req: NextRequest) {
  try {
    // language: 生图接口同样接受内容语言参数（仅用于接口统一，生图 prompt 恒为英文）
    const { outline, pages, characterImageB64, refSeed, style, styleLexicon, consistencyLine, aspect, language } =
      await req.json()
    void language

    const pageOutline: PageOutline[] = Array.isArray(outline)
      ? outline
      : Array.isArray(pages) ? pagesToOutline(pages) : []

    if (pageOutline.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const size = ASPECT_SIZE[normalizeAspect(aspect)] ?? ASPECT_SIZE[DEFAULT_ASPECT]
    const genId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    store.set(genId, {
      total: pageOutline.length, completed: 0, status: 'running',
      // index 采用绝对页码 outline[i].pageNumber（而非数组下标），
      // 便于客户端分批提交子集后按绝对页码合并到整本图片数组
      pages: pageOutline.map(p => ({ index: p.pageNumber, status: 'pending' })),
    })

    // Fire and forget
    runGeneration(genId, pageOutline, characterImageB64, style, styleLexicon, consistencyLine, size)
      .catch(console.error)

    return NextResponse.json({ genId, total: pageOutline.length, size })
  } catch (err) {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const genId = req.nextUrl.searchParams.get('genId')
  const state = genId ? store.get(genId) : null
  if (!state) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const done = state.status === 'done' || state.status === 'error'
  const result = {
    status: state.status, total: state.total, completed: state.completed,
    pages: state.pages.map(p => ({
      index: p.index, status: p.status,
      imageB64: p.status === 'done' ? p.imageB64 : undefined,
    })),
  }

  if (done && genId) setTimeout(() => store.delete(genId), 10000)
  return NextResponse.json(result)
}

async function runGeneration(
  genId: string,
  outline: PageOutline[],
  characterImageB64?: string,
  providedStyle?: string,
  styleLexicon?: StyleLexicon,
  consistencyLine?: string,
  size: string = ASPECT_SIZE[DEFAULT_ASPECT],
) {
  const state = store.get(genId)
  if (!state) return

  const refImage = characterImageB64 ? `data:image/png;base64,${characterImageB64}` : undefined

  for (let i = 0; i < outline.length; i++) {
    const prompt = buildPrompt(outline[i], providedStyle, styleLexicon, consistencyLine)
    const pageNo = outline[i].pageNumber
    state.pages[i] = { index: pageNo, status: 'generating' }

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
      state.pages[i] = { index: pageNo, status: 'done', imageB64: b64 }
    } catch {
      state.pages[i] = { index: pageNo, status: 'failed' }
    }

    state.completed = state.pages.filter(p => p.status === 'done' || p.status === 'failed').length
  }

  state.status = state.pages.every(p => p.status === 'done') ? 'done' : 'error'
}
