/**
 * Social proof section.
 *
 * PLACEHOLDER CONTENT — every quote and every number below is a stand-in.
 * Replace with verified customer quotes / real product stats before launch.
 * Nothing here may be presented as a real review.
 */
const PLACEHOLDER_QUOTES = [
  {
    quote: '[Your first review — replace this with a real parent quote.]',
    name: '[Parent name]',
    detail: '[e.g. Mom of a 4-year-old]',
  },
  {
    quote: '[Your second review — replace this with a real parent quote.]',
    name: '[Parent name]',
    detail: '[e.g. Dad of a 6-year-old]',
  },
  {
    quote: '[Your third review — replace this with a real creator quote.]',
    name: '[Creator name]',
    detail: '[e.g. KDP publisher]',
  },
]

const PLACEHOLDER_STATS = [
  { value: '[—]', label: 'books created' },
  { value: '[—]', label: 'happy families' },
  { value: '10', label: 'book languages' },
]

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mb-10 text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#545558]">
          Early readers
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#2D2D2D] sm:text-3xl">
          Loved by families
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#545558]">
          Real quotes from real parents and creators will live here — this section is
          waiting on its first reviews.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLACEHOLDER_QUOTES.map((t) => (
          <figure
            key={t.name + t.detail}
            className="rounded-2xl border border-dashed border-[#C7C7CC] bg-[#FAFAFB] p-6"
          >
            <blockquote className="text-sm italic leading-relaxed text-[#545558]">
              {t.quote}
            </blockquote>
            <figcaption className="mt-4 text-sm font-medium text-[#545558]">
              {t.name}
              <span className="block font-normal">{t.detail}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 text-center">
        {PLACEHOLDER_STATS.map((s) => (
          <div key={s.label} className="flex flex-col">
            <dt className="order-2 mt-1 text-[13px] uppercase tracking-[0.12em] text-[#545558]">
              {s.label}
            </dt>
            <dd className="order-1 text-3xl font-bold text-[#2D2D2D]">{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-center text-[13px] text-[#545558]">
        * Bracketed numbers are placeholders — real stats will appear here once published.
      </p>
    </section>
  )
}
