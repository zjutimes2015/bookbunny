import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { SITE_URL, SITE_DESCRIPTION } from '@/lib/site'
import { softwareApplicationJsonLd, faqPageJsonLd } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: { absolute: 'SproutTales — Create Magical Children\'s Books with AI' },
  description: SITE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/` },
}

type SceneVariant = 'meadow' | 'stream' | 'garden'
type CoverVariant = 'moon' | 'lila' | 'kai'

/** 绘本内页插画（矢量，随容器裁切填充） */
function Scene({ variant, className = '' }: { variant: SceneVariant; className?: string }) {
  const sky = variant === 'garden' ? 'scene-dusk' : 'scene-night'

  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="scene-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B2547" />
          <stop offset="62%" stopColor="#3A4A82" />
          <stop offset="100%" stopColor="#6C7CA8" />
        </linearGradient>
        <linearGradient id="scene-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A2340" />
          <stop offset="58%" stopColor="#6B4B72" />
          <stop offset="100%" stopColor="#C58C7F" />
        </linearGradient>
        <radialGradient id="scene-glow">
          <stop offset="0%" stopColor="#FFE3A3" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFE3A3" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="300" fill={`url(#${sky})`} />

      {/* 月亮与星 */}
      <circle cx="322" cy="58" r="34" fill="#FFF3D4" opacity="0.16" />
      <circle cx="322" cy="58" r="24" fill="#FFF3D4" />
      {[
        [42, 44], [86, 78], [130, 36], [176, 66], [222, 40], [264, 84],
        [56, 118], [148, 104], [206, 112], [286, 122], [338, 96], [20, 80],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 1.6 : 1.1} fill="#FFF6DE" opacity="0.8" />
      ))}

      {variant === 'meadow' && (
        <>
          <path d="M0 226 Q 68 178 138 214 T 276 202 T 400 214 V300 H0 Z" fill="#26325F" />
          <path d="M0 246 Q 90 210 172 240 T 400 232 V300 H0 Z" fill="#1D274B" />
          {[24, 58, 96, 128, 168, 214, 252, 292, 330, 366].map((x, i) => (
            <path
              key={x}
              d={`M${x} 300 q ${i % 2 ? 5 : -5} -22 ${i % 2 ? 11 : -11} -34`}
              stroke="#3C4A7C"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />
          ))}
          <circle cx="248" cy="188" r="30" fill="url(#scene-glow)" />
          <Bunny x={196} y={214} scale={1.05} />
          <line x1="212" y1="206" x2="240" y2="186" stroke="#8A7B62" strokeWidth="2" />
          <rect x="236" y="170" width="12" height="16" rx="3" fill="#F7C978" />
          <circle cx="242" cy="178" r="14" fill="url(#scene-glow)" opacity="0.8" />
        </>
      )}

      {variant === 'stream' && (
        <>
          <path d="M0 208 Q 140 196 400 208 V300 H0 Z" fill="#2C4574" />
          <path d="M22 232 q 60 -7 120 0 t 120 0 t 120 0" stroke="#7C9AC8" strokeWidth="2" fill="none" opacity="0.5" />
          <path d="M10 262 q 60 -7 120 0 t 120 0 t 120 0" stroke="#8FAAD4" strokeWidth="2" fill="none" opacity="0.4" />
          {/* 芦苇 */}
          {[18, 40, 366, 386].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 300 q ${i < 2 ? 6 : -6} -46 ${i < 2 ? 3 : -3} -72`} stroke="#2A3A63" strokeWidth="3" fill="none" strokeLinecap="round" />
              <ellipse cx={x + (i < 2 ? 3 : -3)} cy={226} rx="3.2" ry="9" fill="#3C4E7C" />
            </g>
          ))}
          {/* 纸船 */}
          <g transform="translate(150 218)">
            <path d="M0 18 L74 18 L54 40 L16 40 Z" fill="#FFF8EC" />
            <path d="M37 0 L37 18 M37 0 L70 18 M37 0 L6 18" stroke="#D9CDB4" strokeWidth="2" fill="none" />
          </g>
          <Bunny x={180} y={206} scale={0.92} />
        </>
      )}

      {variant === 'garden' && (
        <>
          <path d="M0 218 Q 110 190 220 214 T 400 206 V300 H0 Z" fill="#3A4A45" />
          <path d="M0 248 Q 120 220 240 246 T 400 238 V300 H0 Z" fill="#2C3A38" />
          {[
            [40, 236, -28], [86, 252, 18], [140, 232, -12], [300, 240, 26], [352, 250, -18], [372, 228, 10],
          ].map(([cx, cy, rot], i) => (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={i % 2 ? 12 : 16}
              ry={i % 2 ? 30 : 38}
              fill={i % 2 ? '#4C7A62' : '#3E6B55'}
              transform={`rotate(${rot} ${cx} ${cy})`}
            />
          ))}
          <circle cx="248" cy="242" r="26" fill="url(#scene-glow)" />
          <circle cx="248" cy="242" r="5" fill="#FFE3A3" />
          <Bunny x={206} y={224} scale={1} flip />
          <circle cx="300" cy="196" r="2.2" fill="#FFE9B0" />
          <circle cx="322" cy="214" r="1.6" fill="#FFE9B0" />
          <circle cx="282" cy="214" r="1.4" fill="#FFE9B0" />
        </>
      )}
    </svg>
  )
}

/** 同一角色，用于三张内页 */
function Bunny({ x, y, scale = 1, flip = false }: { x: number; y: number; scale?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <circle cx="-16" cy="8" r="6.5" fill="#FFF9F0" />
      <ellipse cx="0" cy="6" rx="16" ry="18" fill="#FFF9F0" />
      <ellipse cx="-7" cy="-30" rx="5.5" ry="15" fill="#FFF9F0" transform="rotate(-13 -7 -30)" />
      <ellipse cx="7" cy="-30" rx="5.5" ry="15" fill="#FFF9F0" transform="rotate(13 7 -30)" />
      <ellipse cx="-7" cy="-30" rx="2.2" ry="9.5" fill="#F1C3CD" transform="rotate(-13 -7 -30)" />
      <ellipse cx="7" cy="-30" rx="2.2" ry="9.5" fill="#F1C3CD" transform="rotate(13 7 -30)" />
      <circle cx="0" cy="-9" r="13" fill="#FFF9F0" />
      <circle cx="-4.4" cy="-10" r="1.7" fill="#2D2D2D" />
      <circle cx="4.4" cy="-10" r="1.7" fill="#2D2D2D" />
      <path d="M-3 -3 q 3 2.6 6 0" stroke="#2D2D2D" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M-11 -17 q 11 7 22 0 l 0 5 q -11 6.5 -22 0 Z" fill="#E4574F" />
    </g>
  )
}

/** 角色头像（照片 → 角色） */
function BunnyFace({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="50" fill="#FFF1E2" />
      <ellipse cx="38" cy="30" rx="7" ry="16" fill="#FFF9F0" transform="rotate(-12 38 30)" />
      <ellipse cx="62" cy="30" rx="7" ry="16" fill="#FFF9F0" transform="rotate(12 62 30)" />
      <ellipse cx="38" cy="30" rx="3" ry="10" fill="#F1C3CD" transform="rotate(-12 38 30)" />
      <ellipse cx="62" cy="30" rx="3" ry="10" fill="#F1C3CD" transform="rotate(12 62 30)" />
      <circle cx="50" cy="54" r="24" fill="#FFF9F0" />
      <circle cx="42" cy="52" r="2.8" fill="#2D2D2D" />
      <circle cx="58" cy="52" r="2.8" fill="#2D2D2D" />
      <path d="M46 62 q 4 3.5 8 0" stroke="#2D2D2D" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M28 76 q 22 9 44 0 l 0 8 q -22 9 -44 0 Z" fill="#E4574F" />
    </svg>
  )
}

/** 书封（矢量插画 + 排版标题） */
function BookCover({
  variant,
  title,
  ink,
  className = '',
  showTitle = true,
}: {
  variant: CoverVariant
  title: string
  ink: string
  className?: string
  showTitle?: boolean
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} role="img" aria-label={`${title} — sample book cover`}>
      <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="cover-night" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E2A52" />
            <stop offset="58%" stopColor="#3D4D86" />
            <stop offset="100%" stopColor="#85869E" />
          </linearGradient>
          <linearGradient id="cover-rain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CFE7F4" />
            <stop offset="100%" stopColor="#EFF6FA" />
          </linearGradient>
          <linearGradient id="cover-garden" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5E9C6" />
            <stop offset="100%" stopColor="#DCCB92" />
          </linearGradient>
        </defs>

        {variant === 'moon' && (
          <>
            <rect width="300" height="400" fill="url(#cover-night)" />
            {[[36, 96], [92, 132], [138, 84], [188, 120], [246, 96], [268, 152], [58, 168]].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 1.8 : 1.2} fill="#FFF6DE" opacity="0.85" />
            ))}
            {/* 月亮 */}
            <circle cx="206" cy="232" r="60" fill="#F8E9C8" />
            <circle cx="232" cy="212" r="56" fill="#3D4D86" opacity="0.95" />
            <Bunny x={186} y={262} scale={0.78} />
            {/* 村庄 */}
            <path d="M0 336 Q 80 306 160 332 T 300 322 V400 H0 Z" fill="#273259" />
            <path d="M28 348 h34 v34 h-34 Z M96 342 h28 v40 h-28 Z M212 344 h30 v38 h-30 Z" fill="#1B2344" />
            <path d="M22 348 l23 -16 l23 16 Z M90 342 l20 -14 l20 14 Z M206 344 l21 -15 l21 15 Z" fill="#1B2344" />
            {[[38, 358], [104, 354], [220, 356]].map(([x, y]) => (
              <rect key={x} x={x} y={y} width="5" height="6" fill="#FFD58C" opacity="0.9" />
            ))}
          </>
        )}

        {variant === 'lila' && (
          <>
            <rect width="300" height="400" fill="url(#cover-rain)" />
            <g fill="#FFFFFF" opacity="0.85">
              <ellipse cx="62" cy="118" rx="30" ry="15" />
              <ellipse cx="92" cy="112" rx="20" ry="12" />
              <ellipse cx="238" cy="168" rx="26" ry="13" />
            </g>
            <path d="M0 320 Q 90 306 300 318 V400 H0 Z" fill="#BFD8B8" />
            <ellipse cx="206" cy="342" rx="58" ry="14" fill="#9FC7E4" />
            <ellipse cx="206" cy="342" rx="34" ry="7" fill="none" stroke="#7FB2D6" strokeWidth="1.5" opacity="0.7" />
            {/* 雨丝 */}
            {[[54, 190], [78, 232], [248, 208], [272, 244], [40, 262]].map(([x, y], i) => (
              <line key={i} x1={x} y1={y} x2={x - 4} y2={y + 14} stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
            ))}
            {/* 纸船 */}
            <g transform="translate(160 302)">
              <path d="M0 12 L56 12 L40 30 L14 30 Z" fill="#FFFDF7" />
              <path d="M28 0 L28 12 M28 0 L50 12 M28 0 L6 12" stroke="#D8CDB8" strokeWidth="1.6" fill="none" />
            </g>
            {/* 女孩 */}
            <g transform="translate(104 238)">
              <rect x="-12" y="92" width="9" height="12" rx="2" fill="#5B6B7A" />
              <rect x="4" y="92" width="9" height="12" rx="2" fill="#5B6B7A" />
              <path d="M-27 94 q 0 -56 27 -56 q 27 0 27 56 Z" fill="#F2C14E" />
              <path d="M-27 94 h54" stroke="#D9A93B" strokeWidth="2" />
              <path d="M-19 34 q 19 13 38 0 q -4 14 -19 14 q -15 0 -19 -14 Z" fill="#E0A93C" />
              <circle cx="0" cy="18" r="15" fill="#C98D63" />
              <path d="M-15 13 q 4 -15 15 -15 q 11 0 15 15 q -8 -7 -15 -5 q -7 2 -15 5 Z" fill="#4A3226" />
              <circle cx="-14" cy="22" r="5" fill="#4A3226" />
              <circle cx="14" cy="22" r="5" fill="#4A3226" />
              <circle cx="-5" cy="19" r="1.7" fill="#2D2D2D" />
              <circle cx="5" cy="19" r="1.7" fill="#2D2D2D" />
              <path d="M-4 26 q 4 3 8 0" stroke="#2D2D2D" strokeWidth="1.3" fill="none" strokeLinecap="round" />
              {/* 牵着纸船的手臂 */}
              <path d="M26 60 q 16 6 30 22" stroke="#F2C14E" strokeWidth="7" fill="none" strokeLinecap="round" />
              <path d="M56 82 q 8 6 8 16" stroke="#D8CDB8" strokeWidth="1.4" fill="none" />
            </g>
          </>
        )}

        {variant === 'kai' && (
          <>
            <rect width="300" height="400" fill="url(#cover-garden)" />
            <circle cx="238" cy="150" r="40" fill="#F3D27A" opacity="0.55" />
            {/* 向日葵 */}
            {[
              [62, 224, 0.9], [124, 196, 1.05], [250, 232, 0.95], [190, 250, 0.8],
            ].map(([x, y, s], i) => (
              <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
                <path d="M0 0 V96" stroke="#5E7C4A" strokeWidth="5" strokeLinecap="round" />
                <ellipse cx="-12" cy="52" rx="12" ry="6" fill="#6E8F55" transform="rotate(-24 -12 52)" />
                <circle cx="0" cy="0" r="12" fill="#8A5A34" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                  <ellipse
                    key={a}
                    cx="0"
                    cy="-20"
                    rx="7"
                    ry="12"
                    fill="#F1C14E"
                    transform={`rotate(${a} 0 0)`}
                  />
                ))}
                <circle cx="0" cy="0" r="11" fill="#8A5A34" />
              </g>
            ))}
            <path d="M0 344 Q 100 326 300 342 V400 H0 Z" fill="#B9C08A" />
            {/* 男孩 */}
            <g transform="translate(198 268)">
              <path d="M-20 84 q 0 -46 20 -46 q 20 0 20 46 Z" fill="#6E8F55" />
              <circle cx="0" cy="16" r="18" fill="#C98D63" />
              <path d="M-18 10 q 6 -18 22 -16 q 14 2 14 16 q -10 -8 -20 -6 q -10 2 -16 6 Z" fill="#3F3A32" />
              <circle cx="-7" cy="16" r="6" stroke="#3F3A32" strokeWidth="1.6" fill="none" />
              <circle cx="7" cy="16" r="6" stroke="#3F3A32" strokeWidth="1.6" fill="none" />
              <path d="M-1 16 h2" stroke="#3F3A32" strokeWidth="1.6" />
              <path d="M-4 25 q 4 3 8 0" stroke="#2D2D2D" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </g>
          </>
        )}
      </svg>

      {showTitle && (
        <div className="absolute inset-x-0 top-0 px-4 pt-5 text-center">
          <span className="block text-[8px] font-semibold uppercase tracking-[0.22em] opacity-60" style={{ color: ink }}>
            SproutTales
          </span>
          <span className="mt-1 block text-[13px] font-bold leading-tight" style={{ color: ink }}>
            {title}
          </span>
        </div>
      )}
    </div>
  )
}

const SPREADS: { variant: SceneVariant; alt: string }[] = [
  { variant: 'meadow', alt: 'Interior page: the bunny crossing a moonlit meadow with a lantern' },
  { variant: 'stream', alt: 'Interior page: the same bunny sailing a paper boat on a moonlit stream' },
  { variant: 'garden', alt: 'Interior page: the same bunny planting a glowing seed in a dusk garden' },
]

const COVERS: {
  variant: CoverVariant
  title: string
  meta: string
  style: string
  ink: string
}[] = [
  { variant: 'moon', title: 'The Moon Bunny', meta: 'GRL B · 16 pages', style: 'Watercolor & gouache', ink: '#FFF6E2' },
  { variant: 'lila', title: 'Lila and the Paper Boat', meta: 'GRL A · 12 pages', style: 'Cut-paper collage', ink: '#2F4A63' },
  { variant: 'kai', title: 'Kai\u2019s Quiet Garden', meta: 'GRL C · 20 pages', style: 'Pencil & gouache', ink: '#4A4327' },
]

const TIERS = [
  { name: 'Free', amount: '$0', note: '1 book · watermarked preview' },
  { name: 'Starter', amount: '$12', note: 'per month · 10 books' },
  { name: 'Creator', amount: '$29', note: 'per month · KDP + commercial license', featured: true },
  { name: 'Studio', amount: '$59', note: 'per month · 100 books' },
]

const LANGUAGES = ['EN', 'ZH', 'ZH-TW', 'ES', 'FR', 'DE', 'JA', 'KO', 'PT', 'IT']

const WAVE = [28, 62, 44, 80, 52, 70, 36, 58, 26, 48]

const FAQS = [
  {
    q: 'Is it safe to use my child\u2019s photo?',
    a: 'Photos are optional. A guardian account and recorded parental consent are required before any photo is processed, and consent can be withdrawn at any time.',
    open: true,
  },
  {
    q: 'Can I sell the books I make on Amazon KDP?',
    a: 'Yes on Creator and Studio. Those plans include two print-ready PDFs — interior and full cover — plus a commercial license.',
  },
  {
    q: 'Do my books or credits expire?',
    a: 'Books never expire. Plan allowances reset monthly; optional credit packs never expire.',
  },
  {
    q: 'What exactly is included in the free plan?',
    a: 'One complete 8-page book with a watermarked preview and three art styles. PDF export starts on Starter.',
  },
  {
    q: 'Do I need design or writing skills?',
    a: 'No. Describe an idea in one sentence; the editor handles structure, illustration prompts and text layout.',
  },
]

const Chip = ({ children }: { children: ReactNode }) => (
  <span className="rounded-md border border-[#E5E5EA] px-2 py-0.5 text-[10px] font-medium tracking-wide text-[#8E8E93]">
    {children}
  </span>
)

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8E8E93]">{children}</p>
)

export default function HomePage() {
  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(FAQS)) }}
      />
      {/* 01 · Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_1fr] lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E5E5EA] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8E8E93]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B8A]" />
              AI picture books · GRL A–E leveled readers
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[#2D2D2D] sm:text-5xl lg:text-[52px]">
              Turn an idea into a real{' '}
              <span className="bunny-text-gradient whitespace-nowrap">picture book</span>
            </h1>

            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-[#8E8E93]">
              Describe a story. Get consistent characters, up to 24 illustrated pages,
              and print-ready PDFs — in minutes.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="/create" className="apple-button px-7 py-3.5 text-base">
                Start free — no credit card
              </Link>
              <a
                href="#samples"
                className="text-sm font-medium text-[#2D2D2D] underline decoration-[#C7C7CC] underline-offset-4 transition-colors hover:decoration-[#2D2D2D]"
              >
                See sample books ↓
              </a>
            </div>

            <p className="mt-6 text-[11px] leading-relaxed text-[#8E8E93]">
              Free plan includes 1 book · No credit card · Photo use requires parental consent
            </p>
          </div>

          {/* 成品书轮播（纯 CSS，自动每 4 秒切换） */}
          <div>
            <div className="rounded-[22px] border border-[#E5E5EA] bg-white p-2 shadow-[0_18px_50px_rgba(45,45,45,0.10)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#FFF5EE]">
                {SPREADS.map((s, i) => (
                  <div key={s.variant} className={`home-slide home-slide-${i + 1} absolute inset-0`}>
                    <Scene variant={s.variant} className="h-full w-full" />
                  </div>
                ))}
                <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#2D2D2D] backdrop-blur">
                  The Moon Bunny · GRL B · 16 pages
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {SPREADS.map((s) => (
                <div key={s.variant} className="overflow-hidden rounded-xl border border-[#E5E5EA]">
                  <Scene variant={s.variant} className="aspect-[4/3] w-full" />
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              {SPREADS.map((s, i) => (
                <span
                  key={s.variant}
                  className={`home-dot home-dot-${i + 1} h-1.5 w-1.5 overflow-hidden rounded-full bg-[#E5E5EA]`}
                >
                  <span className="block h-full w-full rounded-full bg-[#2D2D2D]" />
                </span>
              ))}
              <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-[#8E8E93]">
                Three spreads from one generated book
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 02 · Three-step strip */}
      <section className="border-y border-[#E5E5EA] bg-[#FAF0E6]/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionLabel>How it works</SectionLabel>

          <div className="grid items-start gap-10 md:grid-cols-3 md:gap-8">
            {/* Step 1 */}
            <div>
              <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-[#E5E5EA] bg-white p-4">
                <div className="w-full rounded-xl border border-[#E5E5EA] bg-white p-3 shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">
                    Describe your story
                  </div>
                  <div className="mt-2 rounded-lg bg-[#F2F2F7] px-3 py-2.5 text-[12px] leading-snug text-[#8E8E93]">
                    A bunny who carries the moon home…
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Chip>Age 3–5</Chip>
                    <Chip>GRL B</Chip>
                    <Chip>Watercolor</Chip>
                    <Chip>16 pages</Chip>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8E8E93]">Step 01</p>
              <h3 className="mt-1.5 text-base font-semibold text-[#2D2D2D]">Describe your story</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#8E8E93]">
                One sentence is enough. Pick an age band, reading level and art style.
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <div className="aspect-[4/3] rounded-2xl border border-[#E5E5EA] bg-white p-3">
                <div className="grid h-full grid-cols-3 grid-rows-2 gap-2">
                  {SPREADS.map((s) => (
                    <div key={s.variant} className="overflow-hidden rounded-lg bg-[#FFF5EE]">
                      <Scene variant={s.variant} className="h-full w-full" />
                    </div>
                  ))}
                  <div className="flex items-center justify-center rounded-lg border border-dashed border-[#E5E5EA] text-[10px] font-medium text-[#C7C7CC]">
                    Generating…
                  </div>
                  <div className="flex items-center justify-center rounded-lg border border-[#EAF7F1] bg-[#EAF7F1] text-[10px] font-semibold text-[#3E9C7A]">
                    ✓ All pages
                  </div>
                </div>
              </div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8E8E93]">Step 02</p>
              <h3 className="mt-1.5 text-base font-semibold text-[#2D2D2D]">AI illustrates every page</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#8E8E93]">
                Your character stays visually consistent from page 1 to the last spread.
              </p>
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex aspect-[4/3] flex-col justify-center gap-2.5 rounded-2xl border border-[#E5E5EA] bg-white p-4">
                {[
                  { file: 'interior.pdf', spec: '8.5 × 8.5 in · 24 pages · bleed + gutter' },
                  { file: 'cover.pdf', spec: 'Full wrap · spine width calculated' },
                ].map((f) => (
                  <div key={f.file} className="flex items-center gap-3 rounded-xl border border-[#E5E5EA] bg-[#FAFAFB] px-3 py-2.5">
                    <span className="rounded-md bg-[#FF6B8A]/10 px-2 py-1 text-[9px] font-bold tracking-wide text-[#FF6B8A]">
                      PDF
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-medium text-[#2D2D2D]">{f.file}</div>
                      <div className="truncate text-[10px] text-[#8E8E93]">{f.spec}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8E8E93]">Step 03</p>
              <h3 className="mt-1.5 text-base font-semibold text-[#2D2D2D]">Export print-ready files</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#8E8E93]">
                Reader PDF, or KDP interior and full cover with bleed, gutter and spine handled.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 03 · Bento capability grid */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionLabel>What you can make</SectionLabel>

        <div className="grid gap-3 sm:grid-cols-2 lg:auto-rows-[172px] lg:grid-cols-4">
          {/* Same character */}
          <div className="flex flex-col rounded-2xl border border-[#E5E5EA] bg-[#FFFBF7] p-5 sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <h3 className="text-base font-semibold text-[#2D2D2D]">Same character, every page</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#8E8E93]">
              Character consistency is locked across the whole book.
            </p>
            <div className="mt-3 grid min-h-[180px] flex-1 grid-cols-3 gap-2 lg:min-h-0">
              {SPREADS.map((s, i) => (
                <div key={s.variant} className="relative overflow-hidden rounded-xl bg-white">
                  <Scene variant={s.variant} className="absolute inset-0 h-full w-full" />
                  <span className="absolute left-2 top-2 rounded bg-white/85 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-[#2D2D2D]">
                    PAGE {String(i === 0 ? 1 : i === 1 ? 7 : 14).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 15 styles */}
          <div className="flex flex-col rounded-2xl border border-[#E5E5EA] bg-white p-5 sm:col-span-2 lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#2D2D2D]">15 illustration styles</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#8E8E93]">
                  Watercolor, cut-paper, pencil, gouache and more.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#FFF5EE] px-2.5 py-1 text-[10px] font-semibold text-[#FF6B8A]">
                15
              </span>
            </div>
            <div className="mt-3 grid min-h-[96px] flex-1 grid-cols-2 gap-2 lg:min-h-0">
              {[COVERS[1], COVERS[2]].map((c) => (
                <div key={c.variant} className="relative overflow-hidden rounded-xl">
                  <BookCover
                    variant={c.variant}
                    title={c.title}
                    ink={c.ink}
                    showTitle={false}
                    className="h-full w-full"
                  />
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-medium text-[#2D2D2D]">
                    {c.style}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Photo to character */}
          <div className="flex flex-col rounded-2xl border border-[#E5E5EA] bg-white p-5">
            <h3 className="text-base font-semibold text-[#2D2D2D]">Photo → character</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#8E8E93]">Consent-first, never required.</p>
            <div className="mt-3 flex flex-1 items-center justify-center gap-2.5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-[#C7C7CC] bg-[#FAFAFB] text-[#C7C7CC]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l.8-1.4A1.5 1.5 0 0 1 9.8 4h4.4c.5 0 1 .3 1.3.6L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <circle cx="12" cy="12.2" r="3.1" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </div>
              <span className="text-sm text-[#C7C7CC]">→</span>
              <BunnyFace className="h-16 w-16 rounded-full" />
            </div>
          </div>

          {/* Languages */}
          <div className="flex flex-col rounded-2xl border border-[#E5E5EA] bg-white p-5">
            <h3 className="text-base font-semibold text-[#2D2D2D]">10 book languages</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#8E8E93]">One story, many editions.</p>
            <div className="mt-3 flex flex-1 flex-wrap content-start gap-1.5">
              {LANGUAGES.map((l) => (
                <Chip key={l}>{l}</Chip>
              ))}
            </div>
          </div>

          {/* KDP */}
          <div className="flex flex-col rounded-2xl border border-[#E5E5EA] bg-white p-5 sm:col-span-2 lg:col-span-2">
            <h3 className="text-base font-semibold text-[#2D2D2D]">KDP-ready interior + cover</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#8E8E93]">
              Two separate PDFs that pass Amazon&apos;s print spec.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Chip>8.5 × 8.5</Chip>
              <Chip>BLEED</Chip>
              <Chip>GUTTER</Chip>
              <Chip>SPINE WIDTH</Chip>
              <Chip>24+ PAGES</Chip>
            </div>
            <div className="mt-2.5 grid min-h-[70px] flex-1 grid-cols-2 gap-2 lg:min-h-0">
              {['Interior PDF', 'Full cover PDF'].map((label) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center rounded-lg border border-[#E5E5EA] bg-[#FAFAFB] text-[10px] font-medium uppercase tracking-[0.1em] text-[#8E8E93]"
                >
                  <span className="mb-1 text-[9px] font-bold text-[#FF6B8A]">PDF</span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Narration */}
          <div className="flex flex-col rounded-2xl border border-[#E5E5EA] bg-white p-5 sm:col-span-2 lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#2D2D2D]">Narration &amp; music</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#8E8E93]">Creator plans and above.</p>
              </div>
              <span className="shrink-0 rounded-full border border-[#E5E5EA] px-2.5 py-1 text-[10px] font-medium text-[#8E8E93]">
                Read-aloud
              </span>
            </div>
            <div className="mt-3 flex min-h-[64px] flex-1 items-end gap-1 lg:min-h-0">
              {WAVE.map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-sm bg-[#C8A2E8]/45"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 04 · Book gallery */}
      <section id="samples" className="scroll-mt-20 border-y border-[#E5E5EA] bg-[#FAF0E6]/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8E8E93]">Sample books</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#2D2D2D] sm:text-3xl">
              What a finished book looks like
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#8E8E93]">
              Illustrative examples of the art styles, grade labels and page counts you can produce.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {COVERS.map((book) => (
              <div key={book.title}>
                <div className="overflow-hidden rounded-2xl border border-[#E5E5EA] bg-white shadow-sm">
                  <BookCover
                    variant={book.variant}
                    title={book.title}
                    ink={book.ink}
                    className="aspect-[3/4] w-full"
                  />
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <strong className="text-sm font-semibold text-[#2D2D2D]">{book.title}</strong>
                  <span className="shrink-0 text-[11px] text-[#8E8E93]">{book.meta}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E93]">Reading levels</span>
            {['GRL A', 'GRL B', 'GRL C', 'GRL D', 'GRL E'].map((g) => (
              <Chip key={g}>{g}</Chip>
            ))}
          </div>
        </div>
      </section>

      {/* 05 · Trust */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              title: 'Parental consent before photos',
              body: 'Child photos are never processed without a recorded, revocable guardian consent.',
            },
            {
              title: 'KDP geometry, handled',
              body: 'Bleed, gutter, spine width and page-count rules are checked before export.',
            },
            {
              title: 'Your books stay yours',
              body: 'The library never expires. Optional credit packs never expire either.',
            },
          ].map((item) => (
            <div key={item.title} className="border-t-2 border-[#2D2D2D] pt-4">
              <strong className="block text-sm font-semibold text-[#2D2D2D]">{item.title}</strong>
              <p className="mt-1.5 text-sm leading-relaxed text-[#8E8E93]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 06 · Pricing teaser */}
      <section className="border-y border-[#E5E5EA] bg-[#FAF0E6]/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="mb-8 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8E8E93]">
            Simple pricing · annual saves up to 25%
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border bg-white px-5 py-6 text-center ${
                  tier.featured ? 'border-[#2D2D2D] ring-1 ring-[#2D2D2D]' : 'border-[#E5E5EA]'
                }`}
              >
                {tier.featured && (
                  <span className="mb-2 inline-block rounded-full bg-[#FFF5EE] px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#FF6B8A]">
                    Most popular
                  </span>
                )}
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">
                  {tier.name}
                </div>
                <div className="mt-1.5 text-[28px] font-bold leading-none text-[#2D2D2D]">{tier.amount}</div>
                <div className="mt-2 text-[11px] leading-relaxed text-[#8E8E93]">{tier.note}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[12px] text-[#8E8E93]">
            <Link
              href="/pricing"
              className="font-medium text-[#2D2D2D] underline decoration-[#C7C7CC] underline-offset-4 hover:decoration-[#2D2D2D]"
            >
              Compare all plans →
            </Link>
            <span>5-book credit pack · $9 · never expires</span>
          </div>
        </div>
      </section>

      {/* 07 · Final CTA + FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="rounded-3xl border border-[#FFDAB9] bg-[#FFF5EE] px-6 py-12 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8E8E93]">Start now</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#2D2D2D] sm:text-3xl">
            Start your first book — free
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#8E8E93]">
            One complete book, no credit card. Upgrade only when you need more.
          </p>
          <Link href="/create" className="apple-button mt-7 inline-block px-8 py-3.5 text-base">
            Start free — no credit card
          </Link>
        </div>

        <div className="mx-auto mt-14 max-w-2xl">
          <h2 className="mb-2 text-center text-lg font-semibold text-[#2D2D2D]">Questions, answered</h2>
          {FAQS.map((item) => (
            <details key={item.q} open={item.open} className="group border-b border-[#E5E5EA] py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#2D2D2D] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="shrink-0 text-[#8E8E93] group-open:hidden">+</span>
                <span className="hidden shrink-0 text-[#8E8E93] group-open:block">–</span>
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-[#8E8E93]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
