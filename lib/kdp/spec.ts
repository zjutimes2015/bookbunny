// KDP 印刷规格常量与纯函数
// 纯计算，不依赖 pdf-lib / Node / DOM —— 浏览器与 Node 均可直接使用。
// 尺寸统一以「英寸」为单位；渲染时再乘以 IN 转成 PDF 的点（points）。

/** PDF points per inch */
export const IN = 72

/** 可选裁切尺寸（trim size，成品尺寸，单位英寸） */
export const KDP_TRIM: Record<string, { w: number; h: number }> = {
  '8.5x8.5': { w: 8.5, h: 8.5 },
  '8.5x11': { w: 8.5, h: 11 },
  '8x10': { w: 8, h: 10 },
  '7x10': { w: 7, h: 10 },
  '6x9': { w: 6, h: 9 },
}

/** 出血：四边各 0.125 英寸 */
export const BLEED_IN = 0.125

/** 外缘安全边距：远离裁切边的安全距离 */
export const OUTSIDE_MARGIN_IN = 0.25

/** 订口/骑缝：装订侧的内侧安全距离 */
export const GUTTER_IN = 0.375

/** KDP 平装书最少页数 */
export const MIN_PAGES = 24

/** 印刷最低分辨率（DPI） */
export const MIN_DPI = 300

/** 每一页对书脊宽度的贡献（英寸/页），按纸张类型区分 */
export const SPINE_PER_PAGE_IN: Record<'white' | 'cream', number> = {
  white: 0.002252,
  cream: 0.0025,
}

export type KdpPaper = 'white' | 'cream'

/** 取裁切尺寸；非法 key 回退到 8.5x8.5 */
function trim(trimKey: string): { w: number; h: number } {
  return KDP_TRIM[trimKey] || KDP_TRIM['8.5x8.5']
}

/** 书脊宽度（英寸）= 页数 × 每页贡献 */
export function spineWidthIn(pageCount: number, paper: KdpPaper = 'white'): number {
  return pageCount * SPINE_PER_PAGE_IN[paper]
}

/** 内页单页尺寸（英寸）= 裁切尺寸 + 四边出血 */
export function interiorDimsIn(trimKey: string): { widthIn: number; heightIn: number } {
  const t = trim(trimKey)
  return { widthIn: t.w + 2 * BLEED_IN, heightIn: t.h + 2 * BLEED_IN }
}

/** 书脊可印文字的最小宽度：低于此值 KDP 不建议在书脊印字（易折损、难辨识） */
export const MIN_SPINE_TEXT_IN = 0.25

/**
 * 封面展开版式（英寸）：封底(出血+裁切) → 书脊 → 封面(裁切+出血)。
 * 三个面板宽度之和恒等于封面总宽——版式的唯一来源，避免各处手算导致错位。
 */
export function coverLayoutIn(
  trimKey: string,
  pageCount: number,
  paper: KdpPaper = 'white',
): {
  pageWidthIn: number
  pageHeightIn: number
  bleedIn: number
  backPanelWIn: number
  spineWIn: number
  frontPanelWIn: number
  backXIn: number
  spineXIn: number
  frontXIn: number
} {
  const t = trim(trimKey)
  const spineWIn = spineWidthIn(pageCount, paper)
  const backPanelWIn = BLEED_IN + t.w
  const frontPanelWIn = t.w + BLEED_IN
  const spineXIn = backPanelWIn
  return {
    pageWidthIn: backPanelWIn + spineWIn + frontPanelWIn,
    pageHeightIn: t.h + 2 * BLEED_IN,
    bleedIn: BLEED_IN,
    backPanelWIn,
    spineWIn,
    frontPanelWIn,
    backXIn: 0,
    spineXIn,
    frontXIn: spineXIn + spineWIn,
  }
}

/**
 * 完整封面（展开，含封底 + 书脊 + 封面）尺寸（英寸）。
 * 宽 = 出血 + 裁切宽 + 书脊 + 裁切宽 + 出血；高 = 裁切高 + 上下出血。
 */
export function coverDimsIn(
  trimKey: string,
  pageCount: number,
  paper: KdpPaper = 'white',
): { widthIn: number; heightIn: number } {
  const l = coverLayoutIn(trimKey, pageCount, paper)
  return { widthIn: l.pageWidthIn, heightIn: l.pageHeightIn }
}

/** 补齐到 KDP 合规页数：至少 MIN_PAGES，且为偶数 */
export function padToKdpPageCount(n: number): number {
  let pages = Math.max(MIN_PAGES, Math.ceil(n))
  if (pages % 2 !== 0) pages += 1
  return pages
}

/**
 * 单页内容安全区（英寸），以 MediaBox 边缘为基准。
 *
 * 规则（统一以页面外框 MediaBox 边缘算起）：
 * - 装订侧（内侧，靠近书脊）：BLEED_IN + GUTTER_IN
 * - 非装订侧（外侧，靠近裁切边）：BLEED_IN + OUTSIDE_MARGIN_IN
 * - 上下两侧：BLEED_IN + OUTSIDE_MARGIN_IN
 *
 * 订口方向按页奇偶：
 * - 奇数页 = 右侧页（recto），订口在左 → 左侧为装订侧；
 * - 偶数页 = 左侧页（verso），订口在右 → 右侧为装订侧。
 */
export function contentInsetsIn(pageNo: number): {
  leftIn: number
  rightIn: number
  topIn: number
  bottomIn: number
} {
  const boundIn = BLEED_IN + GUTTER_IN
  const outerIn = BLEED_IN + OUTSIDE_MARGIN_IN
  const isRecto = pageNo % 2 === 1
  return {
    leftIn: isRecto ? boundIn : outerIn,
    rightIn: isRecto ? outerIn : boundIn,
    topIn: outerIn,
    bottomIn: outerIn,
  }
}
