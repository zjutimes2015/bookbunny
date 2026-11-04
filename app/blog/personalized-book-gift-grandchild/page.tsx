import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'The Personalized Book Gift Grandparents Love: Starring Their Grandchild'
const DESCRIPTION =
  'The best personalized gift for a grandchild: a printed picture book with their name and likeness as the hero. Create it in minutes, print it in days — free to start.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/personalized-book-gift-grandchild` },
  openGraph: {
    type: 'article',
    url: `${SITE_URL}/blog/personalized-book-gift-grandchild`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    publishedTime: '2026-11-04',
    modifiedTime: '2026-11-04',
    authors: ['SproutTales Team'],
    section: 'Gift Guide',
    tags: ['personalized gifts', 'grandparent gifts', 'custom books', 'kids gifts'],
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Personalized book gift for grandchild',
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
    'personalized book gift',
    'custom book for grandchild',
    'personalized gift for granddaughter',
    'personalized gift for grandson',
    'book with child name personalized',
    'grandparent gift ideas',
    'unique gifts for grandchildren',
  ],
}

const FAQS = [
  {
    q: 'What makes a personalized book a good gift for a grandchild?',
    a: 'It\u2019s the rare gift that\u2019s both personal and lasting. A book starring your grandchild — their name, their likeness — gets read hundreds of times and kept for years. Toys break; a book with their name on the spine becomes a keepsake.',
  },
  {
    q: 'How long does it take to make one?',
    a: 'Creating the book takes about 8 minutes with SproutTales: one sentence for the story, a reading level, and a description or photo of your grandchild. Printing and shipping depends on your print shop — plan 1\u20132 weeks before the occasion.',
  },
  {
    q: 'Can I put my grandchild\u2019s photo in the book?',
    a: 'Yes. Upload a photo and SproutTales uses it as the character reference, so the illustrated hero resembles your grandchild on every page — consistently, with no face-swaps.',
  },
  {
    q: 'What should the story be about?',
    a: 'Pick something from your relationship: a fishing trip with Grandpa, Grandma\u2019s garden coming alive, or a holiday adventure you actually shared. Real memories make the gift unforgettable.',
  },
  {
    q: 'Can I print multiple copies for siblings or cousins?',
    a: 'Yes. Export the print-ready PDFs once, then order as many printed copies as you like from Amazon KDP or any print shop. One creation, a gift for every grandchild.',
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

const STEPS = [
  {
    n: '1',
    title: 'Pick a shared memory',
    desc: 'The fishing trip. The garden. The holiday kitchen chaos. A story built on something you actually did together beats any generic adventure — it tells the child: I remember, and it mattered.',
  },
  {
    n: '2',
    title: 'Write one sentence',
    desc: '\u201cLeo and Grandpa sail to the island where the lighthouse tells jokes.\u201d That\u2019s the entire brief. The AI expands it into a full 8-page story.',
  },
  {
    n: '3',
    title: 'Add your grandchild\u2019s likeness',
    desc: 'Describe them in a few words or upload a photo. The character reference locks their look across every illustration — same kid, every page.',
  },
  {
    n: '4',
    title: 'Match their reading age',
    desc: 'Choose GRL A\u2013E to fit the grandchild\u2019s stage. For toddlers, simple read-aloud text; for early readers, sentences they can tackle themselves.',
  },
  {
    n: '5',
    title: 'Print it properly',
    desc: 'Export the print-ready PDFs — interior plus full-wrap cover — and order through Amazon KDP or a local print shop. Add a handwritten dedication on the title page for the full effect.',
  },
]

export default function PersonalizedBookGiftPage() {
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
        <p className="text-sm text-[#8E8E93] font-medium uppercase tracking-widest mb-3">Gift Guide</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto">
          The Personalized Book Gift{' '}
          <span className="bunny-text-gradient">Grandparents Love to Give</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          A printed picture book starring your grandchild — their name, their face,
          your shared memories. Here&apos;s how to make one they&apos;ll keep forever.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Start the Gift Free →
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
                <td className="py-3 text-[#2D2D2D] font-medium">The gift</td>
                <td className="py-3 text-[#8E8E93]">Printed picture book with your grandchild as the hero</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">Time to create</td>
                <td className="py-3 text-[#8E8E93]">~8 minutes; printing takes 1–2 weeks — plan ahead</td>
              </tr>
              <tr className="border-b border-[#F2F2F7]">
                <td className="py-3 text-[#2D2D2D] font-medium">Personalization</td>
                <td className="py-3 text-[#8E8E93]">Name, likeness from a photo, your shared memories as the plot</td>
              </tr>
              <tr>
                <td className="py-3 text-[#2D2D2D] font-medium">Copies</td>
                <td className="py-3 text-[#8E8E93]">Export once, print many — one for every grandchild</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Why it works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-6">
          Why it beats every other grandparent gift
        </h2>
        <div className="apple-card p-8 space-y-5 text-[#8E8E93] leading-relaxed">
          <p><strong className="text-[#2D2D2D]">It gets read, not shelved.</strong> Toys average weeks of attention. A book where the grandchild is the hero gets read hundreds of times — often by the grandparent, which is the point.</p>
          <p><strong className="text-[#2D2D2D]">It can&apos;t be the wrong size or duplicate.</strong> Nobody already bought it. Nobody outgrows it this season. It&apos;s one of one.</p>
          <p><strong className="text-[#2D2D2D]">It says what cards can&apos;t.</strong> &ldquo;I see you. I remember our adventures. You matter to me.&rdquo; A personalized story carries that message on every page without ever stating it.</p>
        </div>
      </section>

      {/* 5 Steps */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
          5 steps to the perfect grandparent gift
        </h2>
        <div className="space-y-6">
          {STEPS.map((item) => (
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
            Start their keepsake today
          </h2>
          <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
            Free plan — one book a month. Create it now, print it in time for the occasion.
          </p>
          <Link href="/create" className="apple-button text-base px-8 py-3.5 inline-block">
            Create the Gift →
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
