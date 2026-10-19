import { PDFDocument } from 'pdf-lib'
import { buildInteriorPdf, buildCoverPdf, type KdpPageInput } from '@/lib/kdp/export'
import { padToKdpPageCount, type KdpPaper } from '@/lib/kdp/spec'
import type { PageOutline } from '@/lib/types/book'

// Vercel 函数请求体上限约 4.5MB：整本 24 页的 base64 图片往往超过该上限，
// 因此超大体积的导出请走客户端路径（/create 页在浏览器内直接调用 lib/kdp/export）。
// 本路由为纯 TS 薄封装，保留给自动化 / 小体量场景，几何与生成逻辑全部来自 lib/kdp/export。
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      title, author, outline, pages: rawPages,
      images, trim = '8.5x8.5', paper = 'white', exportType = 'interior',
    } = body as {
      title?: string
      author?: string
      outline?: PageOutline[]
      pages?: (string | { text?: string })[]
      images?: Record<string | number, string>
      trim?: string
      paper?: KdpPaper
      exportType?: 'interior' | 'cover' | 'both'
    }

    if (!title) {
      return Response.json({ error: 'Missing title' }, { status: 400 })
    }

    // outline 文本 + 图片（key 为绝对页码）合成 KdpPageInput[]
    const outlineList = Array.isArray(outline) ? outline : []
    const imgMap: Record<string, string> = images ? { ...images } as Record<string, string> : {}

    const maxOutline = outlineList.reduce((m, p) => Math.max(m, p.pageNumber || 0), 0)
    const maxImage = Object.keys(imgMap).reduce((m, k) => Math.max(m, Number(k) || 0), 0)
    const maxPage = Math.max(maxOutline, maxImage, Array.isArray(rawPages) ? rawPages.length : 0)

    const pageInputs: KdpPageInput[] = []
    for (let n = 1; n <= maxPage; n++) {
      const o = outlineList.find(p => p.pageNumber === n)
      const legacy = Array.isArray(rawPages) ? rawPages[n - 1] : undefined
      const legacyText = typeof legacy === 'string' ? legacy : legacy?.text
      pageInputs.push({
        text: o?.pageText ?? legacyText,
        imageDataUrl: imgMap[String(n)],
      })
    }

    const pageCount = padToKdpPageCount(pageInputs.length)
    let bytes: Uint8Array

    if (exportType === 'cover') {
      bytes = await buildCoverPdf({ title, author, pages: pageCount, trim, paper })
    } else if (exportType === 'both') {
      // 自动化场景：把封面页与内页合并成一个文件（封面在前）。
      // 注意：KDP 实际上传要求内页与封面为两个独立文件，正式交付请分别下载。
      const interiorBytes = await buildInteriorPdf({ title, author, pages: pageInputs, trim, paper })
      const coverBytes = await buildCoverPdf({ title, author, pages: pageCount, trim, paper })
      const merged = await PDFDocument.create()
      const coverDoc = await PDFDocument.load(coverBytes)
      for (const p of await merged.copyPages(coverDoc, coverDoc.getPageIndices())) merged.addPage(p)
      const interiorDoc = await PDFDocument.load(interiorBytes)
      for (const p of await merged.copyPages(interiorDoc, interiorDoc.getPageIndices())) merged.addPage(p)
      bytes = await merged.save()
    } else {
      bytes = await buildInteriorPdf({ title, author, pages: pageInputs, trim, paper })
    }

    const slug = title.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'book'
    const suffix = exportType === 'cover' ? 'cover' : exportType === 'both' ? 'book' : 'interior'

    // 转成纯粹的 ArrayBuffer（pdf-lib 的 Uint8Array 在 TS 5.7 下不能直接作为 BodyInit）
    const pdfBody = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer

    return new Response(pdfBody, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${slug}-${suffix}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF export error:', err)
    return Response.json({ error: 'PDF export failed' }, { status: 500 })
  }
}
