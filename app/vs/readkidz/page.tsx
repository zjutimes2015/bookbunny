import type { Metadata } from 'next'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'SproutTales vs ReadKidz — AI Children’s Picture Book Generator Comparison'
const DESCRIPTION =
  'An honest comparison of SproutTales and ReadKidz: pricing model, credits, free-plan exports, pages per book, character consistency, photo privacy, and print-ready PDF export.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/vs/readkidz` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/vs/readkidz`,
    siteName: SITE_NAME,
    type: 'website',
  },
}

interface CompareRow {
  feature: string
  bookbunny: string
  readkidz: string
}

const ROWS: CompareRow[] = [
  {
    feature: 'Pricing model',
    bookbunny:
      'Flat subscription. Starter is free; Pro is $9.99/mo; Commercial is $49/mo. No per-creation charges.',
    readkidz:
      'Tiered monthly plans: Free $0, Standard $10/mo, Pro $30/mo ($25 annual), Mega $50/mo ($42 annual), Max $99/mo ($83 annual), plus Teams plans.',
  },
  {
    feature: 'Credits',
    bookbunny: 'None. Unlimited books — creations never expire.',
    readkidz:
      'Monthly plan credits that do not roll over and expire with the month. Creation steps draw credits, deducted at 50% off the listed cost.',
  },
  {
    feature: 'Free-plan export',
    bookbunny:
      'Starter is preview-only: up to 3 book pages with 1 character style. Full exports are a paid Pro feature.',
    readkidz: 'Free-plan exports carry a watermark.',
  },
  {
    feature: 'Pages per book',
    bookbunny: 'Up to 20 pages (Pro).',
    readkidz: '5 pages on the Free plan; paid tiers go to 50–60 pages per story.',
  },
  {
    feature: 'Reading levels & comprehension',
    bookbunny:
      'GRL A–E leveled text with matched vocabulary, comprehension questions, and a reading-progress view.',
    readkidz: '—',
  },
  {
    feature: 'Character consistency',
    bookbunny:
      'Enforced on every page with a reusable consistency line plus a stored reference character card.',
    readkidz: '—',
  },
  {
    feature: 'Photo privacy options',
    bookbunny:
      'Option A builds the character with no real photo at all; Option B uses a real photo with a privacy scope you select.',
    readkidz: '—',
  },
  {
    feature: 'KDP / print-ready export',
    bookbunny:
      'Two separate print-spec PDFs — interior plus a full cover (back, spine, front) — with bleed, gutter, spine width, and an even padded page count of at least 24.',
    readkidz:
      'Terms allow commercial use of output, such as publishing to Amazon KDP. AI outputs are non-exclusive.',
  },
  {
    feature: 'Physical printing',
    bookbunny: 'Digital only — SproutTales delivers PDFs, not a shipped book.',
    readkidz: 'Printed hardcover ships from $39.90.',
  },
  {
    feature: 'Languages',
    bookbunny: 'Multi-language book output.',
    readkidz: '—',
  },
]

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Is SproutTales cheaper than ReadKidz?',
    a: 'SproutTales is a flat subscription: Pro is $9.99/month with unlimited books and no credit meter, and Commercial is $49/month. ReadKidz offers a free tier and paid plans from $10/mo up to $99/mo that use monthly plan credits.',
  },
  {
    q: 'Do SproutTales books expire like monthly credits?',
    a: 'No. SproutTales has no credit system — it is a flat subscription with unlimited books, and the books you create never expire.',
  },
  {
    q: 'Does SproutTales watermark free exports?',
    a: 'SproutTales’s free Starter plan is preview-only: you can preview up to 3 book pages with one character style, and full exports are part of the paid Pro plan. ReadKidz’s free-plan exports carry a watermark.',
  },
  {
    q: 'Which is better if I want a printed hardcover book?',
    a: 'ReadKidz is the better fit if you want a physical book delivered — their printed hardcover ships from $39.90. SproutTales is digital: it produces print-ready PDFs you can upload to Amazon KDP or take to a printer yourself.',
  },
  {
    q: 'Which is better for animated videos, dubbing, and music?',
    a: 'ReadKidz is the better fit if you mainly want animation, voice dubbing, and background music — they offer picture books plus animated output. SproutTales focuses on illustrated picture books, leveled reading, and print-ready PDFs.',
  },
  {
    q: 'Can I publish books from either tool on Amazon KDP?',
    a: 'ReadKidz’s Terms allow commercial use of output, such as publishing to Amazon KDP, and note that AI outputs are non-exclusive. SproutTales exports two print-ready PDFs for KDP — a separate interior and a full cover — with bleed, gutter, spine width, and an even page count of at least 24; commercial rights are part of SproutTales’s Commercial plan.',
  },
]

export default function VsReadKidzPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-20 text-center">
        <div className="bunny-bounce mb-4 inline-block">
          <BunnyMascot size={72} />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto leading-[1.1]">
          SproutTales <span className="bunny-text-gradient">vs</span> ReadKidz
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          Both tools turn an idea into an illustrated children’s book. Here is an honest,
          side-by-side look at how they differ — including where ReadKidz is the stronger choice.
        </p>
      </section>

      {/* Comparison table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="apple-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5EA]">
                  <th className="w-1/4 px-5 py-4 text-left font-semibold text-[#2D2D2D]">Feature</th>
                  <th className="w-[37.5%] px-5 py-4 text-left font-semibold text-[#FF6B8A]">
                    SproutTales
                  </th>
                  <th className="w-[37.5%] px-5 py-4 text-left font-semibold text-[#2D2D2D]">
                    ReadKidz
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-[#F2F2F7] last:border-0 align-top">
                    <td className="px-5 py-4 font-medium text-[#2D2D2D]">{row.feature}</td>
                    <td className="px-5 py-4 bg-[#FFF9F7] text-[#2D2D2D] leading-relaxed">
                      {row.bookbunny}
                    </td>
                    <td className="px-5 py-4 text-[#8E8E93] leading-relaxed">{row.readkidz}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-[#8E8E93] mt-4">
          “—” means the feature was not part of the details we could verify from the competitor’s
          public pricing page. Always check readkidz.com for their current plans and features.
        </p>
      </section>

      {/* When each is the better fit */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="apple-card p-8">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">When ReadKidz is the better fit</h2>
              <ul className="space-y-3">
                {[
                  'You mainly want animated videos with voice dubbing and background music.',
                  'You want a physical hardcover printed and shipped to you.',
                  'You prefer a large page count per story and a free tier you can export from.',
                ].map((item) => (
                  <li key={item} className="text-sm text-[#8E8E93] flex items-start gap-2 leading-relaxed">
                    <span className="text-[#8E8E93] mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="apple-card p-8">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">When SproutTales is the better fit</h2>
              <ul className="space-y-3">
                {[
                  'You want unlimited books on a flat plan, with no credits and nothing that expires.',
                  'You need the same character to look consistent on every single page.',
                  'You want leveled reading (GRL A–E) with comprehension questions and progress tracking.',
                  'You want a print-ready interior and full cover you can upload straight to Amazon KDP.',
                ].map((item) => (
                  <li key={item} className="text-sm text-[#2D2D2D] flex items-start gap-2 leading-relaxed">
                    <span className="text-[#FF6B8A] mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">Frequently asked questions</h2>
        </div>
        <div className="space-y-4">
          {FAQS.map((item) => (
            <div key={item.q} className="apple-card p-6">
              <h3 className="font-semibold text-[#2D2D2D] mb-2">{item.q}</h3>
              <p className="text-sm text-[#8E8E93] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-4">
          Try SproutTales for yourself
        </h2>
        <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
          Start free, then create unlimited books on a flat plan — no credits, no expiry.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Create Your First Book
          </Link>
          <Link href="/pricing" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            Compare SproutTales Plans
          </Link>
        </div>
      </section>
    </div>
  )
}
