import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'How to Choose Picture Books by Age: A Simple Guide for Ages 0\u20138'
const DESCRIPTION =
  'What makes a good picture book for a 2-year-old vs a 6-year-old? Age-by-age guide to choosing picture books — length, vocabulary, themes — plus how to match reading level.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/how-to-choose-picture-books-by-age` },
  openGraph: {
    type: 'article',
    url: `${SITE_URL}/blog/how-to-choose-picture-books-by-age`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    publishedTime: '2026-11-04',
    modifiedTime: '2026-11-04',
    authors: ['SproutTales Team'],
    section: 'Parenting Guide',
    tags: ['picture books', 'books by age', 'early literacy', 'parenting'],
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'How to choose picture books by age',
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
    'how to choose picture books',
    'best picture books by age',
    'books for 2 year old',
    'books for 4 year old',
    'picture books for 6 year old',
    'age appropriate books for kids',
    'choosing books for toddlers',
  ],
}

const FAQS = [
  {
    q: 'How do I know if a book is right for my child\u2019s age?',
    a: 'Check three things: length (can they sit through it?), vocabulary (a few new words is good; every sentence a struggle is not), and theme (does it connect to their world?). When in doubt, go one step easier — a finished book beats an abandoned one.',
  },
  {
    q: 'Should I follow age labels or reading level?',
    a: 'Both, but reading level matters more once kids start decoding. Two 5-year-olds can be a full level apart. GRL A\u2013E leveling tells you what the text demands; age tells you what themes land.',
  },
  {
    q: 'Are personalized books appropriate for every age?',
    a: 'They work best at ages 2\u20138, and the reading level control is the key: the same personalization engine produces simple read-aloud text for toddlers and early-chapter text for 7-year-olds.',
  },
  {
    q: 'How many books should I read before repeating?',
    a: 'Repeat freely — re-reading builds fluency and confidence. A small rotation of 5\u201310 loved books, with one new one added regularly, is the sweet spot for most families.',
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

const AGES = [
  {
    age: '0\u20132',
    title: 'Babies & toddlers',
    points: ['Board books that survive chewing', 'One clear picture per page, few or no words', 'Rhythm and repetition beat plot — rhymes and refrains', 'Let them turn pages and point; "reading" is sensory at this age'],
  },
  {
    age: '3\u20134',
    title: 'Preschoolers',
    points: ['Simple stories with a clear beginning, middle, end', 'Characters with big feelings they recognize', 'Predictable patterns they can chant along with', 'Themes from their world: bedtime, sharing, new siblings'],
  },
  {
    age: '5\u20136',
    title: 'Early readers',
    points: ['Match text to decoding level (GRL A\u2013C) — not age', 'Short sentences, familiar sight words, picture support on every page', 'Gentle humor and mild adventure keep them turning pages', 'Let them read to you sometimes — fluency needs practice'],
  },
  {
    age: '7\u20138',
    title: 'Growing independents',
    points: ['Longer narratives with chapters or clear episodes (GRL D\u2013E)', 'Characters facing real dilemmas: friendship, fairness, courage', 'Series and recurring characters build reading identity', 'Nonfiction curiosity kicks in — feed it'],
  },
]

export default function ChoosePictureBooksByAgePage() {
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
          How to Choose Picture Books{' '}
          <span className="bunny-text-gradient">by Age (0\u20138)</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          The right book at the wrong age is the wrong book. Here&apos;s what to look for
          at every stage — length, language, and themes that actually land.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Make an Age-Matched Book Free →
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
                <th className="w-1/4 text-left py-2 font-semibold text-[#2D2D2D]">Age</th>
                <th className="text-left py-2 font-semibold text-[#2D2D2D]">Look for</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">0\u20132</td>
                <td className="py-3 text-[#8E8E93]">Board books, one picture per page, rhymes over plot</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">3\u20134</td>
                <td className="py-3 text-[#8E8E93]">Simple arcs, big feelings, predictable refrains</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">5\u20136</td>
                <td className="py-3 text-[#8E8E93]">Text matched to decoding level (GRL A\u2013C), sight-word heavy</td>
              </tr>
              <tr>
                <td className="py-3 text-[#2D2D2D] font-medium">7\u20138</td>
                <td className="py-3 text-[#8E8E93]">Longer narratives, real dilemmas, series characters (GRL D\u2013E)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Age bands */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
          Age-by-age guide
        </h2>
        <div className="space-y-6">
          {AGES.map((band) => (
            <div key={band.age} className="apple-card p-6 sm:p-8">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-sm font-bold text-white bunny-gradient rounded-full px-3 py-1">{band.age}</span>
                <h3 className="font-semibold text-xl text-[#2D2D2D]">{band.title}</h3>
              </div>
              <ul className="space-y-2">
                {band.points.map((pt) => (
                  <li key={pt} className="text-sm text-[#8E8E93] leading-relaxed flex gap-2">
                    <span className="text-[#2D2D2D]">•</span>{pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Golden rule */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-6">
          The golden rule: match the child, not the label
        </h2>
        <div className="apple-card p-8 space-y-5 text-[#8E8E93] leading-relaxed">
          <p><strong className="text-[#2D2D2D]">Age is a proxy; reading level is the truth.</strong> Two 5-year-olds can sit a full GRL level apart. When a book says "ages 4\u20138," check the actual text demand — or better, choose books leveled to your child.</p>
          <p><strong className="text-[#2D2D2D]">When in doubt, go easier.</strong> A book finished with joy beats a book abandoned in frustration. Confidence compounds; struggle doesn&apos;t.</p>
          <p><strong className="text-[#2D2D2D]">Personalization erases the guessing.</strong> Instead of hunting for the rare book that matches your child\u2019s age, level, and interests — generate one that matches all three, with them as the hero.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-4">
            A book matched to your child&apos;s exact stage
          </h2>
          <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
            Pick the age, pick the reading level, make them the hero. Free plan — one book a month.
          </p>
          <Link href="/create" className="apple-button text-base px-8 py-3.5 inline-block">
            Create Their Book →
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
