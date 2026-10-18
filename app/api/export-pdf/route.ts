import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import type { PageOutline } from '@/lib/types/book'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, pages, outline, author, size } = body

    const hasOutline = Array.isArray(outline) && outline.length > 0
    const hasPages = Array.isArray(pages)

    if (!title || (!hasOutline && !hasPages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // 统一取每页文字：outline 取 pageText；pages 兼容 string / {text} 两种旧格式
    const pageList: { text: string; characters: string[] }[] = hasOutline
      ? (outline as PageOutline[]).map(p => ({
          text: p.pageText,
          characters: Array.isArray(p.characters) ? p.characters : [],
        }))
      : (pages as (string | { text: string; characters?: string[] })[]).map(p =>
          typeof p === 'string'
            ? { text: p, characters: [] }
            : { text: p.text, characters: p.characters || [] },
        )

    // Format data for the PDF generator
    const bookData = {
      title,
      author: author || 'BookBunny',
      size: size || '8.5x8.5',
      pages: pageList,
    }

    // Call Python PDF generator
    const tmpInput = join('/tmp', `bookbunny_${Date.now()}_input.json`)
    const tmpOutput = join('/tmp', `bookbunny_${Date.now()}.pdf`)
    writeFileSync(tmpInput, JSON.stringify(bookData))

    try {
      const pdfServicePath = join(process.cwd(), 'pdf-service', 'generate.py')
      execSync(`python3 "${pdfServicePath}" "${tmpInput}" "${tmpOutput}"`, {
        timeout: 30000,
        stdio: 'pipe',
      })

      // Read the generated PDF
      const fs = await import('fs/promises')
      const pdfBuffer = await fs.readFile(tmpOutput)

      // Cleanup temp files
      try { unlinkSync(tmpInput) } catch {}
      try { unlinkSync(tmpOutput) } catch {}

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      })
    } catch (e) {
      // Cleanup on error
      try { unlinkSync(tmpInput) } catch {}
      try { unlinkSync(tmpOutput) } catch {}
      throw e
    }
  } catch (err) {
    console.error('PDF export error:', err)
    // Fallback: return HTML if PDF fails
    const body = await req.json().catch(() => ({ title: 'Book', pages: [] }))
    const fallbackHtml = generateFallbackHtml(body)
    return new NextResponse(fallbackHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="book.html"`,
      },
    })
  }
}

function generateFallbackHtml(data: { title?: string; pages?: string[] | { text: string }[] }) {
  const title = data.title || 'My Book'
  const pages = data.pages || []
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { margin: 0; size: 8.5in 8.5in; }
  body { margin: 0; font-family: Inter, sans-serif; }
  .page { width: 8.5in; height: 8.5in; display: flex; flex-direction: column;
    justify-content: center; align-items: center; page-break-after: always;
    background: #FFF5EE; padding: 0.75in; box-sizing: border-box; }
  h1 { font-size: 36pt; color: #2D2D2D; }
  .text { font-size: 18pt; color: #2D2D2D; line-height: 1.6; text-align: center; max-width: 6in; }
</style></head><body>
  <div class="page"><h1>${title}</h1></div>
  ${pages.map((p: string | { text: string }) => {
    const text = typeof p === 'string' ? p : p.text
    return `<div class="page"><div class="text">${text}</div></div>`
  }).join('')}
  <div class="page"><h2>The End</h2></div>
</body></html>`
}
