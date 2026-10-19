// KDP 印刷就绪 PDF 生成器（同构模块：浏览器与 Node 通用）
// 仅依赖 pdf-lib（纯 JS，无 native / Python 依赖），不触碰 Node fs，返回纯 Uint8Array。
import { PDFDocument, StandardFonts, degrees, rgb, type PDFImage, type PDFFont } from 'pdf-lib'
import {
  IN,
  interiorDimsIn,
  coverLayoutIn,
  contentInsetsIn,
  padToKdpPageCount,
  MIN_SPINE_TEXT_IN,
  type KdpPaper,
} from './spec'

export interface KdpPageInput {
  text?: string
  /** data URL（data:image/png;base64,... 或 data:image/jpeg;base64,...） */
  imageDataUrl?: string
}

const TEXT_COLOR = rgb(0.18, 0.18, 0.18)
const BODY_FONT_SIZE = 18
const BODY_LEADING = 1.5

/** base64（仅有效载荷，不含 data: 前缀）→ 字节。atob 在浏览器与 Node(>=16) 均可用。 */
function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/\s/g, '')
  const binary = atob(clean)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** 从 data URL 取出 base64 载荷（兼容直接给裸 base64 的情况） */
function dataUrlPayload(dataUrl: string): string {
  const comma = dataUrl.indexOf(',')
  return dataUrl.startsWith('data:') && comma !== -1 ? dataUrl.slice(comma + 1) : dataUrl
}

type ImageKind = 'png' | 'jpg' | 'unknown'

/** 按魔数嗅探图片类型：PNG = 89 50 4E 47；JPEG = FF D8 */
function sniffImage(bytes: Uint8Array): ImageKind {
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'png'
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpg'
  return 'unknown'
}

/** 嗅探后选择对应的 embed 方法（兼容 PNG / JPEG） */
async function embedImage(pdf: PDFDocument, dataUrl: string): Promise<PDFImage> {
  const bytes = base64ToBytes(dataUrlPayload(dataUrl))
  const kind = sniffImage(bytes)
  if (kind === 'png') return pdf.embedPng(bytes)
  if (kind === 'jpg') return pdf.embedJpg(bytes)
  // 魔数未知时依次尝试（保险起见）
  try {
    return await pdf.embedPng(bytes)
  } catch {
    return pdf.embedJpg(bytes)
  }
}

/** 按最大宽度换行（以空格为断点；英文/西文适用） */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

/**
 * 生成内页 PDF（印刷就绪）。
 * - 页面尺寸 = interiorDimsIn(trim)（含四边出血）
 * - 有图 → 满版出血铺满整个 MediaBox
 * - 无图 → 白底 + 文字排在安全区内（按页奇偶应用订口规则）
 * - 末尾用 padToKdpPageCount 补空白页
 */
export async function buildInteriorPdf(opts: {
  title: string
  author?: string
  pages: KdpPageInput[]
  trim: string
  paper?: KdpPaper
}): Promise<Uint8Array> {
  const { title, author, pages, trim } = opts

  const pdf = await PDFDocument.create()
  pdf.setTitle(title)
  if (author) pdf.setAuthor(author)

  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const { widthIn, heightIn } = interiorDimsIn(trim)
  const pageW = widthIn * IN
  const pageH = heightIn * IN

  const targetCount = padToKdpPageCount(pages.length)

  for (let i = 0; i < targetCount; i++) {
    const page = pdf.addPage([pageW, pageH])
    const pageNo = i + 1
    const input = pages[i]

    if (input?.imageDataUrl) {
      // 满版出血：铺满整个 MediaBox（含出血区）
      const img = await embedImage(pdf, input.imageDataUrl)
      page.drawImage(img, { x: 0, y: 0, width: pageW, height: pageH })
      continue
    }

    // 白底
    page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: rgb(1, 1, 1) })

    const insets = contentInsetsIn(pageNo)
    const x = insets.leftIn * IN
    const contentW = pageW - (insets.leftIn + insets.rightIn) * IN
    const topY = pageH - insets.topIn * IN

    if (i === 0) {
      // 首页（封面页）文字：标题 + 作者
      const titleLines = wrapText(title, bold, 32, contentW)
      let y = topY - 32
      for (const line of titleLines) {
        page.drawText(line, { x, y, size: 32, font: bold, color: TEXT_COLOR })
        y -= 32 * 1.3
      }
      if (author) {
        page.drawText(author, { x, y: y - 12, size: 14, font, color: rgb(0.45, 0.45, 0.45) })
      }
      continue
    }

    const text = input?.text
    if (!text) continue // 空白补页

    const lines = wrapText(text, font, BODY_FONT_SIZE, contentW)
    let y = topY - BODY_FONT_SIZE
    for (const line of lines) {
      page.drawText(line, { x, y, size: BODY_FONT_SIZE, font, color: TEXT_COLOR })
      y -= BODY_FONT_SIZE * BODY_LEADING
    }
  }

  return pdf.save()
}

/**
 * 生成完整封面 PDF（封底 + 书脊 + 封面，含出血）。
 * 尺寸 = coverDimsIn(trim, pageCount, paper)。左起依次：封底(bleed+trim) → 书脊(spine) → 封面(trim+bleed)。
 * 书脊竖排（旋转 90°）显示 title / author。
 */
export async function buildCoverPdf(opts: {
  title: string
  author?: string
  /** 用于计算书脊的页数（应为补齐后的总页数） */
  pages: number
  trim: string
  paper?: KdpPaper
  frontImageDataUrl?: string
  backImageDataUrl?: string
  blurb?: string
}): Promise<Uint8Array> {
  const { title, author, pages, trim, paper = 'white', frontImageDataUrl, backImageDataUrl, blurb } = opts

  const pdf = await PDFDocument.create()
  pdf.setTitle(`${title} — Cover`)
  if (author) pdf.setAuthor(author)

  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const layout = coverLayoutIn(trim, pages, paper)
  const pageW = layout.pageWidthIn * IN
  const pageH = layout.pageHeightIn * IN

  const bleed = layout.bleedIn * IN
  const backX = layout.backXIn * IN
  const backW = layout.backPanelWIn * IN
  const spineX = layout.spineXIn * IN
  const spineW = layout.spineWIn * IN
  const frontX = layout.frontXIn * IN
  const frontW = layout.frontPanelWIn * IN

  const page = pdf.addPage([pageW, pageH])

  // 封底
  if (backImageDataUrl) {
    const img = await embedImage(pdf, backImageDataUrl)
    page.drawImage(img, { x: backX, y: 0, width: backW, height: pageH })
  } else {
    page.drawRectangle({ x: backX, y: 0, width: backW, height: pageH, color: rgb(0.98, 0.96, 0.94) })
  }
  if (blurb) {
    const maxW = backW - 2 * 0.5 * IN
    const lines = wrapText(blurb, font, 12, maxW)
    let y = pageH - 0.75 * IN
    for (const line of lines) {
      page.drawText(line, { x: backX + 0.5 * IN, y, size: 12, font, color: TEXT_COLOR })
      y -= 12 * 1.4
    }
  }

  // 书脊（竖直，旋转 90°）：书脊过窄时 KDP 不建议印字，跳过以免折损糊字
  if (layout.spineWIn >= MIN_SPINE_TEXT_IN) {
    const spineLabel = author ? `${title} · ${author}` : title
    const spineFontSize = Math.min(18, spineW * 0.55)
    page.drawText(spineLabel, {
      x: spineX + spineW * 0.5 + spineFontSize * 0.5,
      y: pageH * 0.5 - font.widthOfTextAtSize(spineLabel, spineFontSize) * 0.5,
      size: spineFontSize,
      font: bold,
      color: TEXT_COLOR,
      rotate: degrees(90),
    })
  }

  // 封面
  if (frontImageDataUrl) {
    const img = await embedImage(pdf, frontImageDataUrl)
    page.drawImage(img, { x: frontX, y: 0, width: frontW, height: pageH })
  } else {
    page.drawRectangle({ x: frontX, y: 0, width: frontW, height: pageH, color: rgb(0.98, 0.96, 0.94) })
  }

  const frontTextMaxW = frontW - 0.5 * IN
  const titleLines = wrapText(title, bold, 34, frontTextMaxW)
  let ty = pageH - 1.1 * IN
  for (const line of titleLines) {
    page.drawText(line, { x: frontX + bleed + 0.25 * IN, y: ty, size: 34, font: bold, color: TEXT_COLOR })
    ty -= 34 * 1.2
  }
  if (author) {
    page.drawText(author, { x: frontX + bleed + 0.25 * IN, y: ty - 6, size: 16, font, color: rgb(0.32, 0.32, 0.32) })
  }

  return pdf.save()
}
