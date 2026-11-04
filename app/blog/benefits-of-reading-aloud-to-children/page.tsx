import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'Benefits of Reading Aloud to Children: What 20 Minutes a Day Actually Does'
const DESCRIPTION =
  'Reading aloud 20 minutes a day exposes kids to 1.8M words a year. Learn the science-backed benefits of reading aloud — and how personalized books make it stick. Free to start.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/benefits-of-reading-aloud-to-children` },
  openGraph: {
    type: 'article',
    url: `${SITE_URL}/blog/benefits-of-reading-aloud-to-children`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    publishedTime: '2026-11-04',
    modifiedTime: '2026-11-04',
    authors: ['SproutTales Team'],
    section: 'Parenting Guide',
    tags: ['reading aloud', 'early literacy', 'parenting', 'child development'],
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Benefits of reading aloud to children',
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
    'benefits of reading aloud to children',
    'reading aloud to kids benefits',
    'why read to your child every day',
    'read aloud 20 minutes a day',
    'reading to toddlers benefits',
    'early literacy at home',
  ],
}

const FAQS = [
  {
    q: 'How long should I read aloud to my child each day?',
    a: 'Aim for 15\u201320 minutes. Research often cited by literacy organizations shows kids read to just 20 minutes a day hear roughly 1.8 million words a year — versus about 8,000 for kids read to one minute a day. Consistency beats marathon sessions.',
  },
  {
    q: 'At what age should I start reading aloud?',
    a: 'From birth. Newborns benefit from the rhythm and sound of your voice; by 6 months they\u2019re tracking pictures; by age 2 they\u2019re building vocabulary at remarkable speed. It\u2019s never too early and rarely too late.',
  },
  {
    q: 'Does reading aloud help if my child can already read?',
    a: 'Yes. Reading aloud exposes kids to vocabulary and sentence structures above their independent reading level, building comprehension and a love of stories that independent practice alone can\u2019t.',
  },
  {
    q: 'What if my child won\u2019t sit still for a book?',
    a: 'That\u2019s normal, especially under age 3. Try shorter books, let them turn pages, and — the strongest trick — make them the hero. Personalized stories hold wiggly listeners far better than generic ones.',
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

const BENEFITS = [
  {
    n: '1',
    title: 'Vocabulary explodes',
    desc: 'Picture books contain far more rare words than everyday conversation — about 50% more. Twenty minutes of daily read-aloud is the single highest-leverage vocabulary input most families can give.',
  },
  {
    n: '2',
    title: 'Brain architecture gets built',
    desc: 'Back-and-forth talk during reading — asking "what do you think happens next?" — strengthens the neural connections behind language, memory, and reasoning. The book is the excuse; the conversation is the workout.',
  },
  {
    n: '3',
    title: 'Empathy and emotional vocabulary grow',
    desc: 'Stories let kids rehearse feelings safely: the character is scared, brave, jealous, proud. Naming emotions in a story makes them easier to name in real life.',
  },
  {
    n: '4',
    title: 'Attention span stretches',
    desc: 'Following a narrative for 10\u201315 minutes trains sustained attention — the same muscle school demands. Start short, finish the book, and let the streak do the work.',
  },
  {
    n: '5',
    title: 'It becomes the relationship',
    desc: 'Ask adults about their warmest childhood memories and read-aloud time shows up constantly. The closeness is the point; the literacy is the bonus.',
  },
]

export default function BenefitsOfReadingAloudPage() {
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
          Benefits of Reading Aloud:{' '}
          <span className="bunny-text-gradient">What 20 Minutes a Day Does</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          The most studied, most recommended, least expensive thing you can do for your
          child&apos;s brain — and how to make the habit actually stick.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Make a Read-Aloud Book Free →
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
                <th className="w-1/3 text-left py-2 font-semibold text-[#2D2D2D]">Habit</th>
                <th className="text-left py-2 font-semibold text-[#2D2D2D]">Impact</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">20 min/day read-aloud</td>
                <td className="py-3 text-[#8E8E93]">~1.8M words heard per year vs ~8K at 1 min/day</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">Start age</td>
                <td className="py-3 text-[#8E8E93]">Birth — voice rhythm first, pictures by 6 months</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">Key benefits</td>
                <td className="py-3 text-[#8E8E93]">Vocabulary, empathy, attention span, parent-child bond</td>
              </tr>
              <tr>
                <td className="py-3 text-[#2D2D2D] font-medium">Make it stick</td>
                <td className="py-3 text-[#8E8E93]">Personalized hero + same time daily + let them choose</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5 Benefits */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
          5 science-backed benefits
        </h2>
        <div className="space-y-6">
          {BENEFITS.map((item) => (
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

      {/* Make it stick */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-6">
          How to make the habit stick
        </h2>
        <div className="apple-card p-8 space-y-5 text-[#8E8E93] leading-relaxed">
          <p><strong className="text-[#2D2D2D]">Anchor it to bedtime.</strong> Same time, same chair, every night. Habits attached to existing routines survive busy weeks.</p>
          <p><strong className="text-[#2D2D2D]">Let them choose.</strong> A child who picked the book has already agreed to listen to it. Rotate the choice between you and them.</p>
          <p><strong className="text-[#2D2D2D]">Personalize the hero.</strong> A story starring your child holds attention through the wiggliest phases — and gives you fresh material every week instead of the same five books.</p>
          <p><strong className="text-[#2D2D2D]">Talk, don&apos;t just read.</strong> Pause and ask what they see, what happens next, how the character feels. That dialogue is where half the benefit lives.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-4">
            Tonight&apos;s read-aloud, starring your child
          </h2>
          <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
            Create a personalized picture book in about 8 minutes. Free plan — one book a month.
          </p>
          <Link href="/create" className="apple-button text-base px-8 py-3.5 inline-block">
            Create Tonight&apos;s Story →
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
