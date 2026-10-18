import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import type { PageOutline } from '@/lib/types/book'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, pages, outline } = body

    const hasOutline = Array.isArray(outline) && outline.length > 0
    const hasPages = Array.isArray(pages)

    if (!title || (!hasOutline && !hasPages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // 统一取每页文字：outline 取 pageText；pages 兼容 string / {text} 两种旧格式
    const pageList: { text: string }[] = hasOutline
      ? (outline as PageOutline[]).map(p => ({ text: p.pageText }))
      : (pages as (string | { text: string })[]).map(p => typeof p === 'string' ? { text: p } : p)

    const bookData = { title, pages: pageList }
    const tmpInput = join('/tmp', `bb_vid_${Date.now()}_in.json`)
    const tmpOutput = join('/tmp', `bb_vid_${Date.now()}.mp4`)
    writeFileSync(tmpInput, JSON.stringify(bookData))

    try {
      const svc = join(process.cwd(), 'pdf-service', 'video.py')
      execSync(`python3 "${svc}" "${tmpInput}" "${tmpOutput}"`, { timeout: 60000, stdio: 'pipe' })
      const fs = await import('fs/promises')
      const buf = await fs.readFile(tmpOutput)
      try { unlinkSync(tmpInput) } catch {}
      try { unlinkSync(tmpOutput) } catch {}
      if (tmpOutput.endsWith('.html')) {
        return new NextResponse(buf.toString(), { headers: { 'Content-Type': 'text/html' } })
      }
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4"`,
        },
      })
    } catch (e) {
      try { unlinkSync(tmpInput) } catch {}
      try { unlinkSync(tmpOutput) } catch {}
      throw e
    }
  } catch (err) {
    console.error('Video export error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Video generation failed' },
      { status: 500 }
    )
  }
}
