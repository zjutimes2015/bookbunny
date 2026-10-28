import type { Metadata } from 'next'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'English Reading for Beginners — GRL-Levelled ELL Storybooks for Kids'
const DESCRIPTION =
  'Make graded English readers for a child whose home language is not English. SproutTales writes English-only stories pitched to GRL A–E, shows every concrete noun in the illustration, and exports vocabulary lists and classroom worksheets.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/english-reading-for-beginners` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/english-reading-for-beginners`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SproutTales — English reading for beginners',
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
    'English reading for beginners',
    'ELL reading materials',
    'English language learner books',
    'graded English readers for kids',
    'GRL leveled English for ESL students',
    'English readers for Spanish speaking children',
    'bilingual family English stories',
    'ESL classroom reading books',
    'leveled English storybook generator',
  ],
}

const DIFFERENCE = [
  {
    title: 'Translation keeps the difficulty',
    body: 'Translating a story into Spanish changes the language, not the level. A child who cannot read that sentence in English still cannot read it in Spanish — they simply cannot read it at all.',
  },
  {
    title: 'ELL keeps the language and lowers the level',
    body: 'The story stays in English, so it is practice. Vocabulary and sentence length are matched to a GRL level, so the child can actually finish a book and feel like a reader.',
  },
]

const FEATURES = [
  {
    title: 'English only, by design',
    body: 'The home language is used solely to keep it out of the text. Nothing is translated, nothing is glossed in parentheses — the child reads real English.',
  },
  {
    title: 'High-frequency teaching vocabulary',
    body: 'The text reuses the same core words across pages, so your learner meets them again and again instead of learning a new word on every page.',
  },
  {
    title: 'Every noun is on the page',
    body: 'Each concrete noun in the text is also drawn in the illustration, so the picture carries the meaning the sentence does not.',
  },
  {
    title: 'No idioms, no phrasal verbs',
    body: 'Sentences are short, in a consistent order, and free of figurative language that a beginner cannot decode from context.',
  },
  {
    title: 'A pre-teach list per book',
    body: 'Export the words that are above the level and repeat through the book. Teach those first, then hand over the story.',
  },
  {
    title: 'Classroom-ready sheets',
    body: 'Every book exports a fill-in-the-blank worksheet with a teacher answer key, plus a scored GRL report you can show a parent.',
  },
]

const STEPS = [
  { step: '1', title: 'Pick a reading level', desc: 'Choose GRL A–E. Each level has its own core vocabulary list and sentence-length cap.' },
  { step: '2', title: 'Turn on English learner mode', desc: 'The story stays in English. If you tell us the home language, we keep it out of the book entirely.' },
  { step: '3', title: 'Write and illustrate', desc: 'The outline is written at the level you picked, then every page is illustrated with the same character on-model.' },
  { step: '4', title: 'Export the teaching pack', desc: 'Vocabulary list with a pre-teach list, a classroom worksheet with an answer key, and a GRL score report.' },
]

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is an ELL reader?',
    a: 'An ELL reader is a book written in English for a child who is learning English as an additional language. The text is pitched to a reading level rather than to an age, so the child can decode it, finish it, and build confidence.',
  },
  {
    q: 'How is this different from translating my child’s book?',
    a: 'Translation changes the language while leaving the sentence length and vocabulary difficulty untouched. ELL mode keeps the book in English and lowers the difficulty to a specific GRL level, so the child is reading English the whole time.',
  },
  {
    q: 'Does the book contain any of my child’s home language?',
    a: 'No. In English learner mode the text is English only. The home language you select is used solely to keep that language out of the story — no glosses, no translations in parentheses.',
  },
  {
    q: 'Which GRL level should I start with?',
    a: 'Level A for a child who knows only a handful of words, B for early readers, C for a typical first-grade learner, and D or E once sentences of 8–13 words are comfortable. If a book comes back with too many above-level words, drop one level and regenerate.',
  },
  {
    q: 'Can I use these in a classroom?',
    a: 'Yes. The Teacher plan exports a per-book vocabulary list, a classroom worksheet with a teacher answer key, a GRL score report, and shareable student progress reports.',
  },
  {
    q: 'Will my child understand the pictures without help?',
    a: 'That is the point of the illustration rule: every concrete noun in the text is drawn on the same page, so the picture explains what the sentence cannot.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. The Free plan creates one 8-page book a month with a watermarked preview PDF. Watermark-free export and classroom materials start on Creator at $29/month; the Teacher plan is $99/month for 40 books.',
  },
]

export default function EnglishReadingForBeginnersPage() {
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
          English Reading for <span className="bunny-text-gradient">Beginners</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          Graded English storybooks for children whose home language isn&apos;t English — written in
          English, pitched to a reading level, and delivered with the vocabulary list and classroom
          sheet a teacher actually needs.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Make an ELL Storybook →
          </Link>
          <Link href="/pricing" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            See Plans
          </Link>
        </div>
      </section>

      {/* Translation vs ELL */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
              Most tools translate. Translation is not teaching.
            </h2>
            <p className="text-[#8E8E93] mt-2 max-w-2xl mx-auto">
              A story in the child&apos;s home language is a comfort read. It is not English practice.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {DIFFERENCE.map((item, i) => (
              <div key={item.title} className="apple-card p-8">
                <h3 className="font-semibold text-lg text-[#2D2D2D] mb-2">{item.title}</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">{item.body}</p>
                {i === 1 && (
                  <p className="mt-4 text-sm font-medium text-[#FF6B8A]">
                    SproutTales does the second one.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">How it works</h2>
          <p className="text-[#8E8E93] mt-2">Four steps from idea to a teaching pack.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((item) => (
            <div key={item.step} className="apple-card p-6">
              <div className="w-10 h-10 rounded-full bunny-gradient text-white font-bold flex items-center justify-center mb-4 text-lg">
                {item.step}
              </div>
              <h3 className="font-semibold text-[#2D2D2D] mb-2">{item.title}</h3>
              <p className="text-sm text-[#8E8E93] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What makes it ELL */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
              What makes it work for a beginner
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((item) => (
              <div key={item.title} className="apple-card p-8">
                <h3 className="font-semibold text-[#2D2D2D] mb-2">{item.title}</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">{item.body}</p>
              </div>
            ))}
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
          Write the first graded reader tonight
        </h2>
        <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
          One idea in, a leveled English storybook plus its teaching pack out.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Start Creating Free
          </Link>
          <Link href="/vs/readkidz" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            How We Compare
          </Link>
        </div>
      </section>
    </div>
  )
}
