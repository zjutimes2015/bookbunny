export type AgeBook = {
  cover: string
  title: string
  age: string
  meta: string
  blurb: string
}

const BOOKS: AgeBook[] = [
  {
    cover: '/samples/cover-moon-bunny.webp',
    title: 'The Moon Bunny',
    age: 'Ages 3–5',
    meta: 'GRL A–B · 16 pages',
    blurb: 'Gentle bedtime magic — big pictures, few words, a read-aloud rhythm.',
  },
  {
    cover: '/samples/cover-paper-boat.webp',
    title: 'Lila and the Paper Boat',
    age: 'Ages 6–8',
    meta: 'GRL C–D · 12 pages',
    blurb: 'Brave little adventures — early readers follow longer story arcs.',
  },
  {
    cover: '/samples/cover-quiet-garden.webp',
    title: 'Kai\u2019s Quiet Garden',
    age: 'Ages 9–12',
    meta: 'GRL E · 20 pages',
    blurb: 'Mysteries worth solving — richer plots for confident readers.',
  },
]

/**
 * Sample books organized by reading age. Covers are illustrative
 * examples of the art styles SproutTales can produce.
 */
export default function AgeBooks() {
  return (
    <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
      {BOOKS.map((b) => (
        <div key={b.title}>
          <div className="relative overflow-hidden rounded-2xl border border-[#E5E5EA] bg-white shadow-sm">
            <div className="relative aspect-[3/4] w-full">
              <img
                src={b.cover}
                alt={`${b.title} — sample book cover`}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute left-3 top-3 rounded-full bg-[#2D2D2D]/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                {b.age}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-3">
            <strong className="text-sm font-semibold text-[#2D2D2D]">{b.title}</strong>
            <span className="shrink-0 text-[13px] text-[#545558]">{b.meta}</span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-[#545558]">{b.blurb}</p>
        </div>
      ))}
    </div>
  )
}
