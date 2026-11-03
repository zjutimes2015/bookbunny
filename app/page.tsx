import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'

import { BookCover, BunnyFace, COVERS, SPREADS, Scene } from '@/components/landing/book-art'
import BookFlip from '@/components/landing/BookFlip'
import SampleReader from '@/components/landing/SampleReader'
import Testimonials from '@/components/landing/Testimonials'
import CreatorsSection from '@/components/landing/CreatorsSection'


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

const TIERS = [
  { name: 'Free', amount: '$0', note: '1 book a month · watermarked preview' },
  { name: 'Creator', amount: '$29', note: 'per month · 8 books + KDP + commercial license', featured: true },
  { name: 'Studio', amount: '$79', note: 'per month · 22 books + batch generation' },
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
    q: 'Will the character really look the same on every page?',
    a: 'Yes — that\u2019s the whole point of SproutTales. Your hero is created once and locked as a visual reference, so the same face, outfit and art style carry through from page 1 to the last spread. Flip through the sample books above to see it in action.',
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

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-md border border-[#E5E5EA] px-2 py-0.5 text-[10px] font-medium tracking-wide text-[#8E8E93]">
    {children}
  </span>
)

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8E8E93]">{children}</p>
)

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
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      {/* 01 · Hero — parents first: your child is the hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_1fr] lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E5E5EA] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8E8E93]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B8A]" />
              Personalized AI picture books · GRL A–E leveled readers
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[#2D2D2D] sm:text-5xl lg:text-[52px]">
              Your child, as the hero of{' '}
              <span className="bunny-text-gradient whitespace-nowrap">their own storybook.</span>
            </h1>

            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-[#8E8E93]">
              Upload a photo — with your recorded consent — and watch your child become
              the hero. The same character on every page, GRL A–E leveled text, and
              print-ready KDP PDFs. In minutes.
            </p>

            {/* Photo → character, front and center */}
            <div className="mt-7 flex items-center gap-4 rounded-2xl border border-[#E5E5EA] bg-[#FFFBF7] p-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-[#C7C7CC] bg-white text-[#C7C7CC]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l.8-1.4A1.5 1.5 0 0 1 9.8 4h4.4c.5 0 1 .3 1.3.6L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <circle cx="12" cy="12.2" r="3.1" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </div>
              <span className="shrink-0 text-lg text-[#C7C7CC]" aria-hidden="true">→</span>
              <BunnyFace className="h-16 w-16 shrink-0 rounded-full border border-[#E5E5EA]" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#2D2D2D]">Photo → character</div>
                <div className="mt-0.5 text-[12px] leading-snug text-[#8E8E93]">
                  Consent-first, never required. Your child&apos;s photo becomes their
                  storybook hero.
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="/create" className="apple-button px-7 py-3.5 text-base">
                Create your first book — free
              </Link>
              <a
                href="#samples"
                className="text-sm font-medium text-[#2D2D2D] underline decoration-[#C7C7CC] underline-offset-4 transition-colors hover:decoration-[#2D2D2D]"
              >
                See sample books ↓
              </a>
              <Link
                href="/buddy"
                className="text-sm font-medium text-[#2D2D2D] underline decoration-[#C7C7CC] underline-offset-4 transition-colors hover:decoration-[#2D2D2D]"
              >
                Or talk to Lila & Kai
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] leading-relaxed text-[#8E8E93]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5EA] bg-[#EAF7F1] px-2.5 py-1 font-medium text-[#3E9C7A]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                COPPA-first
              </span>
              <span>Free plan · 1 book · No credit card</span>
              <span>Child photos never processed without recorded parental consent</span>
            </div>
          </div>

          {/* Flippable hero book */}
          <BookFlip />
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

          {/* GRL leveled text */}
          <div className="flex flex-col rounded-2xl border border-[#E5E5EA] bg-white p-5">
            <h3 className="text-base font-semibold text-[#2D2D2D]">GRL A–E leveled text</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#8E8E93]">
              The right words for the right age.
            </p>
            <div className="mt-3 flex flex-1 flex-wrap content-start gap-1.5">
              {['GRL A', 'GRL B', 'GRL C', 'GRL D', 'GRL E'].map((g) => (
                <Chip key={g}>{g}</Chip>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#8E8E93]">
              Every book is leveled for ages 3–8.
            </p>
          </div>
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

          {/* Bento CTA */}
          <Link
            href="/create"
            className="flex flex-col justify-center rounded-2xl bg-[#2D2D2D] p-5 text-white sm:col-span-2 lg:col-span-2"
          >
            <h3 className="text-base font-semibold">Your first book is free</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/60">
              One complete book · no credit card · consent-first photos.
            </p>
            <span className="mt-3 text-sm font-medium underline underline-offset-4">
              Create it now →
            </span>
          </Link>
        </div>
      </section>

      {/* 04 · Book gallery — flippable previews */}
      <section id="samples" className="scroll-mt-20 border-y border-[#E5E5EA] bg-[#FAF0E6]/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8E8E93]">Sample books</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#2D2D2D] sm:text-3xl">
              Flip through a finished book
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#8E8E93]">
              Covers and interior art show the styles, grade labels and page counts you can produce.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
            {COVERS.map((book) => (
              <SampleReader key={book.title} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* 04b · Social proof (placeholder content — replace with real reviews) */}
      <Testimonials />

      {/* 04c · For creators & KDP sellers */}
      <CreatorsSection />

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
              body: 'The library never expires. Pro Animation Packs never expire either.',
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
            <span>Pro Animation Pack · 5 books for $55 · never expires</span>
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
            Create your first book — free
          </Link>
          <p className="mt-4 text-[11px] text-[#8E8E93]">
            Free plan · 1 book · No credit card · Parental consent required for photos
          </p>
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
