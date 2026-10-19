import type { Metadata } from 'next'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'AI Picture Book Generator — Create Illustrated Children’s Books with Consistent Characters'
const DESCRIPTION =
  'SproutTales is an AI picture book generator that turns an idea into a fully illustrated children’s storybook — consistent characters, leveled text, and a print-ready PDF. No credits, unlimited books.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/ai-picture-book-generator` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/ai-picture-book-generator`,
    siteName: SITE_NAME,
    type: 'website',
  },
}

const STEPS = [
  { step: '1', title: 'Start with an idea', desc: 'Describe a story idea, a theme, or a lesson — or let SproutTales suggest one. No outline needed.' },
  { step: '2', title: 'Write the story', desc: 'AI drafts the story, then matches vocabulary and sentence length to a reading level from GRL A to E.' },
  { step: '3', title: 'Lock the characters', desc: 'Build a hero from a description — or upload a photo. SproutTales stores a reference character card so the same hero appears on every page.' },
  { step: '4', title: 'Illustrate every page', desc: 'Each page is illustrated with a reusable consistency line that keeps the character on-model from the first page to the last.' },
  { step: '5', title: 'Export a print-ready PDF', desc: 'Download KDP-ready files — a spec-compliant interior and a full cover with bleed, gutter, and spine width handled for you.' },
]

const WHAT_YOU_GET = [
  'A complete, illustrated children’s picture book from a single idea.',
  'The same recognizable character on every page, enforced by a stored reference card.',
  'Reading-level-matched text (GRL A–E) with vocabulary suited to the level.',
  'Comprehension questions and a reading-progress view for each book.',
  'Two print-ready PDFs for Amazon KDP — interior and full cover — with correct page count and bleed.',
  'Output in multiple languages.',
]

const DIFFERENTIATORS = [
  {
    icon: '∞',
    title: 'No credits, no expiry',
    desc: 'A flat subscription — never a credit meter. Create unlimited books and your creations never expire.',
  },
  {
    icon: '★',
    title: 'Character consistency, on every page',
    desc: 'A reusable consistency line plus a stored reference character card keep your hero on-model from cover to cover.',
  },
  {
    icon: '🔒',
    title: 'Two ways to handle privacy',
    desc: 'Option A builds the character with no real photo at all. Option B uses a real photo with a privacy scope you choose.',
  },
  {
    icon: '📖',
    title: 'Reading levels that teach',
    desc: 'GRL A–E leveled text with matched vocabulary, comprehension questions, and a reading-progress view.',
  },
  {
    icon: '📐',
    title: 'Print-ready for Amazon KDP',
    desc: 'Two separate spec-compliant PDFs — interior and full cover — with bleed, gutter, spine width, and a padded page count.',
  },
]

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is an AI picture book generator?',
    a: 'An AI picture book generator turns a written idea into a finished children’s picture book — it writes the story, creates the characters, and illustrates each page. SproutTales then exports the result as a print-ready PDF you can publish or print.',
  },
  {
    q: 'How do I create a picture book with SproutTales?',
    a: 'Enter an idea, pick a reading level from GRL A to E, build your character, and SproutTales writes and illustrates every page. When the story is finished you download a KDP-ready interior PDF and a full-cover PDF.',
  },
  {
    q: 'Do the characters stay consistent across every page?',
    a: 'Yes. SproutTales stores a reference character card and applies a reusable consistency line on every page, so the same hero appears throughout the book instead of changing from page to page.',
  },
  {
    q: 'Can I create a book without uploading a real photo of my child?',
    a: 'Yes. Option A builds the character from a text description with no real photo at all, so no personal image is ever used. Option B lets you upload a real photo with a privacy scope you select.',
  },
  {
    q: 'Can I publish a SproutTales book on Amazon KDP?',
    a: 'SproutTales exports two print-ready PDFs for Amazon KDP — a separate interior and a full cover (back, spine, and front) — with the correct bleed, gutter, spine width, and an even, padded page count of at least 24.',
  },
  {
    q: 'Is there a credit system, and do my books expire?',
    a: 'No credits and no expiry. SproutTales uses a flat subscription with unlimited books, and the books you create stay in your library without expiring.',
  },
]

export default function AiPictureBookGeneratorPage() {
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
          AI <span className="bunny-text-gradient">Picture Book</span> Generator
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          Turn an idea into a fully illustrated children’s storybook. SproutTales writes the story,
          keeps the characters consistent on every page, and exports a print-ready PDF — with no
          credits and no expiry.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Create Your Picture Book →
          </Link>
          <Link href="/pricing" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            See Pricing
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">How it works</h2>
          <p className="text-[#8E8E93] mt-2">From idea to print-ready book in five steps.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((item) => (
            <div key={item.step} className="apple-card p-8">
              <div className="w-10 h-10 rounded-full bunny-gradient text-white font-bold flex items-center justify-center mb-4 text-lg">
                {item.step}
              </div>
              <h3 className="font-semibold text-lg text-[#2D2D2D] mb-2">{item.title}</h3>
              <p className="text-sm text-[#8E8E93] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">What you get</h2>
          </div>
          <div className="apple-card p-8">
            <ul className="space-y-4">
              {WHAT_YOU_GET.map((item) => (
                <li key={item} className="text-[#2D2D2D] flex items-start gap-3">
                  <span className="text-[#FF6B8A] font-semibold mt-0.5">✓</span>
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Why SproutTales is different */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">Why SproutTales is different</h2>
          <p className="text-[#8E8E93] mt-2">The things that make an AI storybook generator actually usable.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {DIFFERENTIATORS.map((item) => (
            <div key={item.title} className="apple-card p-8">
              <div className="text-2xl mb-4">{item.icon}</div>
              <h3 className="font-semibold text-lg text-[#2D2D2D] mb-2">{item.title}</h3>
              <p className="text-sm text-[#8E8E93] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-4">
          Make your first picture book today
        </h2>
        <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
          Start free, then create unlimited books on a flat plan — your creations never expire.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Start Creating Free
          </Link>
          <Link href="/pricing" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            View Plans
          </Link>
        </div>
      </section>
    </div>
  )
}
