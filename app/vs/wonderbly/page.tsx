import type { Metadata } from 'next'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'SproutTales vs Wonderbly — AI Storybook vs Personalized Book'
const DESCRIPTION =
  'An honest comparison of SproutTales and Wonderbly: Wonderbly inserts your child’s name into fixed, professionally illustrated books; SproutTales generates a whole story around your child with AI. Which fits what you want?'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/vs/wonderbly` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/vs/wonderbly`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SproutTales vs Wonderbly comparison',
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
    'SproutTales vs Wonderbly',
    'Wonderbly alternative',
    'AI alternative to Wonderbly',
    'best AI storybook app',
    'AI storybook vs personalized book',
    'personalized book vs AI storybook',
  ],
}

interface CompareRow {
  feature: string
  bookbunny: string
  wonderbly: string
}

const ROWS: CompareRow[] = [
  {
    feature: 'How the story is made',
    bookbunny:
      'AI writes and illustrates a new story around your child — their name, looks, and interests shape the adventure itself.',
    wonderbly:
      'Authors and illustrators make fixed books; a rendering engine inserts your child’s name and avatar into the finished story.',
  },
  {
    feature: 'Child as the hero',
    bookbunny:
      'The story is generated around the child — they are the hero of a story that exists only for them.',
    wonderbly:
      'Your child appears in a fixed story with their name and avatar. The story itself is the same for every child.',
  },
  {
    feature: 'Character consistency',
    bookbunny:
      'A stored reference character card keeps the same hero — same face, same clothes — on every page.',
    wonderbly:
      'Fixed illustrations with the child’s avatar inserted. The character is the book’s character, not your child’s.',
  },
  {
    feature: 'Reading levels',
    bookbunny:
      'GRL A–E leveled text with matched vocabulary, comprehension questions, and a reading-progress view.',
    wonderbly:
      'Fixed text written for each book, with an age range per title.',
  },
  {
    feature: 'Print',
    bookbunny:
      'Print-ready KDP PDFs you export — interior and full cover — and print yourself, or read on screen.',
    wonderbly:
      'Printed books made and shipped to you.',
  },
  {
    feature: 'Free plan',
    bookbunny: 'Free plan: 1 eight-page book a month, with three art styles.',
    wonderbly: 'No free tier — books are bought per title.',
  },
  {
    feature: 'Price',
    bookbunny:
      'Free $0 (1 book/mo); Creator $29/mo ($261/yr); Studio $79/mo ($711/yr); Teacher $99/mo ($891/yr). Books are counted, not credits.',
    wonderbly:
      'Per-book pricing that varies by title — check wonderbly.com for current prices.',
  },
  {
    feature: 'Photo privacy',
    bookbunny:
      'Option A needs no photo at all. Option B uses a real photo only with your recorded consent.',
    wonderbly: 'An avatar is created from a photo you upload.',
  },
]

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Is Wonderbly AI-generated?',
    a: 'No. Wonderbly books are made by authors and illustrators, and a rendering engine inserts the child’s name and avatar into a fixed story. SproutTales generates the whole story — text and illustrations — around your child with AI. That is the real difference between the two.',
  },
  {
    q: 'Which is better for a gift?',
    a: 'It depends what the gift is. Wonderbly is the better fit if you want a professionally illustrated printed book shipped to the door, with a fixed, proven story. SproutTales is the better fit if you want a story that exists only for that child — and a printed copy you make yourself from print-ready PDFs.',
  },
  {
    q: 'Can I print a SproutTales book?',
    a: 'Yes. SproutTales exports two print-ready PDFs for Amazon KDP — a separate interior and a full cover (back, spine, and front) — with the correct bleed, gutter, spine width, and an even, padded page count of at least 24.',
  },
  {
    q: 'Does SproutTales ship printed books?',
    a: 'No. SproutTales exports print-ready PDFs that you print yourself — through Amazon KDP or at home. Wonderbly ships printed books to you. If you want a book in hand without making anything, Wonderbly is the simpler choice.',
  },
  {
    q: 'Is my child’s photo safe?',
    a: 'On SproutTales, yes — and you can avoid a photo entirely. Option A builds the hero from a text description with no real photo at all. Option B uses a real photo only with your recorded consent, and parents create the books; children do not sign up or share data.',
  },
  {
    q: 'How much does each cost?',
    a: 'SproutTales: Free $0 (1 book a month), Creator $29/month, Studio $79/month, Teacher $99/month. Wonderbly sells books per title and prices vary by book — check wonderbly.com for current prices.',
  },
  {
    q: 'Can I try SproutTales free?',
    a: 'Yes. The Free plan creates 1 eight-page book a month with three art styles, and your books never expire. Watermark-free PDF export and KDP-ready files start on the Creator plan at $29/month.',
  },
]

export default function VsWonderblyPage() {
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
          SproutTales <span className="bunny-text-gradient">vs</span> Wonderbly
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          Wonderbly puts your child’s name into a fixed, professionally illustrated book.
          SproutTales generates a whole story around your child. Here is an honest, side-by-side
          look — including where Wonderbly is the stronger choice.
        </p>
      </section>

      {/* Comparison table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="apple-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5EA]">
                  <th className="w-1/4 px-5 py-4 text-left font-semibold text-[#2D2D2D]">Feature</th>
                  <th className="w-[37.5%] px-5 py-4 text-left font-semibold text-[#FF6B8A]">
                    SproutTales
                  </th>
                  <th className="w-[37.5%] px-5 py-4 text-left font-semibold text-[#2D2D2D]">
                    Wonderbly
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-[#F2F2F7] last:border-0 align-top">
                    <td className="px-5 py-4 font-medium text-[#2D2D2D]">{row.feature}</td>
                    <td className="px-5 py-4 bg-[#FFF9F7] text-[#2D2D2D] leading-relaxed">
                      {row.bookbunny}
                    </td>
                    <td className="px-5 py-4 text-[#8E8E93] leading-relaxed">{row.wonderbly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-[#8E8E93] mt-4">
          Wonderbly’s prices vary by title, so no single price is listed here — always check
          wonderbly.com for their current prices and titles.
        </p>
      </section>

      {/* When each is the better fit */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="apple-card p-8">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">When Wonderbly is the better fit</h2>
              <ul className="space-y-3">
                {[
                  'You want a professionally illustrated printed book shipped to your door, with a fixed, proven story.',
                  'You are buying a gift and want a physical product, not a file to print.',
                  'You prefer a story written by a published author over one generated by AI.',
                  'You want the book in hand without making anything yourself.',
                ].map((item) => (
                  <li key={item} className="text-sm text-[#8E8E93] flex items-start gap-2 leading-relaxed">
                    <span className="text-[#8E8E93] mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="apple-card p-8">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">When SproutTales is the better fit</h2>
              <ul className="space-y-3">
                {[
                  'You want the story itself built around your child — not their name in someone else’s story.',
                  'You want the same character to look consistent on every single page.',
                  'You want leveled reading (GRL A–E) with comprehension questions and progress tracking.',
                  'You want a print-ready interior and full cover you can upload straight to Amazon KDP.',
                  'You want to try it free — 1 book a month on the Free plan.',
                ].map((item) => (
                  <li key={item} className="text-sm text-[#2D2D2D] flex items-start gap-2 leading-relaxed">
                    <span className="text-[#FF6B8A] mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
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
          Try SproutTales for yourself
        </h2>
        <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
          Start free, then pick the plan that fits — Pro Animation Packs never expire.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Create Your First Book
          </Link>
          <Link href="/pricing" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            Compare SproutTales Plans
          </Link>
        </div>
        <p className="mt-8 text-sm text-[#8E8E93]">
          More personalized books:{' '}
          <Link href="/bedtime-story-starring-my-child" className="underline underline-offset-4">Bedtime story starring your child</Link>
          {' · '}
          <Link href="/personalized-christmas-book" className="underline underline-offset-4">Christmas book</Link>
          {' · '}
          <Link href="/personalized-birthday-book" className="underline underline-offset-4">Birthday book</Link>
        </p>
      </section>
    </div>
  )
}
