import type { Metadata } from 'next'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'Personalized Birthday Book for Kids — Starring Your Child'
const DESCRIPTION =
  'A personalized birthday book starring your child: a birthday adventure with their name and face, the same hero on every page, print-ready for a gift they will keep. Free plan, no credit card.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/personalized-birthday-book` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/personalized-birthday-book`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SproutTales — personalized birthday book for kids',
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
    'personalized birthday book',
    'personalized birthday book for kids',
    'custom birthday storybook',
    'birthday book starring my child',
    'personalized birthday gift for kids',
    'birthday bedtime story personalized',
    'kids birthday book with child name',
    'personalised birthday book for children',
  ],
}

const STEPS = [
  { step: '1', title: 'Tell us about your child', desc: 'Name, age, and what they love — or upload a photo, with your recorded consent.' },
  { step: '2', title: 'Pick the birthday adventure', desc: 'The lost cake, a treasure hunt, a party with their favorite animals — or your own idea.' },
  { step: '3', title: 'Lock the hero', desc: 'SproutTales builds a reference character card so the same hero — same face, same clothes — appears on every page.' },
  { step: '4', title: 'Read it on the big day', desc: 'GRL A–E leveled text matched to your child, written to be read aloud before the candles.' },
  { step: '5', title: 'Print it as a gift', desc: 'Download print-ready PDFs for Amazon KDP — interior and full cover — and give a real book, not another toy.' },
]

const WHAT_YOU_GET = [
  'A birthday story starring your child — the adventure is written around them, not a name pasted into a fixed story.',
  'The same recognizable character on every page, enforced by a stored reference card.',
  'Their name, age, and favorite things woven into the birthday story, not just the cover.',
  'Reading-level-matched text (GRL A–E) with vocabulary suited to the level.',
  'Comprehension questions and a reading-progress view for each book.',
  'Two print-ready PDFs for Amazon KDP — interior and full cover — with correct page count and bleed.',
]

const DIFFERENTIATORS = [
  {
    icon: '🎂',
    title: 'A gift they will keep',
    desc: 'A birthday book where your child is the hero outlasts the toys. It is read on the big day and kept on the shelf for years.',
  },
  {
    icon: '⭐',
    title: 'Truly generated, not a template',
    desc: 'The story is written and illustrated around your child. Other personalized books insert a name into a fixed story — SproutTales builds the story itself.',
  },
  {
    icon: '👤',
    title: 'No real photo needed',
    desc: 'Option A builds the hero from a text description with no real photo at all. Option B uses a real photo, with a privacy scope you choose.',
  },
  {
    icon: '🔒',
    title: 'Parental consent before photos',
    desc: 'Parents create the books; children do not sign up or share data. A photo is used only after your recorded consent.',
  },
  {
    icon: '📐',
    title: 'Print-ready for Amazon KDP',
    desc: 'Two separate spec-compliant PDFs — interior and full cover — with bleed, gutter, spine width, and a padded page count.',
  },
]

const FAQS: { q: string; a: string }[] = [
  {
    q: 'When should I make a personalized birthday book?',
    a: 'A week or two before the birthday is ideal. The book itself takes about 10 minutes to generate, but if you want a printed copy, leave time for printing and delivery. A digital copy can be read on screen the same day you make it.',
  },
  {
    q: 'Can I print the birthday book?',
    a: 'Yes. SproutTales exports two print-ready PDFs for Amazon KDP — a separate interior and a full cover (back, spine, and front) — with the correct bleed, gutter, spine width, and an even, padded page count of at least 24.',
  },
  {
    q: 'Does it work as a gift from grandparents?',
    a: 'Yes — grandparents are the biggest buyers of personalized children’s books. A grandparent can make the book with the child’s name, age, and favorite things, then print it or read it together on a video call on the birthday.',
  },
  {
    q: 'What birthday stories can I choose?',
    a: 'Any birthday adventure you can describe: the lost cake, a treasure hunt, a party with their favorite animals, or your own idea. The story is written around your child, so the adventure fits them.',
  },
  {
    q: 'Do I need a photo of my child?',
    a: 'No. Option A builds the hero from a text description with no real photo at all, so no personal image is ever used. Option B lets you upload a real photo, with a privacy scope you select and your recorded consent.',
  },
  {
    q: 'Is it really personalized, or just a name on the cover?',
    a: 'Really personalized. The story is written around your child — their name, age, and what they love shape the adventure itself, and the hero is illustrated to match them on every page. It is not a fixed story with a name inserted.',
  },
  {
    q: 'What age is a personalized birthday book for?',
    a: 'SproutTales stories are made for children aged 3 to 8. The text is leveled from GRL A to E, so a 3-year-old gets short, simple sentences and a 7-year-old gets a longer story with harder words.',
  },
  {
    q: 'How much does it cost?',
    a: 'The Free plan creates 1 eight-page book a month with three art styles. Watermark-free PDF export and KDP-ready files start on the Creator plan at $29/month. Your books never expire.',
  },
]

export default function PersonalizedBirthdayBookPage() {
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
          A birthday book <span className="bunny-text-gradient">starring your child</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          A birthday adventure written around your child — the same hero on every page, leveled
          text, and a print-ready book for a gift they will keep.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Make a Birthday Book →
          </Link>
          <Link href="/pricing" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            See Pricing
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">How it works</h2>
          <p className="mt-2 text-[#8E8E93]">From an idea to a birthday book they will keep, in five steps.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((item) => (
            <div key={item.step} className="apple-card p-8">
              <div className="w-10 h-10 rounded-full bunny-gradient text-white font-bold flex items-center justify-center mb-4 text-lg">
                {item.step}
              </div>
              <h3 className="font-semibold text-lg text-[#2D2D2D] mb-2">{item.title}</h3>
              <p className="text-sm text-[#8E8E93] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">What you get</h2>
          </div>
          <div className="apple-card p-8">
            <ul className="space-y-4">
              {WHAT_YOU_GET.map((item) => (
                <li key={item} className="text-[#2D2D2D] flex items-start gap-3">
                  <span className="text-[#FF6B8A] font-semibold mt-0.5">✓</span>
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Why SproutTales is different */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">Why SproutTales is different</h2>
          <p className="mt-2 text-[#8E8E93]">The things that make a birthday book a gift worth keeping.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {DIFFERENTIATORS.map((item) => (
            <div key={item.title} className="apple-card p-8">
              <div className="text-2xl mb-4">{item.icon}</div>
              <h3 className="font-semibold text-lg text-[#2D2D2D] mb-2">{item.title}</h3>
              <p className="text-sm text-[#8E8E93] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-4">
          Make a birthday book they will keep
        </h2>
        <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
          Start free, then pick the plan that fits — your books stay yours and Pro Animation Packs never expire.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Start Creating Free
          </Link>
          <Link href="/pricing" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            View Plans
          </Link>
        </div>
        <p className="mt-8 text-sm text-[#8E8E93]">
          More personalized books:{' '}
          <Link href="/bedtime-story-starring-my-child" className="underline underline-offset-4">Bedtime story starring your child</Link>
          {' · '}
          <Link href="/personalized-christmas-book" className="underline underline-offset-4">Christmas book</Link>
          {' · '}
          <Link href="/dinosaur-bedtime-story" className="underline underline-offset-4">Dinosaur bedtime story</Link>
        </p>
      </section>
    </div>
  )
}
