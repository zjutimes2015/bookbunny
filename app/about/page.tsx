import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'About SproutTales — The Team Behind AI Children\'s Books'
const DESCRIPTION =
  'Meet the team behind SproutTales. We build AI picture book tools because we believe every child deserves a story where they are the hero. Learn about our mission, values, and commitment to child privacy.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/about`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'About SproutTales',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/twitter-image.png'],
  },
}

const VALUES = [
  {
    icon: '🔒',
    title: 'Privacy first',
    desc: 'Your child\'s data never leaves your account. We never train on uploaded images, and you control exactly how photos are used.',
  },
  {
    icon: '📖',
    title: 'Education matters',
    desc: 'GRL A–E leveled text means every book is also a learning tool. Kids build reading confidence while having fun.',
  },
  {
    icon: '✨',
    title: 'Consistency over speed',
    desc: 'We built a character reference system so your hero looks the same on page one and page twenty. No jarring style shifts.',
  },
  {
    icon: '🖨️',
    title: 'Publish-ready, not preview-only',
    desc: 'Two spec-compliant PDFs — interior and full cover — ready for Amazon KDP or any printer. No extra tools needed.',
  },
  {
    icon: '💝',
    title: 'Built for families',
    desc: 'Everything we design is tested by real parents and teachers. If it doesn’t work for a family, it doesn’t ship.',
  },
  {
    icon: '🌍',
    title: 'Multilingual from day one',
    desc: 'Ten languages supported natively. Your child can read in the language that feels most like home.',
  },
]

const STORY = [
  {
    heading: 'Why we built SproutTales',
    body: `We started SproutTales because we kept seeing the same question from parents: "I want to make a book with my child in it, but I don't know how to write or draw." Commercial personalized-book services exist, but they're expensive, slow, and rarely let you tweak the story.

We knew AI could close that gap — not just generate text, but keep a character consistent across pages, match reading levels, and produce files ready for real printing. So we built it.`,
  },
  {
    heading: 'What we believe',
    body: `Every child should see themselves as the hero of a story. Not just once a year on their birthday, but whenever they want to read.

We also believe the technology should be safe. Real photos of children are sensitive data. That's why we give parents full control: text-only characters, photo-based characters with a privacy scope you choose, and zero training on uploaded images.`,
  },
  {
    heading: 'Who we are',
    body: `SproutTales is built by a small team of engineers, educators, and parents. We've shipped thousands of books, published dozens of Amazon KDP titles, and work with classroom teachers who use our platform for reading practice.

We test every feature with real families before releasing it. If it doesn't feel right for a child, we don't ship it.`,
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 md:pt-16 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto leading-[1.1]">
          About{' '}
          <span className="bunny-text-gradient">{SITE_NAME}</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          We build AI picture book tools because every child deserves a story where they are the hero.
        </p>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {STORY.map((item) => (
          <div key={item.heading}>
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-4">{item.heading}</h2>
            <p className="text-[#2D2D2D] leading-relaxed">{item.body}</p>
          </div>
        ))}
      </section>

      {/* Values */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
            What we stand for
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {VALUES.map((item) => (
              <div key={item.title} className="apple-card p-6">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-[#2D2D2D] mb-2">{item.title}</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-4">
          Ready to tell your child's story?
        </h2>
        <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
          Start free — one book at no cost. No credit card required.
        </p>
        <Link href="/create" className="apple-button text-base px-8 py-3.5 inline-block">
          Create Your First Book →
        </Link>
      </section>
    </div>
  )
}
