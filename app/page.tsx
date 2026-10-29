import type { Metadata } from 'next'
import Link from 'next/link'
import { AGE_BOOKS, AgeCover, AgeSpread } from '@/components/AgeBooks'
import HomeFaq from '@/components/HomeFaq'
import { KaiPortrait, LilaPortrait } from '@/components/BuddyPortraits'
import { SITE_URL, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: "AI Children's Picture Book Generator — Free Plan",
  description:
    'Picture books graded for ages 3–5, 5–7, and 7–10. Same character on every page, a read-aloud page video, and a print-ready PDF in one click. Free plan: 1 book/month, no credit card.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "AI Children's Picture Book Generator — SproutTales",
    description:
      'Three age bands, three different books. Play the pages as a video, or export a print-ready PDF in one click.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SproutTales — AI children\'s picture book generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "AI Children's Picture Book Generator — SproutTales",
    description:
      'Ages 3–5, 5–7, and 7–10 each get their own pictures and sentences. Page video and one-click PDF.',
    images: ['/twitter-image.png'],
  },
  keywords: [
    'AI picture book generator',
    'AI children book generator',
    'AI storybook generator',
    'make a children book with AI',
    'create a children book online',
    'AI picture book generator free',
    'personalized children book AI',
    'KDP picture book AI',
    'leveled reader AI GRL A-E',
    'age graded picture book',
    'children book video',
    'export picture book PDF',
    'character consistent AI illustration',
    'AI book creator for kids',
    'photo to character AI',
    'SproutTales',
  ],
  robots: {
    index: true,
    follow: true,
  },
}

const TIERS = [
  { name: 'Free', amount: '$0', note: '1 book a month · watermarked preview PDF', featured: false },
  { name: 'Creator', amount: '$29', note: 'per month · 8 books + one-click KDP PDFs', featured: true },
  { name: 'Studio', amount: '$79', note: 'per month · 22 books + batch generation', featured: false },
]

const LANGUAGES = ['EN', 'ZH', 'ZH-TW', 'ES', 'FR', 'DE', 'JA', 'KO', 'PT', 'IT']

const FAQS = [
  {
    q: 'Do older children get the same pictures as preschoolers?',
    a: 'No. Ages 3–5, 5–7, and 7–10 each get their own pictures and sentence length. A 7–10 book is an illustrated chapter, not a toddler picture book.',
  },
  {
    q: 'Can I turn the book into a video?',
    a: 'Yes. A Pro Animation Pack makes a read-aloud video of the pages, with voice and music, up to 8 pages. Packs are $55 for 5 books and never expire.',
  },
  {
    q: 'How do I export a PDF?',
    a: 'When the pages are finished, Download PDF saves the interior in one click. Creator and Studio also download the full KDP cover.',
  },
  {
    q: 'Is it safe to use my child\u2019s photo?',
    a: 'Photos are optional. A guardian account and recorded parental consent are required before any photo is processed, and consent can be withdrawn at any time.',
  },
  {
    q: 'Can I sell the books I make on Amazon KDP?',
    a: 'Yes on Creator and Studio. Those plans include two print-ready PDFs — interior and full cover — plus a commercial license.',
  },
  {
    q: 'What exactly is included in the free plan?',
    a: 'One complete 8-page book each month, graded to the age you pick, with a watermarked preview PDF and three art styles. Watermark-free PDF export starts on Creator.',
  },
]

const FEATURES = [
  {
    title: 'Three age bands',
    description: 'Ages 3–5, 5–7, and 7–10. Pictures, proportions, and sentences change with the age you pick.',
  },
  {
    title: 'Page video',
    description: 'Turn the finished pages into a read-aloud video with voice and music. A Pro Animation Pack covers up to 8 pages.',
  },
  {
    title: 'One-click PDF',
    description: 'Download PDF saves the interior the moment the pages are done. Creator and Studio add the full KDP cover.',
  },
  {
    title: 'Same character',
    description: 'Within one book, the child you describe stays the same from page 1 to the last spread.',
  },
  {
    title: 'Ten languages',
    description: 'One story, editions in EN, ZH, ZH-TW, ES, FR, DE, JA, KO, PT, and IT.',
  },
  {
    title: 'Photo, with consent',
    description: 'A guardian can turn a photo into a character. Photos are never required, and consent can be withdrawn.',
  },
]

const buttonClass =
  'rounded-md bg-black px-5 py-2 text-base font-semibold text-white transition duration-300 hover:bg-gray-800'

const displayClass = 'mb-4 text-2xl tracking-tighter text-gray-900 sm:text-3xl md:text-4xl lg:text-5xl'

function Split({
  copy,
  art,
}: {
  copy: React.ReactNode
  art: React.ReactNode
}) {
  return (
    <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 md:flex-row">
        <div className="order-2 w-full md:order-1 md:w-1/2">{copy}</div>
        <div className="order-1 flex w-full justify-center md:order-2 md:w-1/2 md:justify-end">{art}</div>
      </div>
    </section>
  )
}

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

export default function HomePage() {
  const [preschool, reader, chapter] = AGE_BOOKS

  return (
    <div className="bg-white" style={{ fontFamily: '"Inter Tight", Inter, system-ui, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

      <section className="mx-4 my-12 text-center sm:mx-8 md:mx-16 lg:mx-24 lg:my-20">
        <h1 className="mb-6 text-4xl tracking-tighter text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
          Three ages. Three different books.
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-xl font-light text-gray-600">
          Ages 3–5, 5–7, and 7–10 each get their own pictures and their own sentences.
          Play the pages as a video, or export a print-ready PDF in one click.
        </p>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          <Link href="/create" className={buttonClass}>
            Start free
          </Link>
          <Link href="/create" className={buttonClass}>
            Export PDF
          </Link>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3">
          {AGE_BOOKS.map((book) => (
            <article key={book.id} className="text-left">
              <AgeCover book={book} className="aspect-[4/3] w-full rounded-lg shadow-md" />
              <h2 className="mt-4 text-xl text-gray-900">{book.title}</h2>
              <p className="font-light text-gray-600">{book.grl} · {book.pages}</p>
              <p className="mt-2 text-sm font-light text-gray-800">“{book.sentence}”</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm font-light text-gray-500">
          <Link href="/pricing" className="underline decoration-gray-300 underline-offset-4 hover:decoration-black">
            Page video with voice and music
          </Link>
          <span className="mx-2">·</span>
          <Link href="/buddy" className="underline decoration-gray-300 underline-offset-4 hover:decoration-black">
            Or talk to Lila &amp; Kai
          </Link>
          <span className="mx-2">·</span>
          Free plan includes 1 book · No credit card
        </p>
      </section>

      <section className="container mx-auto rounded-lg bg-gray-50 px-4 py-12 transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl text-gray-900 sm:text-3xl md:text-4xl lg:text-5xl">Features</h2>
            <p className="mt-8 text-xl font-light text-gray-600">
              Pick an age. Get a book that looks and reads like that age, then play it or print it.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-2 text-xl font-semibold text-gray-800">{feature.title}</h3>
                <p className="font-light text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="samples" className="scroll-mt-24 container mx-auto px-4 py-16 md:px-6 md:py-24">
        <h2 className="mb-4 text-center text-3xl tracking-tighter text-gray-900 sm:text-4xl lg:text-5xl">
          One spread from each age
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-xl font-light text-gray-600">
          Preschool stays on one clear action. Early readers get a place and a choice. Ages 7–10 get an illustrated chapter.
        </p>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          {AGE_BOOKS.map((book) => (
            <article key={book.id} className="rounded-lg bg-white">
              <AgeSpread book={book} className="aspect-[4/3] w-full rounded-lg shadow-md" />
              <h3 className="mt-4 text-xl text-gray-900">{book.ages}</h3>
              <p className="font-light text-gray-800">“{book.sentence}”</p>
              <p className="mt-1 text-sm font-light text-gray-500">{book.style}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/create" className={buttonClass}>
            Export PDF
          </Link>
          <Link href="/pricing" className={buttonClass}>
            Make the page video
          </Link>
        </div>
      </section>

      <div className="w-full bg-black py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 md:flex-row md:justify-between md:px-8">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
              A page video. A PDF in one click. Ten languages.
            </h2>
            <p className="mt-4 text-sm font-light tracking-wide text-white/75">{LANGUAGES.join(' · ')}</p>
          </div>
          <div className="flex items-center gap-4">
            <LilaPortrait size={96} />
            <KaiPortrait size={96} />
          </div>
        </div>
      </div>

      <Split
        copy={<HomeFaq items={FAQS} />}
        art={
          <div className="flex flex-col items-center md:items-end">
            <h2 className={displayClass}>Ask Lila or Kai</h2>
            <p className="mb-6 text-xl font-light text-gray-600">
              Say the child&apos;s name, age, and story. They show the page count, reading level, and credit cost before anything is made.
            </p>
            <div className="flex items-end gap-4">
              <LilaPortrait size={140} />
              <KaiPortrait size={140} />
            </div>
            <Link href="/buddy" className={`${buttonClass} mt-6 inline-block`}>
              Talk to Lila &amp; Kai
            </Link>
          </div>
        }
      />

      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
        <h2 className="mb-10 text-center text-3xl tracking-tighter text-gray-900 sm:text-4xl lg:text-5xl">Simple pricing</h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg p-6 shadow-md ${tier.featured ? 'bg-black text-white' : 'bg-white text-gray-900'}`}
            >
              <p className={`text-sm font-light ${tier.featured ? 'text-white/70' : 'text-gray-500'}`}>{tier.name}</p>
              <p className="mt-2 text-4xl tracking-tighter">{tier.amount}</p>
              <p className={`mt-3 font-light ${tier.featured ? 'text-white/80' : 'text-gray-600'}`}>{tier.note}</p>
              {tier.featured && <p className="mt-4 text-sm font-semibold">Most parents start here</p>}
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm font-light text-gray-500">
          <Link href="/pricing" className="underline decoration-gray-300 underline-offset-4 hover:decoration-black">
            Compare all plans
          </Link>
          <span className="mx-2">·</span>
          Pro Animation Pack · 5 page videos for $55 · never expires
        </p>
      </section>

      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 md:flex-row">
          <div className="grid w-full max-w-md grid-cols-2 gap-3 md:w-1/2">
            <div className="col-span-2">
              <AgeSpread book={chapter} className="aspect-[4/3] w-full rounded-lg shadow-md" />
            </div>
            <AgeCover book={preschool} className="aspect-[4/3] w-full rounded-lg shadow-md" />
            <AgeCover book={reader} className="aspect-[4/3] w-full rounded-lg shadow-md" />
          </div>
          <div className="w-full md:w-1/2">
            <h2 className={displayClass}>Start with the age, then export</h2>
            <p className="mb-6 text-xl font-light text-gray-800">
              One complete book, no credit card. When the pages are done, Download PDF is one click. A Pro Animation Pack turns those pages into a video.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/create" className={buttonClass}>
                Export PDF
              </Link>
              <Link href="/pricing" className={buttonClass}>
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
