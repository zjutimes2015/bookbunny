/**
 * SproutTales 品牌标（A 案：嫩芽从摊开的书页长出）
 *
 * 唯一事实来源：所有 SVG / PNG 资源都由这里定义的路径生成，
 * 改这个文件就等于改了全站 logo。
 *
 * 坐标系 64×64，标形本身占 50×50（四周留 7px 内边距），
 * 因此在 32px 导航栏尺寸下主体仍有足够像素可辨识。
 */

const BRAND = {
  /** 品牌渐变（导航栏 / app icon 底色） */
  gradient: ['#FF6B8A', '#C8A2E8', '#87CEEB'],
  /** 正文墨色 */
  ink: '#2D2D2D',
  /** 反白前景 */
  white: '#FFFFFF',
  /** 卡片描边 / 次级分隔 */
  line: '#E5E5EA',
  /** 浅底 */
  surface: '#F2F2F7',
  /** 社交图浅背景 */
  canvas: '#FFF8F4',
}

/** 标形在 64 网格中的内缩与缩放（留 7px 内边距） */
const INSET = 'translate(7 7) scale(0.78125)'

/**
 * A 案标形路径。c 为单色填充色。
 * 结构：摊开的书（左右两页 + 中缝）+ 从中缝长出的嫩芽（茎 + 两片子叶）。
 * 只返回路径本身，描边/填充由调用方的 <g> 统一控制。
 */
function markA(c) {
  return `<path d="M32 33.5C26 28.5 18 26.5 10 27.5V43.5C18 42.5 26 44.5 32 50.5C38 44.5 46 42.5 54 43.5V27.5C46 26.5 38 28.5 32 33.5Z"/>
  <path d="M32 34V21" fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M32 25C25.5 23.5 21.5 18 21.5 10.5C29 11.5 32 17 32 25Z"/>
  <path d="M32 25C38.5 23.5 42.5 18 42.5 10.5C35 11.5 32 17 32 25Z"/>`
}

/** 品牌渐变定义（每份文件必须用唯一 id，避免多图嵌套时串色） */
function gradientDef(id) {
  const g = BRAND.gradient
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${g[0]}"/>
    <stop offset="50%" stop-color="${g[1]}"/>
    <stop offset="100%" stop-color="${g[2]}"/>
  </linearGradient></defs>`
}

/** 渐变圆角方块（导航栏 / app icon 形态） */
function tileSvg({ gradientId, markColor = BRAND.white, radius = 16 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
${gradientDef(gradientId)}
<rect width="64" height="64" rx="${radius}" fill="url(#${gradientId})"/>
<g fill="${markColor}" stroke="none" transform="${INSET}">${markA(markColor)}</g>
</svg>`
}

/** 墨色圆角方块（深色底 / 单色场景） */
function inkTileSvg({ radius = 16 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
<rect width="64" height="64" rx="${radius}" fill="${BRAND.ink}"/>
<g fill="${BRAND.white}" stroke="none" transform="${INSET}">${markA(BRAND.white)}</g>
</svg>`
}

/** 单体标（透明底，用于 favicon / 大尺寸 / 邮件） */
function markSvg(color = BRAND.ink) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
<g fill="${color}" stroke="none" transform="${INSET}">${markA(color)}</g>
</svg>`
}

module.exports = { BRAND, INSET, markA, gradientDef, tileSvg, inkTileSvg, markSvg }
