import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'GRL Reading Levels A–E Explained: Pick the Right Level for Your Child'
const DESCRIPTION =
  'What are GRL reading levels A through E? A parent and teacher guide to Guided Reading Levels — what each level means, how to spot your child’s level, and how SproutTales matches every book to it.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/grl-reading-levels-explained` },
  openGraph: {
    type: 'article',
    url: `${SITE_URL}/blog/grl-reading-levels-explained`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    publishedTime: '2026-11-03',
    modifiedTime: '2026-11-03',
    authors: ['SproutTales Team'],
    section: 'Reading Guide',
    tags: ['GRL', 'guided reading levels', 'reading levels', 'early readers', 'kindergarten reading'],
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GRL reading levels A to E explained',
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
    'GRL reading levels',
    'guided reading levels chart',
    'GRL A-E',
    'reading levels for kindergarten',
    'what is GRL level C',
    'leveled readers for beginners',
    'guided reading level explained parents',
  ],
}

const LEVELS = [
  {
    level: 'A',
    title: 'First sight words',
    desc: 'One short, predictable sentence per page with heavy picture support. Children point at each word as they read. Typical of the very start of kindergarten.',
    example: '“The cat sat.”',
  },
  {
    level: 'B',
    title: 'Patterned sentences',
    desc: 'Two to three short lines per page following a repeating pattern, with one word changing. Pictures still carry most of the meaning.',
    example: '“The cat sat. The dog sat.”',
  },
  {
    level: 'C',
    title: 'Simple stories',
    desc: 'Short stories of 3–6 lines per page with familiar vocabulary and clear dialogue. Children begin reading more independently and self-correcting.',
    example: '““Come here,” said the cat. “I have a red ball.””',
  },
  {
    level: 'D',
    title: 'Longer narratives',
    desc: 'Stories with a beginning, middle, and end across 6–10 lines per page. New vocabulary appears with enough context to figure it out.',
    example: 'Multi-sentence paragraphs with quotation marks and story events.',
  },
  {
    level: 'E',
    title: 'Early chapter books',
    desc: 'Longer stories with chapters or episodes, varied sentence structures, and richer vocabulary. Readers handle 10+ lines per page comfortably.',
    example: 'Short chapters with dialogue, description, and plot turns.',
  },
]

const FAQS = [
  {
    q: 'What does GRL mean in reading?',
    a: 'GRL stands for Guided Reading Level, a scale from A to Z developed by Fountas & Pinnell that matches books to a child’s reading ability. Levels A–E cover the earliest readers, from first sight words (A) to early chapter books (E).',
  },
  {
    q: 'How do I know my child’s GRL level?',
    a: 'Teachers usually assess it at school — ask your child’s teacher. At home, a rough signal: if your child reads a book fluently with 95%+ word accuracy and understands the story, that level fits. If they struggle on every line, drop a level.',
  },
  {
    q: 'What is the difference between GRL C and GRL D?',
    a: 'Level C books have 3–6 short lines per page with very familiar words. Level D introduces longer narratives with a clear story arc, 6–10 lines per page, and new vocabulary children can decode from context.',
  },
  {
    q: 'Can AI generate books at a specific GRL level?',
    a: 'Yes. SproutTales lets you choose GRL A through E before generating. The AI matches vocabulary difficulty, sentence length, and lines per page to the level, so the book teaches while it entertains.',
  },
  {
    q: 'Are GRL levels the same as Lexile or DRA?',
    a: 'No, they are different scales that roughly correlate. GRL A–E spans the earliest readers; teachers often convert between GRL, DRA, and Lexile when reporting progress. Ask your school which scale they use.',
  },
  {
    q: 'Should my child only read books at their exact level?',
    a: 'No. The exact level is for instructional reading (with a teacher or parent). Children should also re-read easier favorites for fluency and explore harder books for fun — motivation matters as much as measurement.',
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

export default function GrlReadingLevelsPage() {
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
        <p className="text-sm text-[#8E8E93] font-medium uppercase tracking-widest mb-3">Reading Guide · Updated November 2026</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto leading-[1.1]">
          GRL Reading Levels <span className="bunny-text-gradient">A–E</span> Explained
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          What each Guided Reading Level actually means, how to spot your child’s level,
          and why the right level turns reading practice into reading joy.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Make a Leveled Book →
          </Link>
          <Link href="/pricing" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            See Plans
          </Link>
        </div>
      </section>

      {/* Quick summary table — AI Overview bait */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="apple-card p-8">
          <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">GRL A–E at a glance</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5EA]">
                <th className="text-left py-2 font-semibold text-[#2D2D2D]">Level</th>
                <th className="text-left py-2 font-semibold text-[#2D2D2D]">Text per page</th>
                <th className="text-left py-2 font-semibold text-[#2D2D2D]">Typical stage</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 font-semibold text-[#2D2D2D]">A</td>
                <td className="py-3 text-[#8E8E93]">1 predictable sentence</td>
                <td className="py-3 text-[#8E8E93]">Start of kindergarten</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 font-semibold text-[#2D2D2D]">B</td>
                <td className="py-3 text-[#8E8E93]">2–3 patterned lines</td>
                <td className="py-3 text-[#8E8E93]">Kindergarten</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 font-semibold text-[#2D2D2D]">C</td>
                <td className="py-3 text-[#8E8E93]">3–6 lines, simple story</td>
                <td className="py-3 text-[#8E8E93]">Kindergarten</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 font-semibold text-[#2D2D2D]">D</td>
                <td className="py-3 text-[#8E8E93]">6–10 lines, story arc</td>
                <td className="py-3 text-[#8E8E93]">Late kindergarten</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-[#2D2D2D]">E</td>
                <td className="py-3 text-[#8E8E93]">10+ lines, early chapters</td>
                <td className="py-3 text-[#8E8E93]">Kindergarten → Grade 1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Levels */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
          What each level looks like
        </h2>
        <div className="space-y-6">
          {LEVELS.map((item) => (
            <div key={item.level} className="apple-card p-6 flex gap-5 items-start">
              <div className="w-10 h-10 rounded-full bunny-gradient text-white font-bold flex-shrink-0 flex items-center justify-center text-lg">
                {item.level}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[#2D2D2D] mb-1">Level {item.level} — {item.title}</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed mb-2">{item.desc}</p>
                <p className="text-sm text-[#8E8E93] italic">{item.example}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SproutTales tie-in */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-4">
            Every SproutTales book is leveled A–E
          </h2>
          <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
            Pick your child’s level before generating. The AI matches vocabulary,
            sentence length, and lines per page — and the Teacher plan exports
            GRL vocabulary lists and score reports per book.
          </p>
          <Link href="/create" className="apple-button text-base px-8 py-3.5 inline-block">
            Create a Leveled Book →
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
