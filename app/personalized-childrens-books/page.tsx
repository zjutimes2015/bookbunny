import type { Metadata } from 'next'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = "Personalized Children's Books — AI-Generated Gifts Your Kids Will Love"
const DESCRIPTION =
  "Create a personalized children's book in minutes with SproutTales AI. Your child is the hero, with consistent illustrations across every page. Perfect birthday, Christmas, and holiday gifts. Start free today."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/personalized-childrens-books` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/personalized-childrens-books`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Personalized childrens books — AI generated gifts',
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
    'personalized childrens book',
    'custom kids book',
    'personalized baby book',
    'AI children book gift',
    'personalized book with child photo',
    'birthday gift for kids AI book',
    'Christmas book for kids personalized',
    'custom storybook for children',
  ],
}

const OCCASIONS = [
  {
    icon: '🎂',
    title: 'Birthday gift',
    desc: 'Make your child the hero of their own adventure story — a surprise they will treasure forever.',
  },
  {
    icon: '🎄',
    title: 'Christmas & holidays',
    desc: 'The most memorable holiday gift of the year: a one-of-a-kind book starring your child.',
  },
  {
    icon: '🎁',
    title: 'Baby shower & new arrival',
    desc: 'A personalized book to celebrate a new baby — unique, personal, and instantly shareable.',
  },
  {
    icon: '🏠',
    title: 'Bedtime routine',
    desc: 'A custom story read every night, with characters your child recognizes and loves.',
  },
  {
    icon: '✈️',
    title: 'Travel & keepsake',
    desc: 'Capture a trip or special moment in a book your child can keep growing up with.',
  },
  {
    icon: '🎓',
    title: 'School & learning',
    desc: 'GRL A-E leveled text turns story time into reading practice — personalized and educational.',
  },
]

const HOW_IT_WORKS = [
  { step: '1', title: 'Tell us your story idea', desc: 'A birthday adventure, a holiday journey, or a bedtime theme — just type a sentence.' },
  { step: '2', title: 'Add your child as the hero', desc: 'Describe your child or upload a photo. We create a character reference that stays consistent.' },
  { step: '3', title: 'Pick a reading level', desc: 'GRL A–E so the words match your child\'s reading ability and grow with them.' },
  { step: '4', title: 'Get a beautiful finished book', desc: 'SproutTales writes the story, illustrates every page, and exports a print-ready PDF.' },
]

const FAQS = [
  {
    q: 'What makes a personalized children\'s book special?',
    a: 'A personalized children\'s book features your child as the main character, with a custom story tailored to their name, interests, and experiences. Unlike generic storybooks, it creates an emotional connection that makes reading time unforgettable.',
  },
  {
    q: 'Can I use my child\'s real photo in the book?',
    a: 'Yes. Upload a photo and SproutTales builds a stylized character card that looks like your child while keeping the illustration style consistent throughout. We also offer a text-only option if you prefer not to use any real photos.',
  },
  {
    q: 'Is it safe to upload my child\'s photo?',
    a: 'Absolutely. We give you full control over how your child\'s image is used. You can choose a text-only character or a photo-based one, and we never share or train on uploaded images.',
  },
  {
    q: 'How long does it take to create a personalized book?',
    a: 'From idea to finished book takes about 10 minutes. The AI writes the story, generates consistent illustrations for every page, and formats a print-ready PDF — all in one session.',
  },
  {
    q: 'Can I print the book myself or use Amazon KDP?',
    a: 'Yes. We export two spec-compliant PDFs — an interior trim file and a full-wrap cover ready for Amazon KDP. You can also send the files to any local printer or use them for digital sharing.',
  },
  {
    q: 'What age range is this suitable for?',
    a: 'Our GRL A–E reading levels cover ages 3–10. Picture books (GRL A–C) are ideal for read-aloud sessions, while early readers (GRL D–E) let kids start decoding the text themselves.',
  },
  {
    q: 'Do personalized books make good gifts?',
    a: 'They are consistently rated among the most meaningful gifts parents give. A book starring your child — with their name, their face, their adventure — is something they keep long after the wrapping paper is gone.',
  },
]

const ArticleSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: TITLE,
  description: DESCRIPTION,
  url: `${SITE_URL}/personalized-childrens-books`,
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

export default function PersonalizedBooksPage() {
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
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 md:pt-16 text-center">
        <div className="bunny-bounce mb-4 inline-block">
          <BunnyMascot size={64} />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto leading-[1.1]">
          Personalized{' '}
          <span className="bunny-text-gradient">Children&apos;s Books</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          Create a one-of-a-kind storybook where your child is the hero. AI-written, consistently illustrated, and ready to print — perfect for birthdays, Christmas, and every special moment.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link href="/create" className="apple-button text-base px-8 py-3.5 text-center">
            Make a Personalized Book →
          </Link>
          <Link href="/pricing" className="apple-button-secondary text-base px-8 py-3.5 text-center">
            View Plans
          </Link>
        </div>
      </section>

      {/* Occasions */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
            Perfect for every occasion
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {OCCASIONS.map((item) => (
              <div key={item.title} className="apple-card p-6">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-[#2D2D2D] mb-1">{item.title}</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
          How it works
        </h2>
        <div className="space-y-4">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="apple-card p-5 flex gap-4 items-start">
              <div className="w-9 h-9 rounded-full bunny-gradient text-white font-bold flex-shrink-0 flex items-center justify-center text-sm">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-[#2D2D2D]">{item.title}</h3>
                <p className="text-sm text-[#8E8E93] mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2D2D2D] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Give the gift of a story where they&apos;re the hero
          </h2>
          <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
            Start free with one book. Upgrade anytime for KDP export and unlimited styles.
          </p>
          <Link href="/create" className="apple-button text-base px-8 py-3.5 inline-block bg-white text-[#2D2D2D] hover:bg-[#F5F5F7]">
            Start Creating Free →
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
