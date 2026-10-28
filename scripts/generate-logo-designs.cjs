/**
 * SproutTales Logo 设计稿生成器
 *
 * 输出：
 *   public/logo-{x}.svg        渐变圆角方块（导航栏 / app icon 形态）
 *   public/logo-dark-{x}.svg   墨色圆角方块
 *   public/logo-mark-{x}.svg   纯色单体标（透明底，用于 favicon / 大尺寸）
 *   public/logo-{x}.png        512px 位图
 *   scripts/logo-preview.png   五案对比总览（含 32px 实际尺寸校验）
 *
 * 全部图形为 64×64 网格内的手写矢量路径，单色填充 + 真实几何间隙，
 * 保证 32px 下仍可辨识，不依赖任何 knockout 效果。
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const OUT = path.join(__dirname, '..', 'public')
const INK = '#2D2D2D'
const WHITE = '#FFFFFF'
const GRADIENT = ['#FF6B8A', '#C8A2E8', '#87CEEB']

/** XML 文本转义 */
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** 渐变定义（每文件唯一 id，避免嵌套时冲突） */
function gradientDef(id) {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${GRADIENT[0]}"/>
    <stop offset="50%" stop-color="${GRADIENT[1]}"/>
    <stop offset="100%" stop-color="${GRADIENT[2]}"/>
  </linearGradient></defs>`
}

/* ── 五个方案的标形 ───────────────────────────────────────────
 * c = 单色填充色。五个方案分别占据不同的视觉维度：
 *   A 横向舒展 · B 纵向挺拔 · C 横向层叠 · D 圆形 · E 斜向
 * ─────────────────────────────────────────────────────────── */

/** A — 摊开的书 + 从书脊长出的嫩芽（品牌核心隐喻） */
const MARK_A = (c) => `
  <path d="M32 33.5C26 28.5 18 26.5 10 27.5V43.5C18 42.5 26 44.5 32 50.5C38 44.5 46 42.5 54 43.5V27.5C46 26.5 38 28.5 32 33.5Z" fill="${c}"/>
  <path d="M32 34V21" fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M32 25C25.5 23.5 21.5 18 21.5 10.5C29 11.5 32 17 32 25Z" fill="${c}"/>
  <path d="M32 25C38.5 23.5 42.5 18 42.5 10.5C35 11.5 32 17 32 25Z" fill="${c}"/>`

/** B — 一片叶子沿中缝分成左右两页（书与叶合一） */
const MARK_B = (c) => `
  <path d="M30.2 8C21 16 15.5 30 19.8 40.5C22.5 47 27 51 30.2 53.4Z" fill="${c}"/>
  <path d="M33.8 8C43 16 48.5 30 44.2 40.5C41.5 47 37 51 33.8 53.4Z" fill="${c}"/>`

/** C — 两层 V 形折页 + 顶升星芒（书页正在成形） */
const MARK_C = (c) => `
  <path d="M12 26L32 34L52 26L52 32L32 40L12 32Z" fill="${c}"/>
  <path d="M12 40L32 48L52 40L52 46L32 54L12 46Z" fill="${c}"/>
  <path d="M32 4.6c.9 5.3 2.1 6.5 7.4 7.4-5.3.9-6.5 2.1-7.4 7.4-.9-5.3-2.1-6.5-7.4-7.4 5.3-.9 6.5-2.1 7.4-7.4z" fill="${c}"/>`

/** D — 圆环品牌章：环内嫩芽 + 底部地平弧 */
const MARK_D = (c) => `
  <circle cx="32" cy="32" r="24.5" fill="none" stroke="${c}" stroke-width="4"/>
  <path d="M32 42V26" fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M32 28.5c-5.4-1-9-4.8-9-11.2 6.4 0 9 4.3 9 11.2z" fill="${c}"/>
  <path d="M32 28.5c5.4-1 9-4.8 9-11.2-6.4 0-9 4.3-9 11.2z" fill="${c}"/>
  <path d="M22 47c5-3.6 15-3.6 20 0" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`

/** E — 摊开的书 + 向右上生长的叶（故事自有去向） */
const MARK_E = (c) => `
  <path d="M32 49c-4.5-4-11-5.8-16.5-4.4v9.4c5.5-1.4 12 .4 16.5 4.4z" fill="${c}"/>
  <path d="M32 49c4.5-4 11-5.8 16.5-4.4v9.4c-5.5-1.4-12 .4-16.5 4.4z" fill="${c}"/>
  <path d="M45.5 46.5c4.5-7.5 2-14 6-21" fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/>
  <g transform="translate(47.5 17) rotate(-40) scale(0.95) translate(-32 -32)">
    <path d="M32 25C25.5 23.5 21.5 18 21.5 10.5C29 11.5 32 17 32 25Z" fill="${c}"/>
    <path d="M32 25C38.5 23.5 42.5 18 42.5 10.5C35 11.5 32 17 32 25Z" fill="${c}"/>
  </g>`

const CONCEPTS = [
  { key: 'a', name: 'Sprout & Book', note: '嫩芽从书脊长出', mark: MARK_A },
  { key: 'b', name: 'Leaf Pages', note: '叶与书页合一', mark: MARK_B },
  { key: 'c', name: 'Story Layers', note: '书页与星芒', mark: MARK_C },
  { key: 'd', name: 'Seal', note: '圆环品牌章', mark: MARK_D },
  { key: 'e', name: 'Story Path', note: '书与轨迹', mark: MARK_E },
]

/* ── 文件组装 ─────────────────────────────────────────────────── */

function tileSvg(concept, dark) {
  const gid = `g-${concept.key}`
  const bg = dark
    ? `<rect width="64" height="64" rx="16" fill="${INK}"/>`
    : `<rect width="64" height="64" rx="16" fill="url(#${gid})"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
${gradientDef(gid)}
${bg}
<g transform="translate(7 7) scale(0.78125)">${concept.mark(WHITE)}</g>
</svg>`
}

function markSvg(concept) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
${concept.mark(INK)}
</svg>`
}

/* ── 对比总览 ─────────────────────────────────────────────────── */

function previewSvg() {
  const W = 1120
  const rowH = 156
  const headH = 132
  const H = headH + rowH * CONCEPTS.length + 40

  const cols = [
    { x: 236, label: '渐变方块' },
    { x: 384, label: '墨色方块' },
    { x: 532, label: '单体标' },
    { x: 680, label: '单体标反白' },
    { x: 828, label: '32px' },
    { x: 916, label: '32px' },
  ]

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#FFFFFF"/>
<text x="56" y="58" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="700" fill="#2D2D2D">SproutTales &#8212; Logo 设计稿</text>
<text x="56" y="92" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#8E8E93">64&#215;64 网格手写矢量路径 &#183; 右侧两列为导航栏 32px 实际尺寸校验</text>
`
  for (const c of cols) {
    s += `<text x="${c.x}" y="122" font-family="Segoe UI, Arial, sans-serif" font-size="12" fill="#AEAEB2">${esc(c.label)}</text>`
  }

  CONCEPTS.forEach((concept, i) => {
    const y = headH + i * rowH
    const gid = `pg-${concept.key}`
    s += `<g transform="translate(0 ${y})">
<rect x="0" y="0" width="${W}" height="${rowH - 6}" fill="${i % 2 ? '#FAFAFC' : '#FFFFFF'}"/>
<text x="56" y="56" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" fill="#2D2D2D">${esc(concept.key.toUpperCase())}</text>
<text x="56" y="84" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="600" fill="#48484A">${esc(concept.name)}</text>
<text x="56" y="108" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#8E8E93">${esc(concept.note)}</text>
${gradientDef(gid)}
<g transform="translate(236 14)"><rect width="128" height="128" rx="32" fill="url(#${gid})"/><g transform="translate(14 14) scale(1.5625)">${concept.mark(WHITE)}</g></g>
<g transform="translate(384 14)"><rect width="128" height="128" rx="32" fill="${INK}"/><g transform="translate(14 14) scale(1.5625)">${concept.mark(WHITE)}</g></g>
<g transform="translate(532 14)"><rect width="128" height="128" rx="12" fill="#F2F2F7"/><g transform="translate(14 14) scale(1.5625)">${concept.mark(INK)}</g></g>
<g transform="translate(680 14)"><rect width="128" height="128" rx="12" fill="${INK}"/><g transform="translate(14 14) scale(1.5625)">${concept.mark(WHITE)}</g></g>
<g transform="translate(828 46)"><rect width="64" height="64" rx="16" fill="url(#${gid})"/><g transform="translate(7 7) scale(0.78125)">${concept.mark(WHITE)}</g></g>
<g transform="translate(916 46)"><rect width="64" height="64" rx="16" fill="${INK}"/><g transform="translate(7 7) scale(0.78125)">${concept.mark(WHITE)}</g></g>
</g>`
  })

  s += `<text x="56" y="${H - 14}" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#AEAEB2">品牌渐变 #FF6B8A &#8594; #C8A2E8 &#8594; #87CEEB &#183; 墨色 #2D2D2D</text>
</svg>`
  return s
}

/* ── 执行 ─────────────────────────────────────────────────────── */

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  for (const c of CONCEPTS) {
    const tile = tileSvg(c, false)
    const dark = tileSvg(c, true)
    const mark = markSvg(c)
    fs.writeFileSync(path.join(OUT, `logo-${c.key}.svg`), tile)
    fs.writeFileSync(path.join(OUT, `logo-dark-${c.key}.svg`), dark)
    fs.writeFileSync(path.join(OUT, `logo-mark-${c.key}.svg`), mark)
    await sharp(Buffer.from(tile)).resize(512, 512).png().toFile(path.join(OUT, `logo-${c.key}.png`))
    await sharp(Buffer.from(mark)).resize(512, 512).png().toFile(path.join(OUT, `logo-mark-${c.key}.png`))
    console.log(`  ${c.key.toUpperCase()}  ${c.name}`)
  }

  const preview = previewSvg()
  fs.writeFileSync(path.join(__dirname, 'logo-preview.svg'), preview)
  await sharp(Buffer.from(preview)).png().toFile(path.join(__dirname, 'logo-preview.png'))
  console.log('preview -> scripts/logo-preview.png')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
