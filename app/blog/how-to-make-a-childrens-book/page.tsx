import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = "How to Make a Children's Book with AI — 8 Steps to a Printable Book"
const DESCRIPTION =
  "Learn how to make a children's book with AI in 8 steps: a consistent character on every page, GRL A–E leveled text, and print-ready Amazon KDP PDFs. Free plan — no credit card."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/how-to-make-a-childrens-book` },
  openGraph: {
    type: 'article',
    url: `${SITE_URL}/blog/how-to-make-a-childrens-book`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    publishedTime: '2026-03-01',
    modifiedTime: '2026-10-24',
    authors: ['SproutTales Team'],
    section: 'How-to Guide',
    tags: ['AI children book', 'KDP', 'picture book', 'how to'],
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'How to make a childrens book with AI',
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
    'how to make a childrens book',
    'make a childrens book with AI',
    'create a childrens book online',
    'how to make a picture book',
    'AI storybook tutorial',
    'printable book template',
    'Amazon KDP children book guide',
    'make a childrens book for free',
  ],
}

const STEPS = [
  {
    step: '1',
    title: 'Start with a simple idea',
    desc: 'Your child\'s name? A bedtime theme? A holiday adventure? Just type one sentence — SproutTales expands it into a full story outline. No writing skills needed.',
  },
  {
    step: '2',
    title: 'Pick a reading level',
    desc: 'Choose from GRL A through E (beginner to early chapter book). The AI matches vocabulary and sentence length to the level, so kids actually learn while they read.',
  },
  {
    step: '3',
    title: 'Build your character',
    desc: 'Describe your hero in a few words — or upload a photo. SproutTales stores a reference card so the same character appears consistently on every page.',
  },
  {
    step: '4',
    title: 'Generate the illustrations',
    desc: 'One click creates all pages at once. Each illustration follows your character reference card, so there are no jarring style shifts between pages.',
  },
  {
    step: '5',
    title: 'Review and edit',
    desc: 'Tap any page to rewrite the text or regenerate the artwork. Edit freely until the story feels right.',
  },
  {
    step: '6',
    title: 'Add comprehension questions',
    desc: 'SproutTales auto-generates age-appropriate questions at the back of the book — great for classroom use or parent-child discussion.',
  },
  {
    step: '7',
    title: 'Export print-ready PDFs',
    desc: 'Download two spec-compliant PDFs — a trimmed interior and a full-wrap cover with bleed, gutter, and spine width calculated for your page count.',
  },
  {
    step: '8',
    title: 'Publish or gift',
    desc: 'Upload directly to Amazon KDP, send to a local printer, or use as a personalized holiday gift. Your books never expire.',
  },
]

const FAQS = [
  {
    q: 'How do I make a children\'s book with AI for free?',
    a: 'SproutTales offers a Free plan that creates one 8-page book a month at no cost. You can export a watermarked preview PDF, and upgrade to Creator ($29/month) for watermark-free PDF export.',
  },
  {
    q: 'Can I make a personalized book for my child?',
    a: 'Yes. Put your child\'s name in the story prompt, upload a photo for the character reference, and the AI will feature them as the hero throughout the book.',
  },
  {
    q: 'What reading levels does SproutTales support?',
    a: 'We support GRL (Guided Reading Level) A through E — from beginner sight words (A) to early chapter books (E). The AI matches vocabulary difficulty and sentence length to your chosen level.',
  },
  {
    q: 'Can I publish the book on Amazon KDP?',
    a: 'Yes. Creator and Studio plans export two KDP-ready PDFs — an interior trim file and a full-wrap cover with correct bleed, gutter, and spine width. See our Amazon KDP guide for upload instructions.',
  },
  {
    q: 'Do the characters look the same on every page?',
    a: 'Yes. We store a reference character card and apply a consistency line to every illustration prompt, so your hero looks the same from page one to the last.',
  },
  {
    q: 'Is there a printable book template?',
    a: 'SproutTales exports print-ready PDFs — no template editing needed. Just download, upload to KDP or your preferred printer, and you\'re done.',
  },
]

const ArticleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: TITLE,
  description: DESCRIPTION,
  image: `${SITE_URL}/og-image.png`,
  datePublished: '2026-03-01',
  dateModified: '2026-10-24',
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

export default function HowToMakeChildrensBookPage() {
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
        <p className="text-sm text-[#8E8E93] font-medium uppercase tracking-widest mb-3">How-to Guide · Updated October 2026</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto leading-[1.1]">
          How to Make a{' '}
          <span className="bunny-text-gradient">Children&apos;s Book</span>{' '}
          with AI
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          A complete 8-step guide to going from a one-sentence idea to a professionally
          illustrated, print-ready children&apos;s book — no design experience required.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Try It Free →
          </Link>
          <Link href="/pricing" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            See Plans
          </Link>
        </div>
      </section>

      {/* Quick summary table — AI Overview bait */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="apple-card p-8">
          <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Quick Summary</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5EA]">
                <th className="w-1/3 text-left py-2 font-semibold text-[#2D2D2D]">What you need</th>
                <th className="text-left py-2 font-semibold text-[#2D2D2D]">Time required</th>
                <th className="text-left py-2 font-semibold text-[#2D2D2D]">Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#8E8E93]">One sentence idea</td>
                <td className="py-3 text-[#8E8E93]">1 minute to type</td>
                <td className="py-3 text-[#8E8E93]">Free to start</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#8E8E93]">Character description or photo</td>
                <td className="py-3 text-[#8E8E93]">2 minutes</td>
                <td className="py-3 text-[#8E8E93]">Included</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#8E8E93]">AI story generation + illustrations</td>
                <td className="py-3 text-[#8E8E93]">~8 minutes</td>
                <td className="py-3 text-[#8E8E93]">Included</td>
              </tr>
              <tr>
                <td className="py-3 text-[#8E8E93]">Print-ready PDF export (KDP)</td>
                <td className="py-3 text-[#8E8E93]">1 click download</td>
                <td className="py-3 text-[#8E8E93]">Creator $29/mo+</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 8 Steps */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
          8 steps to your first AI children&apos;s book
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

      {/* When to upgrade CTA */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-4">
            Ready to make your first book?
          </h2>
          <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
            Start free with one book a month. Upgrade anytime for KDP export, more styles, and Pro Animation Packs that never expire.
          </p>
          <Link href="/create" className="apple-button text-base px-8 py-3.5 inline-block">
            Create Your First Book →
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
