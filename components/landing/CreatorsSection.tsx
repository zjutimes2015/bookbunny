import Link from 'next/link'

const SPECS = ['8.5 × 8.5', 'BLEED', 'GUTTER', 'SPINE WIDTH', '24+ PAGES']

/**
 * Audience split: everything a KDP seller needs, kept away from the
 * parent-facing hero. Bleed/gutter/spine jargon lives here, not up top.
 */
export default function CreatorsSection() {
  return (
    <section className="border-y border-[#E5E5EA] bg-[#2D2D2D] text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <p className="mb-8 text-[13px] font-semibold uppercase tracking-[0.18em] text-white/50">
          For creators &amp; KDP sellers
        </p>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Made to sell, not just to read.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
              Creator and Studio plans include a commercial license plus two separate
              print-ready PDFs — interior and full cover. Bleed, gutter, spine width
              and page-count rules are checked before export, so your files pass
              Amazon&apos;s print spec the first time.
            </p>
            <Link
              href="/pricing"
              className="mt-7 inline-block rounded-[14px] bg-white px-7 py-3.5 text-[15px] font-medium text-[#2D2D2D] transition hover:opacity-85"
            >
              See Creator plans →
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap gap-1.5">
              {SPECS.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-white/15 px-2 py-0.5 text-xs font-medium tracking-wide text-white/60"
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {['Interior PDF', 'Full cover PDF'].map((label) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-6 text-xs font-medium uppercase tracking-[0.1em] text-white/60"
                >
                  <span className="mb-1 text-[13px] font-bold text-[#FF8FAB]">PDF</span>
                  {label}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/40">
              KDP geometry, handled — checked before every export.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
