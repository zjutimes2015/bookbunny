import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'How to Publish a Children\u2019s Book on Amazon KDP: 2026 Checklist'
const DESCRIPTION =
  'Publish your children\u2019s picture book on Amazon KDP in 7 steps: manuscript and cover specs, ISBN options, pricing and royalty choices, and the mistakes that get books rejected.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/publish-childrens-book-amazon-kdp` },
  openGraph: {
    type: 'article',
    url: `${SITE_URL}/blog/publish-childrens-book-amazon-kdp`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    publishedTime: '2026-11-03',
    modifiedTime: '2026-11-03',
    authors: ['SproutTales Team'],
    section: 'Publishing Guide',
    tags: ['Amazon KDP', 'self-publish', 'childrens book publishing', 'picture book', 'KDP cover'],
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'How to publish a childrens book on Amazon KDP',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/twitter-image.png'],
  },
  keywords: [
    'publish childrens book amazon',
    'amazon kdp childrens book',
    'self publish picture book',
    'KDP cover requirements childrens book',
    'KDP paperback trim size picture book',
    'publish book on amazon kdp 2026',
    'childrens book ISBN KDP',
  ],
}

const STEPS = [
  {
    step: '1',
    title: 'Finish a print-ready manuscript',
    desc: 'Your interior must be a print-quality PDF with embedded fonts and at least 24 pages for KDP paperback. Illustrations should be 300 DPI. SproutTales exports a trimmed, spec-compliant interior PDF automatically — no InDesign required.',
  },
  {
    step: '2',
    title: 'Build the full-wrap cover',
    desc: 'KDP needs one PDF containing back cover + spine + front cover, sized with bleed for your exact page count and trim size. Spine width depends on page count, so generate the cover last. SproutTales calculates bleed, gutter, and spine width for you.',
  },
  {
    step: '3',
    title: 'Pick a trim size',
    desc: 'The classic picture-book trim is 8.5\u2033 × 8.5\u2033. Whatever you choose, interior and cover must use the same size, and the page count must be even. Decide before generating final files.',
  },
  {
    step: '4',
    title: 'Decide on an ISBN',
    desc: 'KDP offers a free ISBN, or you can bring your own from Bowker (US). A free KDP ISBN lists \u201cIndependently published\u201d as the imprint; your own ISBN lets you use your own publisher name. Either works for selling on Amazon.',
  },
  {
    step: '5',
    title: 'Upload to KDP and preview',
    desc: 'Create a KDP paperback project, upload your interior and cover PDFs, then use KDP\u2019s online previewer to check every page. Fix bleed warnings and gutter issues before approving — most rejections come from cover sizing.',
  },
  {
    step: '6',
    title: 'Set pricing and royalty',
    desc: 'KDP paperback royalties are 60% of list price minus printing costs (color picture books cost more to print — check KDP\u2019s printing cost table first). Price so the math works: a $14.99 color picture book typically nets a few dollars per sale.',
  },
  {
    step: '7',
    title: 'Write metadata that sells',
    desc: 'Choose 3 KDP categories and 7 keywords carefully — they decide who finds your book. Write a description for parents, not algorithms: age range, what the child learns, and what makes your book different.',
  },
]

const FAQS = [
  {
    q: 'How much does it cost to publish a children\u2019s book on Amazon KDP?',
    a: 'Publishing itself is free — KDP charges no setup fees. Your costs are production (illustrations, formatting) and optional items like your own ISBN ($125 from Bowker in the US) or proof copies. Printing costs are deducted from royalties per sale, not paid upfront.',
  },
  {
    q: 'What files does KDP need for a picture book?',
    a: 'Two PDFs: a print-ready interior (embedded fonts, 300 DPI images, even page count of at least 24 pages) and a full-wrap cover PDF (back + spine + front) sized with bleed for your trim size and page count. SproutTales Creator and Studio plans export both.',
  },
  {
    q: 'Can I publish an AI-generated children\u2019s book on KDP?',
    a: 'Yes, but you must disclose AI-generated content when KDP asks during setup, and you are responsible for the content\u2019s originality. Always review every page and illustration before publishing.',
  },
  {
    q: 'What trim size is best for a children\u2019s picture book on KDP?',
    a: '8.5\u2033 × 8.5\u2033 is the most popular square format for picture books. KDP supports several sizes; pick one before finalizing files, because interior and cover must match exactly.',
  },
  {
    q: 'Do I need my own ISBN for KDP?',
    a: 'No. KDP provides a free ISBN for paperbacks. Bring your own only if you want your own imprint name instead of \u201cIndependently published,\u201d or plan to distribute beyond Amazon.',
  },
  {
    q: 'How long does KDP review take?',
    a: 'Usually 24–72 hours for paperbacks. Books get rejected most often for cover sizing errors, missing bleed, or low-resolution images — run KDP\u2019s previewer carefully before submitting.',
  },
]

const ArticleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: TITLE,
  description: DESCRIPTION,
  image: `${SITE_URL}/og-image.png`,
  datePublished: '2026-11-03',
  dateModified: '2026-11-03',
  author: { '@type': 'Organization', name: SITE_NAME },
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
  },
}

const FAQSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

export default function PublishKdpPage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ArticleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQSchema) }}
      />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 md:pt-16 text-center">
        <p className="text-sm text-[#8E8E93] font-medium uppercase tracking-widest mb-3">Publishing Guide · Updated November 2026</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto leading-[1.1]">
          Publish a Children\u2019s Book on <span className="bunny-text-gradient">Amazon KDP</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          The 7-step 2026 checklist: manuscript and cover specs, ISBN options,
          pricing math, and the mistakes that get picture books rejected.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Make Your Book →
          </Link>
          <Link href="/pricing" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            See Plans
          </Link>
        </div>
      </section>

      {/* Quick summary table — AI Overview bait */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="apple-card p-8">
          <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">KDP picture-book requirements</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5EA]">
                <th className="text-left py-2 font-semibold text-[#2D2D2D]">Item</th>
                <th className="text-left py-2 font-semibold text-[#2D2D2D]">Requirement</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 font-semibold text-[#2D2D2D]">Interior file</td>
                <td className="py-3 text-[#8E8E93]">PDF, embedded fonts, 300 DPI images</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 font-semibold text-[#2D2D2D]">Page count</td>
                <td className="py-3 text-[#8E8E93]">Even number, minimum 24 pages</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 font-semibold text-[#2D2D2D]">Cover file</td>
                <td className="py-3 text-[#8E8E93]">Single PDF: back + spine + front, with bleed</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 font-semibold text-[#2D2D2D]">Popular trim size</td>
                <td className="py-3 text-[#8E8E93]">8.5\u2033 × 8.5\u2033 (square picture book)</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-[#2D2D2D]">Royalty</td>
                <td className="py-3 text-[#8E8E93]">60% of list price minus printing cost</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7 Steps */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
          7 steps to publish on KDP
        </h2>
        <div className="space-y-6">
          {STEPS.map((item) => (
            <div key={item.step} className="apple-card p-6 flex gap-5 items-start">
              <div className="w-10 h-10 rounded-full bunny-gradient text-white font-bold flex-shrink-0 flex items-center justify-center text-lg">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[#2D2D2D] mb-1">{item.title}</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SproutTales tie-in CTA */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-4">
            Skip steps 1–2 entirely
          </h2>
          <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
            SproutTales Creator ($29/mo) exports both KDP-ready PDFs — trimmed interior
            and full-wrap cover with bleed, gutter, and spine width calculated for your page count.
          </p>
          <Link href="/create" className="apple-button text-base px-8 py-3.5 inline-block">
            Create Your Book →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((item) => (
            <div key={item.q} className="apple-card p-6">
              <h3 className="font-semibold text-[#2D2D2D] mb-2">{item.q}</h3>
              <p className="text-sm text-[#8E8E93] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
