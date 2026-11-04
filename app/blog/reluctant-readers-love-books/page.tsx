import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'My Child Hates Reading: 7 Ways Personalized Books Turn Reluctant Readers Around'
const DESCRIPTION =
  'Is your child a reluctant reader? Discover 7 proven ways personalized picture books — with your child as the hero — rebuild reading motivation. Free plan, no credit card.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/reluctant-readers-love-books` },
  openGraph: {
    type: 'article',
    url: `${SITE_URL}/blog/reluctant-readers-love-books`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    publishedTime: '2026-11-04',
    modifiedTime: '2026-11-04',
    authors: ['SproutTales Team'],
    section: 'Parenting Guide',
    tags: ['reluctant readers', 'kids reading', 'reading motivation', 'parenting'],
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Help reluctant readers love books',
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
    'reluctant readers',
    'my child hates reading',
    'how to get kids to read',
    'child refuses to read',
    'reading motivation for kids',
    'personalized books for reluctant readers',
    'how to make reading fun for kids',
  ],
}

const FAQS = [
  {
    q: 'Why does my child hate reading?',
    a: 'Usually it isn\u2019t hate — it\u2019s frustration or boredom. Books that are too hard, too babyish, or about characters they don\u2019t care about all feel like chores. Personalized books attack the boredom half directly: the hero is them.',
  },
  {
    q: 'Will a personalized book really help a reluctant reader?',
    a: 'It removes the biggest barrier: indifference. When the story stars your child — their name, their looks, their world — curiosity replaces resistance. Pair that with text matched to their exact reading level and practice stops feeling like practice.',
  },
  {
    q: 'What reading level should I choose?',
    a: 'Start one notch below where you think they are. Success breeds motivation. SproutTales uses GRL A\u2013E leveling; a confident win at level B beats a struggle at level D every time.',
  },
  {
    q: 'How long before I see a change?',
    a: 'Parents often report a shift within the first week — the child asks for \u201ctheir\u201d story. Real reading growth still takes months of regular practice, but willingness is the prerequisite, and that can flip fast.',
  },
  {
    q: 'Is it cheating to use AI-generated books?',
    a: 'No. The reading practice is real — decoding words, following a narrative, building vocabulary. AI just removes the bottleneck of finding (or writing) stories perfectly tuned to your child.',
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

const WAYS = [
  {
    n: '1',
    title: 'Make them the hero, not a spectator',
    desc: 'Reluctant readers don\u2019t see themselves in books. Put their name on the cover, their face on the hero, their dog as the sidekick — and suddenly the book is about them. Curiosity does what nagging can\u2019t.',
  },
  {
    n: '2',
    title: 'Drop the level until winning is easy',
    desc: 'Nothing kills motivation like struggling on every page. Start a full level below their tested level. A book they can read fluently feels like a story, not a test — and fluency is what builds speed.',
  },
  {
    n: '3',
    title: 'Keep books short and finishable',
    desc: 'An 8-page picture book your child finishes beats a chapter book they abandon on page 4. Completion is a dopamine hit. Stack enough finished books and "I\u2019m a reader" becomes their identity.',
  },
  {
    n: '4',
    title: 'Let them choose the adventure',
    desc: 'Dinosaurs? Space pirates? A bakery run by cats? Choice is ownership. When kids pick the theme, they\u2019ve already bought into reading it before page one.',
  },
  {
    n: '5',
    title: 'Read the same book on repeat',
    desc: 'Re-reading isn\u2019t laziness — it\u2019s fluency training. A personalized favorite gets re-read voluntarily, which is exactly how struggling readers build automaticity.',
  },
  {
    n: '6',
    title: 'Add a real audience',
    desc: 'Have them read their personalized book to a grandparent over video call, or to a younger sibling. Performing for someone they love transforms reading from homework into a show.',
  },
  {
    n: '7',
    title: 'Print it and shelve it',
    desc: 'A printed book with their name on the spine, sitting on the family shelf next to the classics, tells a child: your stories count. That physical proof matters more than any sticker chart.',
  },
]

export default function ReluctantReadersPage() {
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
          My Child Hates Reading:{' '}
          <span className="bunny-text-gradient">7 Ways to Turn It Around</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          It&apos;s rarely hate — it&apos;s boredom or frustration. Here&apos;s how personalized
          books rebuild the willingness to read, one finished story at a time.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Make Their Book Free →
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
                <th className="w-1/3 text-left py-2 font-semibold text-[#2D2D2D]">Problem</th>
                <th className="text-left py-2 font-semibold text-[#2D2D2D]">Fix</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">Boredom</td>
                <td className="py-3 text-[#8E8E93]">Child as hero — curiosity replaces indifference</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">Frustration</td>
                <td className="py-3 text-[#8E8E93]">Drop one reading level; easy wins rebuild confidence</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">Giving up</td>
                <td className="py-3 text-[#8E8E93]">Short 8-page books that get finished, not abandoned</td>
              </tr>
              <tr>
                <td className="py-3 text-[#2D2D2D] font-medium">No ownership</td>
                <td className="py-3 text-[#8E8E93]">Let them pick the theme; print it with their name on the spine</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7 Ways */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
          7 ways to rebuild reading motivation
        </h2>
        <div className="space-y-6">
          {WAYS.map((item) => (
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
            Start with one book they can&apos;t resist
          </h2>
          <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
            Their name on the cover, their face on the hero, text at exactly their level.
            Free plan — one book a month.
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
