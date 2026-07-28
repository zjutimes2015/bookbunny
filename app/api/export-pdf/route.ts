import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, pages } = await req.json()

    if (!title || !pages || !Array.isArray(pages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // MVP: Generate a simple HTML page that serves as the book preview
    // In production, this would use WeasyPrint or similar for proper PDF
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { margin: 0; size: 8.5in 8.5in; }
    body { margin: 0; font-family: 'Inter', sans-serif; }
    .page { 
      width: 8.5in; height: 8.5in; 
      display: flex; flex-direction: column;
      justify-content: center; align-items: center;
      page-break-after: always;
      background: #FFF5EE;
      padding: 0.75in;
      box-sizing: border-box;
    }
    h1 { font-size: 36pt; color: #2D2D2D; text-align: center; }
    .page-num { font-size: 11pt; color: #8E8E93; margin-top: 20px; }
    .text { font-size: 18pt; color: #2D2D2D; line-height: 1.6; text-align: center; max-width: 6in; }
  </style>
</head>
<body>
  <div class="page">
    <br><br><br>
    <div style="font-size:60pt;margin-bottom:30px;">📖</div>
    <h1>${title}</h1>
    <p style="color:#8E8E93;font-size:14pt;">A BookBunny Story</p>
  </div>
  ${pages.map((page: string, i: number) => `
  <div class="page">
    <div class="text">${page}</div>
    <div class="page-num">${i + 1}</div>
  </div>`).join('')}
  <div class="page">
    <div style="font-size:48pt;margin-bottom:20px;">⭐</div>
    <h2 style="font-size:24pt;color:#2D2D2D;">The End</h2>
    <p style="color:#8E8E93;font-size:12pt;margin-top:10px;">Created with BookBunny</p>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.html"`,
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
