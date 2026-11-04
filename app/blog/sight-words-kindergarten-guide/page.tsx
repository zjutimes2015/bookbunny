import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'Sight Words for Kindergarten: A Parent\u2019s Starter Guide (With First 25 Words)'
const DESCRIPTION =
  'What are sight words and which should your kindergartener learn first? A parent-friendly guide with the first 25 words, practice tips, and books that reinforce them.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/sight-words-kindergarten-guide` },
  openGraph: {
    type: 'article',
    url: `${SITE_URL}/blog/sight-words-kindergarten-guide`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    publishedTime: '2026-11-04',
    modifiedTime: '2026-11-04',
    authors: ['SproutTales Team'],
    section: 'Early Literacy',
    tags: ['sight words', 'kindergarten', 'early reading', 'phonics'],
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sight words for kindergarten guide',
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
    'sight words for kindergarten',
    'kindergarten sight word list',
    'first sight words to teach',
    'how to teach sight words',
    'sight words vs phonics',
    'dolch sight words kindergarten',
  ],
}

const FAQS = [
  {
    q: 'What are sight words?',
    a: 'Sight words are common words kids learn to recognize instantly, without sounding out — like \u201cthe,\u201d \u201cand,\u201d and \u201cyou.\u201d Many can\u2019t be sounded out with basic phonics, so memorization plus repeated exposure in real books is how they stick.',
  },
  {
    q: 'How many sight words should a kindergartener know?',
    a: 'Most kindergarten programs target 25\u201350 by year\u2019s end, starting with the highest-frequency words: the, and, a, to, said, in, he, I, of, it. Quality of exposure beats sheer quantity.',
  },
  {
    q: 'Sight words or phonics — which first?',
    a: 'Both, together. Phonics teaches kids to decode; sight words cover the irregular high-frequency words phonics can\u2019t handle yet. They\u2019re teammates, not rivals.',
  },
  {
    q: 'How can I practice sight words without flashcards?',
    a: 'Read books where the words appear naturally. A personalized book at GRL level A is built mostly from sight words and simple decodables — practice disguised as story time.',
  },
]

const ArticleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: TITLE,
  description: DESCRIPTION,
  image: `${SITE_URL}/og-image.png`,
  datePublished: '2026-11-04',
  dateModified: '2026-11-04',
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

const FIRST_WORDS = ['the', 'and', 'a', 'to', 'said', 'in', 'he', 'I', 'of', 'it', 'is', 'you', 'that', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'at', 'be', 'this', 'have']

const TIPS = [
  {
    n: '1',
    title: 'Teach 2\u20133 at a time, not 25',
    desc: 'Introduce a tiny batch, use them in real reading for a week, then add more. A wall of 50 flashcards teaches nothing; three words met in a story stick.',
  },
  {
    n: '2',
    title: 'Meet them in books, not just drills',
    desc: 'A word learned on a flashcard is fragile. The same word met ten times inside a story your child loves becomes permanent. GRL level A books are engineered for exactly this.',
  },
  {
    n: '3',
    title: 'Make it multisensory',
    desc: 'Write the word in shaving cream, build it with magnetic letters, chant its spelling while clapping. Young brains remember what the body does.',
  },
  {
    n: '4',
    title: 'Play "word detective"',
    desc: 'Before reading, pick one sight word and have your child hunt for it on every page. Searching turns passive exposure into active retrieval — the thing that actually builds memory.',
  },
  {
    n: '5',
    title: 'Celebrate automaticity',
    desc: 'The goal isn\u2019t "knows the word" — it\u2019s "reads it without thinking." When your child breezes past "the" mid-sentence without pausing, that\u2019s the win. Notice it out loud.',
  },
]

export default function SightWordsGuidePage() {
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
        <p className="text-sm text-[#8E8E93] font-medium uppercase tracking-widest mb-3">Early Literacy</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto">
          Sight Words for Kindergarten:{' '}
          <span className="bunny-text-gradient">A Parent\u2019s Starter Guide</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          Which words first, how many, and how to teach them without tears —
          plus the first 25 words to start with tonight.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Make a Level-A Book Free →
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
                <th className="w-1/3 text-left py-2 font-semibold text-[#2D2D2D]">Question</th>
                <th className="text-left py-2 font-semibold text-[#2D2D2D]">Answer</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">What are sight words?</td>
                <td className="py-3 text-[#8E8E93]">High-frequency words recognized instantly (the, and, you)</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">How many for kindergarten?</td>
                <td className="py-3 text-[#8E8E93]">25\u201350 by year\u2019s end; start with the top 25 below</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">Batch size</td>
                <td className="py-3 text-[#8E8E93]">2\u20133 new words at a time, met inside real books</td>
              </tr>
              <tr>
                <td className="py-3 text-[#2D2D2D] font-medium">Best practice</td>
                <td className="py-3 text-[#8E8E93]">GRL level A personalized books — sight words in story context</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* First 25 words */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-6">
          The first 25 sight words to teach
        </h2>
        <p className="text-center text-[#8E8E93] mb-8 max-w-xl mx-auto">
          Ordered roughly by frequency. Master these and your child can read a large
          share of any kindergarten text.
        </p>
        <div className="apple-card p-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {FIRST_WORDS.map((w) => (
              <span key={w} className="px-4 py-2 rounded-full bg-[#FAF0E6] text-[#2D2D2D] font-medium text-sm">
                {w}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 5 Tips */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
          5 ways to teach them so they stick
        </h2>
        <div className="space-y-6">
          {TIPS.map((item) => (
            <div key={item.n} className="apple-card p-6 flex gap-5 items-start">
              <div className="w-10 h-10 rounded-full bunny-gradient text-white font-bold flex-shrink-0 flex items-center justify-center">
                {item.n}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[#2D2D2D] mb-1">{item.title}</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-4">
            Put the words inside their story
          </h2>
          <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
            A personalized GRL level A book weaves sight words into an adventure starring
            your child. Free plan — one book a month.
          </p>
          <Link href="/create" className="apple-button text-base px-8 py-3.5 inline-block">
            Create a Level-A Book →
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
