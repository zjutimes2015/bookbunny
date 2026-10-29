import { useId } from 'react'

export type AgeBookId = '3-5' | '5-7' | '7-10'

export interface AgeBook {
  id: AgeBookId
  ages: string
  grl: string
  pages: string
  title: string
  sentence: string
  style: string
}

export const AGE_BOOKS: [AgeBook, AgeBook, AgeBook] = [
  {
    id: '3-5',
    ages: 'Ages 3–5',
    grl: 'GRL B',
    pages: '12 pages',
    title: 'Lila and the Red Boots',
    sentence: 'Lila sees the boat.',
    style: 'Flat gouache · one clear action',
  },
  {
    id: '5-7',
    ages: 'Ages 5–7',
    grl: 'GRL C',
    pages: '16 pages',
    title: 'The Path on the Map',
    sentence: 'Kai opened the map and chose the uphill path.',
    style: 'Pencil and flat color · a real place',
  },
  {
    id: '7-10',
    ages: 'Ages 7–10',
    grl: 'GRL E',
    pages: '24 pages',
    title: 'Signal on the Ridge',
    sentence: 'The ridge went quiet. Nora wrote the time, then waited for the signal.',
    style: 'Textured gouache · illustrated chapter',
  },
]

function PreschoolScene() {
  return (
    <>
      <rect width="300" height="400" fill="#E7F3FB" />
      <ellipse cx="70" cy="78" rx="36" ry="16" fill="#FFFFFF" />
      <ellipse cx="98" cy="74" rx="22" ry="12" fill="#FFFFFF" />
      <path d="M0 286 Q 80 268 160 286 T 300 278 V400 H0 Z" fill="#C9DEB4" />
      <ellipse cx="168" cy="318" rx="62" ry="16" fill="#8FBFDA" />
      <ellipse cx="168" cy="318" rx="36" ry="7" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.7" />
      {[[48, 150], [78, 188], [230, 164], [258, 206]].map(([x, y], i) => (
        <line key={i} x1={x} y1={y} x2={x - 3} y2={y + 12} stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      ))}
      <g transform="translate(118 168)">
        <path d="M-8 118 h10 v16 h-10 Z M16 118 h10 v16 h-10 Z" fill="#D24B4B" />
        <path d="M-34 128 q 0 -70 34 -72 q 34 2 34 72 Z" fill="#F2C14E" />
        <circle cx="0" cy="28" r="20" fill="#E2B48A" />
        <path d="M-20 22 q 6 -22 20 -20 q 16 2 20 20 q -10 -8 -20 -6 q -12 2 -20 6 Z" fill="#4A3226" />
        <circle cx="-16" cy="34" r="6" fill="#4A3226" />
        <circle cx="16" cy="34" r="6" fill="#4A3226" />
        <circle cx="-6" cy="30" r="2" fill="#2A241C" />
        <circle cx="7" cy="30" r="2" fill="#2A241C" />
        <path d="M-5 40 q 6 4 11 0" stroke="#2A241C" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
      <g transform="translate(196 292)">
        <path d="M0 10 L48 10 L36 24 L12 24 Z" fill="#FFFDF8" />
        <path d="M24 0 L24 10 M24 0 L44 10 M24 0 L4 10" stroke="#D9CDB8" strokeWidth="1.5" fill="none" />
      </g>
    </>
  )
}

function ReaderScene({ gid }: { gid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${gid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4E2C4" />
          <stop offset="100%" stopColor="#D5E3C2" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill={`url(#${gid}-sky)`} />
      <path d="M40 250 Q 70 150 92 250" fill="#6E8B55" />
      <path d="M210 246 Q 246 132 274 246" fill="#5E7A49" />
      <rect x="58" y="228" width="8" height="28" fill="#8A6A42" />
      <rect x="236" y="220" width="10" height="32" fill="#7A5A38" />
      <path d="M118 400 L168 214 L214 400 Z" fill="#C4A56A" />
      <path d="M0 332 Q 90 308 300 328 V400 H0 Z" fill="#B7C48A" />
      <g transform="translate(78 246)">
        <rect x="0" y="0" width="4" height="46" fill="#8A6A42" />
        <path d="M4 4 h28 l-6 10 h-22 Z" fill="#F4EFE4" />
        <path d="M8 8 h16" stroke="#6E8B55" strokeWidth="1.4" />
      </g>
      <g transform="translate(132 214)">
        <path d="M-10 150 h12 v18 h-12 Z M14 150 h12 v18 h-12 Z" fill="#3E4A38" />
        <path d="M-28 168 q 0 -78 28 -78 q 28 0 28 78 Z" fill="#5E8A4A" />
        <path d="M-22 96 q 8 16 22 8" stroke="#C4A56A" strokeWidth="8" fill="none" strokeLinecap="round" />
        <circle cx="0" cy="36" r="18" fill="#E2B48A" />
        <path d="M-16 28 q 6 -16 18 -14 q 12 2 14 16 q -8 -6 -16 -4 q -10 2 -16 2 Z" fill="#3C3428" />
        <circle cx="-6" cy="36" r="7" fill="none" stroke="#2A241C" strokeWidth="1.6" />
        <circle cx="8" cy="36" r="7" fill="none" stroke="#2A241C" strokeWidth="1.6" />
        <path d="M-1 36 h3" stroke="#2A241C" strokeWidth="1.6" />
        <path d="M-4 46 q 5 3 9 0" stroke="#2A241C" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M18 70 q 22 8 34 28" stroke="#5E8A4A" strokeWidth="7" fill="none" strokeLinecap="round" />
        <rect x="40" y="88" width="28" height="20" rx="2" fill="#F7F1E4" transform="rotate(12 54 98)" />
        <path d="M46 96 h16 M46 102 h12" stroke="#8A6A42" strokeWidth="1.2" transform="rotate(12 54 98)" />
      </g>
    </>
  )
}

function ChapterScene({ gid }: { gid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${gid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F2D2BE" />
          <stop offset="55%" stopColor="#C9B7C4" />
          <stop offset="100%" stopColor="#7E97AB" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill={`url(#${gid}-sky)`} />
      <path d="M0 268 Q 80 228 160 262 T 300 248 V400 H0 Z" fill="#8AA0A4" />
      <path d="M0 318 Q 110 286 220 314 T 300 300 V400 H0 Z" fill="#6E8578" />
      <path d="M0 360 Q 120 340 300 352 V400 H0 Z" fill="#4E6458" />
      <g transform="translate(214 150)">
        <line x1="0" y1="0" x2="0" y2="46" stroke="#2C3A44" strokeWidth="2" />
        <circle cx="0" cy="0" r="4" fill="#E7D7C4" />
        <path d="M-10 14 q 10 6 20 0" stroke="#2C3A44" strokeWidth="1.4" fill="none" />
      </g>
      <g transform="translate(128 168)">
        <path d="M-7 176 h10 v26 h-10 Z M12 176 h10 v26 h-10 Z" fill="#2A3340" />
        <path d="M-24 192 L-20 76 Q0 66 20 76 L24 192 Z" fill="#31465C" />
        <path d="M-16 192 h32" stroke="#243242" strokeWidth="3" />
        <circle cx="0" cy="84" r="15" fill="#D7A888" />
        <path d="M-13 78 q 4 -16 14 -13 q 11 2 13 15 q -6 5 -14 2 q -8 -2 -13 -4 Z" fill="#2C241C" />
        <path d="M12 70 q 16 -14 20 -2" stroke="#2C241C" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="-4" cy="84" r="1.4" fill="#241C16" />
        <circle cx="4" cy="84" r="1.4" fill="#241C16" />
        <path d="M-3 92 q 3 2 6 0" stroke="#241C16" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d="M14 108 q 16 12 14 30" stroke="#31465C" strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x="20" y="128" width="26" height="32" rx="2" fill="#F4EFE4" />
        <path d="M24 136 h16 M24 143 h14 M24 150 h12" stroke="#8A7764" strokeWidth="1.2" />
      </g>
    </>
  )
}

function frameOf(id: AgeBookId): string {
  switch (id) {
    case '3-5':
      return '0 155 300 225'
    case '5-7':
      return '0 165 300 225'
    case '7-10':
      return '0 175 300 225'
    default: {
      const exhaustive: never = id
      throw new Error(`Unknown age book ${exhaustive}`)
    }
  }
}

function CoverArt({ id, gid }: { id: AgeBookId; gid: string }) {
  switch (id) {
    case '3-5':
      return <PreschoolScene />
    case '5-7':
      return <ReaderScene gid={gid} />
    case '7-10':
      return <ChapterScene gid={gid} />
    default: {
      const exhaustive: never = id
      return exhaustive
    }
  }
}

export function AgeCover({ book, className = '' }: { book: AgeBook; className?: string }) {
  const gid = useId().replace(/:/g, '')
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`} role="img" aria-label={`${book.title}. ${book.ages}. ${book.grl}.`}>
      <svg viewBox={frameOf(book.id)} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <CoverArt id={book.id} gid={gid} />
      </svg>
      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gray-900">
        {book.ages}
      </span>
    </div>
  )
}

export function AgeSpread({ book, className = '' }: { book: AgeBook; className?: string }) {
  const gid = useId().replace(/:/g, '')
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`} role="img" aria-label={`${book.title} interior. ${book.sentence}`}>
      <svg viewBox={frameOf(book.id)} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <CoverArt id={book.id} gid={gid} />
      </svg>
      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-semibold text-white">
        <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
          <path d="M3 2.2 L10 6 L3 9.8 Z" fill="currentColor" />
        </svg>
        Page video
      </span>
    </div>
  )
}
