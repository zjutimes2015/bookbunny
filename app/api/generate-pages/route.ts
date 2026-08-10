import { NextRequest, NextResponse } from 'next/server'

const store = new Map<string, {
  total: number; completed: number; status: string
  pages: { index: number; status: string; imageB64?: string }[]
}>()

export async function POST(req: NextRequest) {
  try {
    const { title, pages, characterImageB64, refSeed, style } = await req.json()
    if (!pages || !Array.isArray(pages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const genId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    store.set(genId, {
      total: pages.length, completed: 0, status: 'running',
      pages: pages.map(() => ({ index: 0, status: 'pending' })),
    })

    // Fire and forget
    runGeneration(genId, pages, characterImageB64).catch(console.error)

    return NextResponse.json({ genId, total: pages.length })
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

async function runGeneration(genId: string, pages: string[], characterImageB64?: string) {
  const state = store.get(genId)
  if (!state) return

  const OR_KEY = process.env.OPENROUTER_API_KEY
  const style = ', childrens book illustration, soft watercolor style, warm colors, storybook quality'

  for (let i = 0; i < pages.length; i++) {
    const text = typeof pages[i] === 'string' ? pages[i] : (pages[i] as any)?.text || ''
    state.pages[i] = { index: i, status: 'generating' }

    try {
      const body: Record<string, unknown> = {
        model: 'black-forest-labs/flux.2-flex',
        prompt: `${text}${style}`,
        n: 1, size: '1024x1024',
      }
      if (characterImageB64) body.image = `data:image/png;base64,${characterImageB64}`

      const res = await fetch('https://openrouter.ai/api/v1/images/generations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OR_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`FLUX error ${res.status}`)
      const data = await res.json()
      const b64 = data.data?.[0]?.b64_json
      if (b64) {
        state.pages[i] = { index: i, status: 'done', imageB64: b64 }
      } else {
        throw new Error('No image data')
      }
    } catch (err) {
      state.pages[i] = { index: i, status: 'failed' }
    }

    state.completed = state.pages.filter(p => p.status === 'done' || p.status === 'failed').length
  }

  state.status = state.pages.every(p => p.status === 'done') ? 'done' : 'error'
}
