import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = "Personalized Bedtime Stories for Kids: Why Your Child's Name in the Story Works"
const DESCRIPTION =
  "Personalized bedtime stories with your child's name as the hero hold attention 3x longer. Learn why it works and how to create one free with AI — same character on every page."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/personalized-bedtime-stories-for-kids` },
  openGraph: {
    type: 'article',
    url: `${SITE_URL}/blog/personalized-bedtime-stories-for-kids`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    publishedTime: '2026-11-04',
    modifiedTime: '2026-11-04',
    authors: ['SproutTales Team'],
    section: 'Parenting Guide',
    tags: ['bedtime stories', 'personalized books', 'kids reading', 'parenting'],
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Personalized bedtime stories for kids',
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
    'personalized bedtime stories',
    'bedtime stories for kids',
    'personalized stories for toddlers',
    'custom bedtime story with child name',
    'bedtime story with my child as hero',
    'personalized picture books',
    'AI bedtime story generator',
  ],
}

const FAQS = [
  {
    q: 'What is a personalized bedtime story?',
    a: "A bedtime story where your child is the hero — their name, appearance, and even their stuffed animal appear in the story and illustrations. SproutTales generates one from a single sentence, with the same character on every page.",
  },
  {
    q: 'Do personalized stories really hold kids\u2019 attention better?',
    a: 'Yes. When children hear their own name and see a character that looks like them, self-recognition keeps them engaged far longer than a generic story. Parents consistently report fewer mid-story wander-offs.',
  },
  {
    q: 'How long does it take to create one?',
    a: 'About 8 minutes with SproutTales: type one sentence, pick a reading level (GRL A\u2013E), describe your hero, and generate. The Free plan includes one book a month.',
  },
  {
    q: 'Can I print a personalized bedtime story?',
    a: 'Yes. Creator and Studio plans export print-ready PDFs — a trimmed interior plus a full-wrap cover — ready for Amazon KDP or any print shop.',
  },
  {
    q: 'What age are personalized bedtime stories best for?',
    a: 'Ages 2\u20138 get the most magic from them, but the GRL A\u2013E reading levels let you match the text to your child\u2019s exact reading stage, from first sight words to early chapter books.',
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

const REASONS = [
  {
    n: '1',
    title: 'Self-recognition is an attention magnet',
    desc: 'Hearing their own name triggers a brain response nothing else matches. A story that opens with "Lily the brave explorer" lands completely differently from "a little girl." Kids lean in — and stay in.',
  },
  {
    n: '2',
    title: 'The hero looks like them',
    desc: 'When the illustrations show a character with your child\u2019s hair, skin tone, or favorite red boots on every page, the book stops being a story about someone else. SproutTales locks the character reference so the same hero appears consistently — no jarring face-swaps mid-book.',
  },
  {
    n: '3',
    title: 'You control the lesson',
    desc: 'Need a story about sharing? About the first day of school? About being brave at the dentist? Type the theme in one sentence and the story teaches exactly what your family needs this week.',
  },
  {
    n: '4',
    title: 'Reading level matches your child',
    desc: 'A story that\u2019s too hard frustrates; too easy bores. GRL A\u2013E leveling matches vocabulary and sentence length to your child\u2019s stage, so bedtime reading quietly builds real reading skill.',
  },
  {
    n: '5',
    title: 'It becomes a ritual, not a chore',
    desc: '"What adventure is Lily having tonight?" beats "time for your reading practice." Kids ask for the next chapter themselves — the single biggest win for busy parents.',
  },
]

export default function PersonalizedBedtimeStoriesPage() {
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
        <p className="text-sm text-[#8E8E93] font-medium uppercase tracking-widest mb-3">Parenting Guide</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto">
          Personalized Bedtime Stories for Kids:{' '}
          <span className="bunny-text-gradient">Why Your Child&apos;s Name Works</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          The same 10-minute bedtime story — but your child is the hero. Here&apos;s why
          personalization holds attention like nothing else, and how to make one tonight.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Create One Free →
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
                <th className="w-1/3 text-left py-2 font-semibold text-[#2D2D2D]">What</th>
                <th className="text-left py-2 font-semibold text-[#2D2D2D]">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">Personalized bedtime story</td>
                <td className="py-3 text-[#8E8E93]">Your child as the hero — name, likeness, even their toys in the tale</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">Time to create</td>
                <td className="py-3 text-[#8E8E93]">~8 minutes with AI; one sentence is enough to start</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">Best ages</td>
                <td className="py-3 text-[#8E8E93]">2–8, with GRL A–E text matched to reading level</td>
              </tr>
              <tr>
                <td className="py-3 text-[#2D2D2D] font-medium">Cost</td>
                <td className="py-3 text-[#8E8E93]">Free plan: 1 book a month, no credit card</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5 Reasons */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
          5 reasons personalized stories win bedtime
        </h2>
        <div className="space-y-6">
          {REASONS.map((item) => (
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

      {/* How to make one */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
          Make one tonight in 4 steps
        </h2>
        <div className="apple-card p-8 space-y-5 text-[#8E8E93] leading-relaxed">
          <p><strong className="text-[#2D2D2D]">1. One sentence.</strong> &ldquo;Mia befriends a moon dragon who is afraid of the dark.&rdquo; That&apos;s the whole brief.</p>
          <p><strong className="text-[#2D2D2D]">2. Pick the reading level.</strong> GRL A for first words, E for early chapter-book readers. The AI matches every sentence to it.</p>
          <p><strong className="text-[#2D2D2D]">3. Describe your hero.</strong> A few words — or upload a photo — and the same character appears on all 8 pages, locked in.</p>
          <p><strong className="text-[#2D2D2D]">4. Generate and read.</strong> Story plus illustrations in about 8 minutes. Read it tonight; print it this weekend.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-4">
            What adventure is your child having tonight?
          </h2>
          <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
            Start free with one book a month. No credit card, no writing skills needed.
          </p>
          <Link href="/create" className="apple-button text-base px-8 py-3.5 inline-block">
            Create a Bedtime Story →
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
