import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, pages, author, size } = body

    if (!title || !pages || !Array.isArray(pages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Format data for the PDF generator
    const bookData = {
      title,
      author: author || 'BookBunny',
      size: size || '8.5x8.5',
      pages: pages.map((p: string | { text: string; characters?: string[] }) => ({
        text: typeof p === 'string' ? p : p.text,
        characters: typeof p === 'string' ? [] : (p.characters || []),
      })),
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
