import Link from 'next/link'

/**
 * Sample-books showcase (replaces the "Loved by families" placeholder).
 *
 * No reviews exist yet, so this section shows real sample books instead of
 * invented quotes. Covers below are the generated sample covers shipped in
 * public/samples/ — the same three books shown in the "Made for your
 * reader's age" gallery above. When real parent/creator quotes arrive,
 * this section can become (or sit beside) a testimonials block.
 * No numbers here are invented: no books-created / happy-families counts
 * are shown because no verified counts are available.
 */
const SAMPLE_BOOKS = [
  {
    cover: '/samples/cover-moon-bunny.webp',
    title: 'The Moon Bunny',
    meta: 'Ages 3–5 · GRL A–B · 16 pages',
  },
  {
    cover: '/samples/cover-paper-boat.webp',
    title: 'Lila and the Paper Boat',
    meta: 'Ages 6–8 · GRL C–D · 12 pages',
  },
  {
    cover: '/samples/cover-quiet-garden.webp',
    title: 'Kai’s Quiet Garden',
    meta: 'Ages 9–12 · GRL E · 20 pages',
  },
]

export default function SampleBooks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mb-10 text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#545558]">
          Sample books
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#2D2D2D] sm:text-3xl">
          Made with SproutTales
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#545558]">
          Three finished books, generated with SproutTales — same hero, same art
          style, cover to last page.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
        {SAMPLE_BOOKS.map((book) => (
          <div key={book.title}>
            <div className="relative overflow-hidden rounded-2xl border border-[#E5E5EA] bg-white shadow-sm">
              <div className="relative aspect-[3/4] w-full">
                <img
                  src={book.cover}
                  alt={`${book.title} — sample book cover`}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="mt-3">
              <strong className="text-sm font-semibold text-[#2D2D2D]">{book.title}</strong>
              <p className="mt-1 text-[13px] text-[#545558]">{book.meta}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-[13px] text-[#545558]">
        Covers are generated samples of the art styles SproutTales can produce.
      </p>
      <p className="mt-4 text-center">
        <Link
          href="/create"
          className="text-sm font-medium text-[#2D2D2D] underline underline-offset-4"
        >
          Create your own book →
        </Link>
      </p>
    </section>
  )
}
