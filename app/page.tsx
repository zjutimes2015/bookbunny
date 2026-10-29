import type { Metadata } from 'next'
import Link from 'next/link'
import HomeFaq from '@/components/HomeFaq'
import { KaiPortrait, LilaPortrait } from '@/components/BuddyPortraits'
import { SITE_URL, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: "AI Children's Picture Book Generator — Free Plan",
  description:
    'AI picture book generator with consistent characters on every page, GRL A–E leveled text, and print-ready Amazon KDP PDFs. Free plan: 1 book/month, no credit card.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "AI Children's Picture Book Generator — SproutTales",
    description:
      'Turn an idea into a real picture book with consistent characters. GRL A–E leveled text, print-ready Amazon KDP PDFs, 10 languages. Free plan — no credit card.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SproutTales — AI children\'s picture book generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "AI Children's Picture Book Generator — SproutTales",
    description:
      'Turn an idea into a real picture book with consistent characters. GRL A–E, KDP-ready PDFs, 10 languages. Start free.',
    images: ['/twitter-image.png'],
  },
  keywords: [
    'AI picture book generator',
    'AI children book generator',
    'AI storybook generator',
    'make a children book with AI',
    'create a children book online',
    'AI picture book generator free',
    'personalized children book AI',
    'KDP picture book AI',
    'leveled reader AI GRL A-E',
    'character consistent AI illustration',
    'AI book creator for kids',
    'photo to character AI',
    'SproutTales',
  ],
  robots: {
    index: true,
    follow: true,
  },
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
  { name: 'Free', amount: '$0', note: '1 book a month · watermarked preview', featured: false },
  { name: 'Creator', amount: '$29', note: 'per month · 8 books + KDP + commercial license', featured: true },
  { name: 'Studio', amount: '$79', note: 'per month · 22 books + batch generation', featured: false },
]

const LANGUAGES = ['EN', 'ZH', 'ZH-TW', 'ES', 'FR', 'DE', 'JA', 'KO', 'PT', 'IT']

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
    a: 'Books never expire. Plan allowances reset monthly; Pro Animation Packs never expire.',
  },
  {
    q: 'What exactly is included in the free plan?',
    a: 'One complete 8-page book each month with a watermarked preview and three art styles. Watermark-free PDF export starts on Creator.',
  },
  {
    q: 'Do I need design or writing skills?',
    a: 'No. Describe an idea in one sentence; the editor handles structure, illustration prompts and text layout.',
  },
]

const FEATURES = [
  {
    title: 'Same character',
    description: 'The child you describe stays visually the same from page 1 to the last spread.',
  },
  {
    title: 'GRL A–E text',
    description: 'Leveled wording for early readers. Pick an age band and the sentences follow.',
  },
  {
    title: 'Fifteen art styles',
    description: 'Watercolor, cut-paper, pencil, gouache, and more — one style for the whole book.',
  },
  {
    title: 'Photo, with consent',
    description: 'A guardian can turn a photo into a character. Photos are never required, and consent can be withdrawn.',
  },
  {
    title: 'Ten languages',
    description: 'One story, editions in EN, ZH, ZH-TW, ES, FR, DE, JA, KO, PT, and IT.',
  },
  {
    title: 'KDP-ready PDFs',
    description: 'Interior and full cover, with bleed, gutter, and spine width on Creator and Studio.',
  },
]

const buttonClass =
  'rounded-md bg-black px-5 py-2 text-base font-semibold text-white transition duration-300 hover:bg-gray-800'

const displayClass = 'mb-4 text-2xl tracking-tighter text-gray-900 sm:text-3xl md:text-4xl lg:text-5xl'

function Split({
  copy,
  art,
}: {
  copy: React.ReactNode
  art: React.ReactNode
}) {
  return (
    <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 md:flex-row">
        <div className="order-2 w-full md:order-1 md:w-1/2">{copy}</div>
        <div className="order-1 flex w-full justify-center md:order-2 md:w-1/2 md:justify-end">{art}</div>
      </div>
    </section>
  )
}

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

export default function HomePage() {
  return (
    <div className="bg-white" style={{ fontFamily: '"Inter Tight", Inter, system-ui, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

      <section className="mx-4 my-16 text-center sm:mx-8 md:mx-16 lg:mx-24 lg:my-28">
        <h1 className="mb-6 text-4xl tracking-tighter text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
          AI picture book generator for real storybooks
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-xl font-light text-gray-600">
          Describe a story. Get the same character on every page, GRL A–E leveled text, and a print-ready Amazon KDP PDF.
        </p>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          <Link href="/create" className={buttonClass}>
            Start free
          </Link>
          <Link href="#samples" className={buttonClass}>
            See the books
          </Link>
        </div>
        <p className="mt-8 text-sm font-light text-gray-500">
          <Link href="/buddy" className="underline decoration-gray-300 underline-offset-4 hover:decoration-black">
            Or talk to Lila &amp; Kai
          </Link>
          <span className="mx-2">·</span>
          Free plan includes 1 book · No credit card · Photos need parental consent
        </p>
      </section>

      <section className="container mx-auto rounded-lg bg-gray-50 px-4 py-12 transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl text-gray-900 sm:text-3xl md:text-4xl lg:text-5xl">Features</h2>
            <p className="mt-8 text-xl font-light text-gray-600">
              A finished picture book, from one sentence. The cards below are the parts parents actually use.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-2 text-xl font-semibold text-gray-800">{feature.title}</h3>
                <p className="font-light text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Split
        copy={
          <>
            <h2 className={displayClass}>The same character, on every page</h2>
            <p className="text-xl font-light text-gray-600">
              These three spreads are one book. The bunny, the lantern, and the night stay recognizable from the meadow to the garden.
            </p>
          </>
        }
        art={
          <div className="w-full max-w-md">
            <div className="overflow-hidden rounded-lg bg-[#FFF5EE] shadow-md">
              <div className="relative aspect-[4/3]">
                {SPREADS.map((spread, index) => (
                  <div key={spread.variant} className={`home-slide home-slide-${index + 1} absolute inset-0`}>
                    <Scene variant={spread.variant} className="h-full w-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {SPREADS.map((spread) => (
                <div key={spread.variant} className="overflow-hidden rounded-lg shadow-md" role="img" aria-label={spread.alt}>
                  <Scene variant={spread.variant} className="aspect-[4/3] w-full" />
                </div>
              ))}
            </div>
          </div>
        }
      />

      <div className="w-full bg-black py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 md:flex-row md:justify-between md:px-8">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
              One free book a month. Ten languages. Reading levels A through E.
            </h2>
            <p className="mt-4 text-sm font-light tracking-wide text-white/75">{LANGUAGES.join(' · ')}</p>
          </div>
          <div className="flex items-center gap-4">
            <LilaPortrait size={96} />
            <KaiPortrait size={96} />
          </div>
        </div>
      </div>

      <Split
        copy={<HomeFaq items={FAQS} />}
        art={
          <div className="flex flex-col items-center md:items-end">
            <h2 className={displayClass}>Ask Lila or Kai</h2>
            <p className="mb-6 text-xl font-light text-gray-600">
              Say the child&apos;s name, age, and story. They show the page count, reading level, and credit cost before anything is made.
            </p>
            <div className="flex items-end gap-4">
              <LilaPortrait size={140} />
              <KaiPortrait size={140} />
            </div>
            <Link href="/buddy" className={`${buttonClass} mt-6 inline-block`}>
              Talk to Lila &amp; Kai
            </Link>
          </div>
        }
      />

      <section id="samples" className="scroll-mt-24 bg-gray-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center text-3xl tracking-tighter text-gray-900 sm:text-4xl lg:text-5xl">
            What a finished book looks like
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-xl font-light text-gray-600">
            Lila, Kai, and the moon bunny — sample covers with the reading level and page count you can produce.
          </p>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 pt-4 sm:grid-cols-3">
            {COVERS.map((book) => (
              <article key={book.title} className="rounded-lg bg-white p-4 shadow-md">
                <div className="overflow-hidden rounded-lg">
                  <BookCover variant={book.variant} title={book.title} ink={book.ink} className="aspect-[3/4] w-full" />
                </div>
                <h3 className="mt-4 text-xl text-gray-900">{book.title}</h3>
                <p className="font-light text-gray-600">{book.meta}</p>
                <p className="text-sm font-light text-gray-500">{book.style}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
        <h2 className="mb-10 text-center text-3xl tracking-tighter text-gray-900 sm:text-4xl lg:text-5xl">Simple pricing</h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg p-6 shadow-md ${tier.featured ? 'bg-black text-white' : 'bg-white text-gray-900'}`}
            >
              <p className={`text-sm font-light ${tier.featured ? 'text-white/70' : 'text-gray-500'}`}>{tier.name}</p>
              <p className="mt-2 text-4xl tracking-tighter">{tier.amount}</p>
              <p className={`mt-3 font-light ${tier.featured ? 'text-white/80' : 'text-gray-600'}`}>{tier.note}</p>
              {tier.featured && <p className="mt-4 text-sm font-semibold">Most parents start here</p>}
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm font-light text-gray-500">
          <Link href="/pricing" className="underline decoration-gray-300 underline-offset-4 hover:decoration-black">
            Compare all plans
          </Link>
          <span className="mx-2">·</span>
          Pro Animation Pack · 5 books for $55 · never expires
        </p>
      </section>

      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 md:flex-row">
          <div className="flex w-full justify-center md:w-1/2 md:justify-start">
            <div className="grid w-full max-w-md grid-cols-2 gap-3">
              <div className="col-span-2 overflow-hidden rounded-lg shadow-md">
                <Scene variant="meadow" className="aspect-[4/3] w-full" />
              </div>
              <div className="overflow-hidden rounded-lg shadow-md">
                <BookCover variant="lila" title="Lila and the Paper Boat" ink="#2F4A63" showTitle={false} className="aspect-[3/4] w-full" />
              </div>
              <div className="overflow-hidden rounded-lg shadow-md">
                <BookCover variant="kai" title="Kai's Quiet Garden" ink="#4A4327" showTitle={false} className="aspect-[3/4] w-full" />
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <h2 className={displayClass}>Start the first book free</h2>
            <p className="mb-6 text-xl font-light text-gray-800">
              One complete book, no credit card. Creator and Studio add watermark-free PDFs, KDP files, and read-aloud.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/create" className={buttonClass}>
                Start free
              </Link>
              <Link href="/pricing" className={buttonClass}>
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
