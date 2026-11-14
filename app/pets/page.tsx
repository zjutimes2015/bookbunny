import type { Metadata } from 'next'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'Personalized Pet Storybook — Your Pet, the Hero of Their Own Story'
const DESCRIPTION =
  'A personalized pet storybook starring your pet: upload a photo, and the same pet — same coat, same markings, same collar — appears on every page. A keepsake gift for pet lovers, print-ready.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/pets` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/pets`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SproutTales — personalized pet storybook',
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
    'personalized pet storybook',
    'personalized pet book',
    'custom dog storybook',
    'custom cat book',
    'pet keepsake book',
    'dog storybook gift',
    'pet lover gift book',
    'personalized book starring my dog',
    'personalized book starring my pet',
    'pet and child storybook',
  ],
}

const STEPS = [
  { step: '1', title: 'Tell us about your pet', desc: 'Name, species, and the quirks that make them yours — or upload a photo to draw from.' },
  { step: '2', title: 'Pick the adventure', desc: 'The story of your first year together, a brave rescue, one perfect day at the beach — or your own idea.' },
  { step: '3', title: 'Lock the character', desc: 'SproutTales builds a reference character card — coat, markings, collar, name tag — so the same pet appears on every page.' },
  { step: '4', title: 'Read the keepsake story', desc: 'Pet-only books are written for the adult reader: warm, reflective, no reading level. A story to keep, not a lesson.' },
  { step: '5', title: 'Print it as a gift', desc: 'Download print-ready PDFs for Amazon KDP — interior and full cover — and give a real book, not another mug.' },
]

const WHAT_YOU_GET = [
  'A story starring your pet — the adventure is written around them, not a name pasted into a fixed story.',
  'The same recognizable pet on every page, enforced by a stored reference card: coat colors, markings, collar, and name tag stay put.',
  'Their name, species, and habits woven into the story itself, not just the cover.',
  'Text written for grown-ups. Pet-only books skip reading levels entirely — no leveled vocabulary, no quiz.',
  'A child + pet option: your child and your pet as co-heroes, with the same reading-level-matched text as every SproutTales children’s book.',
  'Two print-ready PDFs for Amazon KDP — interior and full cover — with correct page count and bleed.',
]

const DIFFERENTIATORS = [
  {
    icon: '🐾',
    title: 'A gift they will keep',
    desc: 'A book where a beloved pet is the hero outlasts the toys and the treats. It is read on the day it arrives and kept on the shelf for years.',
  },
  {
    icon: '⭐',
    title: 'Truly generated, not a template',
    desc: 'The story is written and illustrated around your pet. Other personalized pet books insert a name into a fixed story — SproutTales builds the story itself.',
  },
  {
    icon: '👤',
    title: 'No real photo needed',
    desc: 'Option A builds the hero from a text description with no real photo at all. Option B uses a real photo, with a privacy scope you choose.',
  },
  {
    icon: '🔒',
    title: 'No consent step for a pet photo',
    desc: 'A pet’s photo is not a child’s personal information, so a pet-only book needs no parental-consent step. Books that include a child still require recorded parental consent before the child’s photo is used.',
  },
  {
    icon: '👧',
    title: 'Child + pet, together',
    desc: 'One book, two heroes: your child and your pet share the adventure, with reading-level-matched text and the same consent protections as every children’s book.',
  },
  {
    icon: '📐',
    title: 'Print-ready for Amazon KDP',
    desc: 'Two separate spec-compliant PDFs — interior and full cover — with bleed, gutter, spine width, and a padded page count.',
  },
]

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Do I need a photo of my pet?',
    a: 'No. Option A builds the hero from a text description — species, coat, markings, collar — with no real photo at all. Option B lets you upload a real photo, with a privacy scope you select, and the illustrations are drawn to match it.',
  },
  {
    q: 'Which pets can star in a book?',
    a: 'Any pet you can describe or photograph: dogs, cats, rabbits, birds, and anything else with a name. The character card records whatever makes your pet recognizable — markings, collar, favorite toy — and keeps it consistent on every page.',
  },
  {
    q: 'Will my pet look the same on every page?',
    a: 'That is the whole point of the character card. Before the story is illustrated, SproutTales builds a reference card for your pet — coat colors, markings, collar, name tag — and every page is generated against it, so the pet stays recognizable from cover to cover.',
  },
  {
    q: 'Is the text written for children?',
    a: 'Pet-only books are written for the adult reader: warm, reflective stories with no reading level, no vocabulary limits, and no quiz. If you make a child + pet book instead, the text is leveled from GRL A to E, matched to your child, just like every SproutTales children’s book.',
  },
  {
    q: 'Can I make a book with my child and my pet together?',
    a: 'Yes — choose the Child + pet book type when you create. Your child and your pet share the adventure as co-heroes. The story keeps reading-level-matched text, and a photo of your child still requires your recorded parental consent first.',
  },
  {
    q: 'Can I print the pet book?',
    a: 'Yes. SproutTales exports two print-ready PDFs for Amazon KDP — a separate interior and a full cover (back, spine, and front) — with the correct bleed, gutter, spine width, and an even, padded page count of at least 24.',
  },
  {
    q: 'How much does it cost?',
    a: 'The Free plan creates 1 eight-page book a month with three art styles. Watermark-free PDF export and KDP-ready files start on the Creator plan at $29/month. Your books never expire.',
  },
]

export default function PetsPage() {
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
          { name: 'Personalized pet storybook', url: `${SITE_URL}/pets` },
        ]}
      />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-20 text-center">
        <div className="bunny-bounce mb-4 inline-block">
          <BunnyMascot size={72} />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto leading-[1.1]">
          Your pet. <span className="bunny-text-gradient">Their story.</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          A personalized storybook starring your dog, your cat, your best friend — the same pet
          on every page, written as a keepsake for the person who loves them.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create?type=pet" className="apple-button text-base px-8 py-3.5 text-center">
            Make a Pet Book →
          </Link>
          <Link href="/create?type=child-pet" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            Child + Pet Book
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">How it works</h2>
          <p className="mt-2 text-[#8E8E93]">From a photo to a keepsake book, in five steps.</p>
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
          <p className="mt-2 text-[#8E8E93]">The things that make a pet book a gift worth keeping.</p>
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
          Make a book your pet deserves
        </h2>
        <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
          Start free, then pick the plan that fits — your books stay yours and Pro Animation Packs never expire.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/create?type=pet" className="apple-button text-base px-8 py-3.5 text-center">
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
          <Link href="/personalized-birthday-book" className="underline underline-offset-4">Birthday book</Link>
          {' · '}
          <Link href="/personalized-christmas-book" className="underline underline-offset-4">Christmas book</Link>
        </p>
      </section>
    </div>
  )
}
