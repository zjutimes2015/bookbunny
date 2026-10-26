/**
 * One-off generator for the social / icon assets that the layout references.
 *
 * The layout points at /og-image.png, /twitter-image.png, /logo.png,
 * /apple-touch-icon.png and /favicon.ico, but none of them existed in
 * public/ — every social share and every schema.org logo reference was a
 * 404. This script renders them from inline SVG so the repository carries
 * no binary blobs that cannot be regenerated.
 *
 * Run with: node scripts/generate-og-images.cjs
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const PUBLIC_DIR = path.join(__dirname, '..', 'public')

const BRAND = {
  green: '#3E9B4F',
  greenLight: '#7BC96F',
  cream: '#FFF8E7',
  ink: '#1F2933',
  inkSoft: '#5A6472',
  night: '#1B2547',
}

/** The sprout mark, reused on the icon, the apple-touch icon and the logo. */
function sproutSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${BRAND.greenLight}"/>
        <stop offset="100%" stop-color="${BRAND.green}"/>
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#g)"/>
    <path d="M32 14c-2 6-6 8-12 9v17c0 6 5 10 12 10s12-4 12-10V23c-6-1-10-3-12-9z" fill="${BRAND.cream}"/>
    <path d="M32 50V28" stroke="${BRAND.green}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M32 30c-3-1-5-3-6-6 4 0 6 1 6 4 0-3 2-4 6-4-1 3-3 5-6 6z" fill="${BRAND.green}"/>
  </svg>`
}

/** The social card: wordmark, tagline, and a row of illustrated page chips. */
function socialSvg(width, height) {
  const chips = [
    { x: 80, color: '#FFE3A3', label: 'A' },
    { x: 300, color: '#BFE3FF', label: 'B' },
    { x: 520, color: '#FFC9DE', label: 'C' },
    { x: 740, color: '#D6F5C8', label: 'D' },
    { x: 960, color: '#FFD9B3', label: 'E' },
  ]
  const chipSvg = chips
    .map(
      (c) => `
    <g transform="translate(${c.x} 300)">
      <rect width="150" height="190" rx="14" fill="#FFFFFF" stroke="#E5E5EA" stroke-width="2"/>
      <rect x="14" y="14" width="122" height="112" rx="9" fill="${c.color}"/>
      <circle cx="75" cy="70" r="26" fill="#FFFFFF" opacity="0.72"/>
      <rect x="24" y="142" width="102" height="9" rx="4.5" fill="#E5E5EA"/>
      <rect x="42" y="160" width="66" height="9" rx="4.5" fill="#F0F0F3"/>
      <text x="75" y="66" font-family="Inter, Helvetica, Arial, sans-serif" font-size="30" font-weight="700" text-anchor="middle" fill="${BRAND.ink}" opacity="0.55">${c.label}</text>
    </g>`,
    )
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFFDF6"/>
        <stop offset="55%" stop-color="#F4FAF0"/>
        <stop offset="100%" stop-color="#E4F3E3"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.85" cy="0.12" r="0.6">
        <stop offset="0%" stop-color="#FFE3A3" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="#FFE3A3" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#sky)"/>
    <rect width="1200" height="630" fill="url(#glow)"/>
    <circle cx="1046" cy="96" r="52" fill="#FFD98A" opacity="0.9"/>
    <path d="M0 560c120-34 240-34 360 0s240 34 360 0 240-34 480 0v70H0z" fill="#BFE3C4" opacity="0.65"/>
    <path d="M0 604c140-26 280-26 420 0s280 26 420 0 220-26 360 0v26H0z" fill="#8FCB9B" opacity="0.6"/>

    <g transform="translate(80 74)">
      <rect width="64" height="64" rx="14" fill="${BRAND.green}"/>
      <path d="M32 14c-2 6-6 8-12 9v17c0 6 5 10 12 10s12-4 12-10V23c-6-1-10-3-12-9z" fill="${BRAND.cream}"/>
      <path d="M32 50V28" stroke="${BRAND.green}" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <text x="164" y="120" font-family="Inter, Helvetica, Arial, sans-serif" font-size="52" font-weight="800" fill="${BRAND.ink}">SproutTales</text>

    <text x="80" y="196" font-family="Inter, Helvetica, Arial, sans-serif" font-size="44" font-weight="700" fill="${BRAND.ink}">AI Children&#8217;s Picture Book Generator</text>
    <text x="80" y="240" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" font-weight="500" fill="${BRAND.inkSoft}">Consistent characters &#183; GRL A&#8211;E leveled text &#183; print-ready KDP PDFs</text>

    ${chipSvg}

    <text x="80" y="556" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" font-weight="600" fill="${BRAND.green}">sprouttales.com</text>
  </svg>`
}

async function writePng(name, svg) {
  const file = path.join(PUBLIC_DIR, name)
  await sharp(Buffer.from(svg)).png().toFile(file)
  const { size } = fs.statSync(file)
  console.log(`  ${name.padEnd(24)} ${(size / 1024).toFixed(1)} KB`)
}

async function main() {
  console.log('Generating social + icon assets in public/')

  await writePng('og-image.png', socialSvg(1200, 630))
  await writePng('twitter-image.png', socialSvg(1200, 600))

  // logo.png — square wordmark tile for schema.org Organization.logo
  await writePng('logo.png', sproutSvg(512))

  // apple-touch-icon.png — 180x180, iOS does not apply rounded-corner masks
  await writePng('apple-touch-icon.png', sproutSvg(180))

  // favicon.ico — multi-resolution, but a single 32x32 PNG inside an .ico
  // container is enough for every modern browser.
  const icon32 = await sharp(Buffer.from(sproutSvg(32))).png().toBuffer()
  const icoHeader = Buffer.alloc(6)
  icoHeader.writeUInt16LE(0, 0) // reserved
  icoHeader.writeUInt16LE(1, 2) // type: icon
  icoHeader.writeUInt16LE(1, 4) // image count
  const icoEntry = Buffer.alloc(16)
  icoEntry.writeUInt8(32, 0) // width
  icoEntry.writeUInt8(32, 1) // height
  icoEntry.writeUInt8(0, 2) // palette
  icoEntry.writeUInt8(0, 3) // reserved
  icoEntry.writeUInt16LE(1, 4) // color planes
  icoEntry.writeUInt16LE(32, 6) // bits per pixel
  icoEntry.writeUInt32LE(icon32.length, 8)
  icoEntry.writeUInt32LE(22, 12)
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), Buffer.concat([icoHeader, icoEntry, icon32]))
  console.log(`  favicon.ico            ${(fs.statSync(path.join(PUBLIC_DIR, 'favicon.ico')).size / 1024).toFixed(1)} KB`)

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
