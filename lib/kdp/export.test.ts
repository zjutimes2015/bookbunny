import { describe, it, expect } from 'vitest'
import { PDFDocument, PDFArray } from 'pdf-lib'
import { inflateSync } from 'node:zlib'
import { buildInteriorPdf, buildCoverPdf } from './export'

/**
 * 从生成的 PDF 字节里取出所有页面内容流，拼成可搜索文本。
 *
 * pdf-lib 写出的内容流是 Flate 压缩的，文本以 `<hex>` 形式存在
 * （<48656C6C6F> 是 "Hello"），所以解压后要把 hex 还原成字符。
 */
async function extractText(bytes: Uint8Array): Promise<string> {
  const pdf = await PDFDocument.load(bytes)
  const parts: string[] = []
  for (const page of pdf.getPages()) {
    const contents = page.node.Contents()
    if (!contents) continue
    // Contents() 可能是 PDFArray（多个内容流）也可能是单个 PDFStream
    const refs =
      contents instanceof PDFArray ? contents.asArray() : [contents]
    for (const ref of refs) {
      const stream = pdf.context.lookup(ref) as { getContents?: () => Uint8Array } | undefined
      const raw = stream?.getContents?.()
      if (!raw) continue
      let text: string
      try {
        text = inflateSync(raw).toString('latin1')
      } catch {
        text = Buffer.from(raw).toString('latin1')
      }
      // <hex> → 文本
      text = text.replace(/<([0-9A-Fa-f]+)>/g, (_, hex) =>
        Buffer.from(hex, 'hex').toString('latin1'),
      )
      parts.push(text)
    }
  }
  return parts.join('\n')
}

/** 1x1 透明 PNG，够 embedPng 用 */
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

describe('buildInteriorPdf', () => {
  it('produces a PDF whose pages carry the story text', async () => {
    const bytes = await buildInteriorPdf({
      title: 'The Little Fox',
      author: 'SproutTales',
      pages: [{ text: 'Pip saw a star.' }, { text: 'He followed the light.' }],
      trim: '8.5x8.5',
      paper: 'white',
    })
    const text = await extractText(bytes)
    // 正文可能被 wrapText 拆成多行，去掉换行后再比对
    const flat = text.replace(/\s+/g, ' ')
    expect(flat).toContain('Pip saw a star.')
    expect(flat).toContain('He followed the light.')
  })

  it('does not write a watermark when none is requested', async () => {
    const bytes = await buildInteriorPdf({
      title: 'Clean Book',
      pages: [{ text: 'No watermark here.' }],
      trim: '8.5x8.5',
    })
    const text = await extractText(bytes)
    expect(text).not.toContain('SproutTales Preview')
  })

  it('writes the watermark on every page when one is requested', async () => {
    const bytes = await buildInteriorPdf({
      title: 'Preview Book',
      pages: [{ text: 'Page one.' }, { text: 'Page two.' }],
      trim: '8.5x8.5',
      watermark: 'SproutTales Preview — upgrade to remove',
    })
    const text = await extractText(bytes)
    expect(text).toContain('SproutTales Preview')
    // 每一页都要有水印，不能只盖第一页
    const occurrences = text.split('SproutTales Preview').length - 1
    expect(occurrences).toBeGreaterThanOrEqual(2)
  })

  it('pads the interior to the KDP minimum page count', async () => {
    const bytes = await buildInteriorPdf({
      title: 'Short Book',
      pages: [{ text: 'Only one page.' }],
      trim: '8.5x8.5',
    })
    const pdf = await PDFDocument.load(bytes)
    // KDP 内页最少 24 页
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(24)
  })

  it('keeps the watermark on padded blank pages too', async () => {
    const bytes = await buildInteriorPdf({
      title: 'Short Book',
      pages: [{ text: 'Only one page.' }],
      trim: '8.5x8.5',
      watermark: 'SproutTales Preview',
    })
    const pdf = await PDFDocument.load(bytes)
    const text = await extractText(bytes)
    // 补出来的空白页也必须盖水印，否则免费档能通过删页去掉水印
    expect(text.split('SproutTales Preview').length - 1).toBeGreaterThanOrEqual(pdf.getPageCount())
  })
})

describe('buildCoverPdf', () => {
  it('produces a PDF carrying the title', async () => {
    const bytes = await buildCoverPdf({
      title: 'The Little Fox',
      author: 'SproutTales',
      pages: 24,
      trim: '8.5x8.5',
    })
    const text = await extractText(bytes)
    expect(text).toContain('The Little Fox')
  })

  it('writes the watermark on the cover when one is requested', async () => {
    const bytes = await buildCoverPdf({
      title: 'Preview Book',
      pages: 24,
      trim: '8.5x8.5',
      watermark: 'SproutTales Preview',
    })
    const text = await extractText(bytes)
    expect(text).toContain('SproutTales Preview')
  })

  it('embeds a front cover image when one is supplied', async () => {
    const bytes = await buildCoverPdf({
      title: 'Illustrated Book',
      pages: 24,
      trim: '8.5x8.5',
      frontImageDataUrl: TINY_PNG,
    })
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(1)
  })
})
