import type { Metadata } from 'next'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'New Baby Sibling Book — Personalized Big Brother & Sister Story'
const DESCRIPTION =
  'Personalized bedtime stories starring your child: a new baby sibling story from the older child’s point of view — big brother or big sister, helper role, and room for honest feelings. Free plan, no credit card.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/new-baby-sibling-book` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/new-baby-sibling-book`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SproutTales — new baby sibling book',
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
    'new baby sibling book',
    'big brother book',
    'big sister book for toddlers',
    'personalized big sister book new baby',
    'book about becoming a big brother',
    'new baby book for older sibling',
    'big sister book',
  ],
}

const STEPS = [
  { step: '1', title: 'Tell us about your children', desc: 'The older child’s name and age, and the new baby’s name — or leave it open if the baby has not arrived yet.' },
  { step: '2', title: 'Pick the older sibling’s story', desc: 'The helper role, the funny disruption, the love that grows — the story is told from the older child’s point of view.' },
  { step: '3', title: 'Lock the hero', desc: 'SproutTales builds a reference character card so the same hero — same face, same clothes — appears on every page.' },
  { step: '4', title: 'Read it tonight', desc: 'GRL A–E leveled text matched to your child, written to be read aloud — start months before the baby arrives, or after.' },
  { step: '5', title: 'Keep it forever', desc: 'Download print-ready PDFs for Amazon KDP, or read it on screen again tomorrow night. Your books never expire.' },
]

const WHAT_YOU_GET = [
  'A new sibling story starring your older child — the story is written around them, not a name pasted into a fixed story.',
  'The same recognizable character on every page, enforced by a stored reference card.',
  'Both children’s names woven into the story, not just the cover.',
  'Room for honest feelings: the story can say the baby cries, takes attention, and is loved anyway.',
  'Reading-level-matched text (GRL A–E) with vocabulary suited to the level.',
  'Two print-ready PDFs for Amazon KDP — interior and full cover — with correct page count and bleed.',
]

const DIFFERENTIATORS = [
  {
    icon: '👶',
    title: 'The older child’s point of view',
    desc: 'This story is not about the baby. It is about the big brother or big sister: their job, their feelings, and the love that grows to fit two.',
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
    icon: '📖',
    title: 'Reading levels that teach',
    desc: 'GRL A–E leveled text with matched vocabulary, comprehension questions, and a reading-progress view.',
  },
]

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What happens in a new baby sibling story?',
    a: 'The story follows the older child as a new baby arrives: meeting the baby, learning the helper jobs, noticing the noise and the waiting, and finding that love grows to fit two children. You describe the details, and the story is written around them.',
  },
  {
    q: 'Can I make the book before the baby is born?',
    a: 'Yes. You can make the book months before the arrival, with the baby’s name or without it. Describe the baby however you like — including leaving the name and details open until the baby arrives.',
  },
  {
    q: 'Does the story only show happy feelings?',
    a: 'No. The story can include the hard parts too: the baby crying, the waiting, the wish for things to go back to normal. You choose the tone in the story description, and the story keeps the older child at the center throughout.',
  },
  {
    q: 'Can I include both children’s names?',
    a: 'Yes. Give both names when you describe the story, and both children appear in the book. The older child stays the hero; the baby appears as the new arrival the story is about.',
  },
  {
    q: 'Do I need a photo of my child?',
    a: 'No. Option A builds the hero from a text description with no real photo at all, so no personal image is ever used. Option B lets you upload a real photo, with a privacy scope you select and your recorded consent.',
  },
  {
    q: 'Will the character look the same on every page?',
    a: 'Yes. SproutTales stores a reference character card and applies a reusable consistency line on every page, so the same hero appears throughout the book instead of changing from page to page.',
  },
  {
    q: 'Can I print the book?',
    a: 'Yes. SproutTales exports two print-ready PDFs for Amazon KDP — a separate interior and a full cover (back, spine, and front) — with the correct bleed, gutter, spine width, and an even, padded page count of at least 24.',
  },
  {
    q: 'How much does it cost?',
    a: 'The Free plan creates 1 eight-page book a month with three art styles. Watermark-free PDF export and KDP-ready files start on the Creator plan at $29/month. Your books never expire.',
  },
]

/**
 * Theme prefill contract: the "Start this story" links below carry
 * `?theme=<slug>` so /create can pre-fill this page's theme. /create reads
 * the param on mount (R6) and pre-fills the Story Theme input; unknown
 * slugs are ignored and land on the normal blank /create form.
 */
const CREATE_HREF = '/create?theme=new-baby-sibling-book'

export default function NewBabySiblingBookPage() {
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
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'New baby sibling book', url: `${SITE_URL}/new-baby-sibling-book` },
        ]}
      />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-20 text-center">
        <div className="bunny-bounce mb-4 inline-block">
          <BunnyMascot size={72} />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto leading-[1.1]">
          A new baby sibling book <span className="bunny-text-gradient">starring your child</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          Personalized bedtime stories starring your child — the older sibling&apos;s story,
          with the helper role, the honest feelings, and the same hero on every page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href={CREATE_HREF} className="apple-button text-base px-8 py-3.5 text-center">
            Start this story →
          </Link>
          <Link href="/pricing" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            See Pricing
          </Link>
        </div>
        <p className="mt-4 text-sm">
          <Link href="/#samples" className="text-[#FF6B8A] underline underline-offset-4">
            See sample books →
          </Link>
        </p>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">How it works</h2>
          <p className="mt-2 text-[#8E8E93]">From an idea to a big brother or big sister story tonight, in five steps.</p>
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
          <p className="mt-2 text-[#8E8E93]">The things that make a sibling story worth reading twice.</p>
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
          Make a big brother or big sister story tonight
        </h2>
        <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
          Start free, then pick the plan that fits — your books stay yours and Pro Animation Packs never expire.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={CREATE_HREF} className="apple-button text-base px-8 py-3.5 text-center">
            Start Creating Free
          </Link>
          <Link href="/pricing" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            View Plans
          </Link>
        </div>
        <p className="mt-8 text-sm text-[#8E8E93]">
          More personalized books:{' '}
          <Link href="/potty-training-book" className="underline underline-offset-4">Potty training book</Link>
          {' · '}
          <Link href="/books-like-my-family" className="underline underline-offset-4">Books like my family</Link>
          {' · '}
          <Link href="/grandparents-picture-book" className="underline underline-offset-4">Grandparents picture book</Link>
        </p>
      </section>
    </div>
  )
}
