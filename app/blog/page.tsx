import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Blog — Parent & Teacher Guides | SproutTales',
  description:
    'Practical guides for parents and teachers: reading levels, bedtime stories, sight words, Amazon KDP publishing, and making personalized picture books with AI.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
    title: 'Blog — Parent & Teacher Guides | SproutTales',
    description:
      'Practical guides for parents and teachers: reading levels, bedtime stories, sight words, Amazon KDP publishing, and making personalized picture books with AI.',
  },
}

interface Post {
  slug: string
  title: string
  description: string
  date: string
  section: string
}

const POSTS: Post[] = [
  {
    slug: 'benefits-of-reading-aloud-to-children',
    title: 'Benefits of Reading Aloud to Children: What 20 Minutes a Day Actually Does',
    description:
      'Reading aloud 20 minutes a day exposes kids to 1.8M words a year. Learn the science-backed benefits of reading aloud — and how personalized books make it stick. Free to start.',
    date: 'Nov 4, 2026',
    section: 'Parenting Guide',
  },
  {
    slug: 'how-to-choose-picture-books-by-age',
    title: 'How to Choose Picture Books by Age: A Simple Guide for Ages 0–8',
    description:
      'What makes a good picture book for a 2-year-old vs a 6-year-old? Age-by-age guide to choosing picture books — length, vocabulary, themes — plus how to match reading level.',
    date: 'Nov 4, 2026',
    section: 'Parenting Guide',
  },
  {
    slug: 'personalized-bedtime-stories-for-kids',
    title: "Personalized Bedtime Stories for Kids: Why Your Child's Name in the Story Works",
    description:
      "Personalized bedtime stories with your child's name as the hero hold attention 3x longer. Learn why it works and how to create one free with AI — same character on every page.",
    date: 'Nov 4, 2026',
    section: 'Parenting Guide',
  },
  {
    slug: 'personalized-book-gift-grandchild',
    title: 'The Personalized Book Gift Grandparents Love: Starring Their Grandchild',
    description:
      'The best personalized gift for a grandchild: a printed picture book with their name and likeness as the hero. Create it in minutes, print it in days — free to start.',
    date: 'Nov 4, 2026',
    section: 'Gift Guide',
  },
  {
    slug: 'reluctant-readers-love-books',
    title: 'My Child Hates Reading: 7 Ways Personalized Books Turn Reluctant Readers Around',
    description:
      'Is your child a reluctant reader? Discover 7 proven ways personalized picture books — with your child as the hero — rebuild reading motivation. Free plan, no credit card.',
    date: 'Nov 4, 2026',
    section: 'Parenting Guide',
  },
  {
    slug: 'sight-words-kindergarten-guide',
    title: "Sight Words for Kindergarten: A Parent's Starter Guide (With First 25 Words)",
    description:
      'What are sight words and which should your kindergartener learn first? A parent-friendly guide with the first 25 words, practice tips, and books that reinforce them.',
    date: 'Nov 4, 2026',
    section: 'Early Literacy',
  },
  {
    slug: 'grl-reading-levels-explained',
    title: 'GRL Reading Levels A–E Explained: Pick the Right Level for Your Child',
    description:
      'What are GRL reading levels A through E? A parent and teacher guide to Guided Reading Levels — what each level means, how to spot your child’s level, and how SproutTales matches every book to it.',
    date: 'Nov 3, 2026',
    section: 'Reading Guide',
  },
  {
    slug: 'publish-childrens-book-amazon-kdp',
    title: 'How to Publish a Children’s Book on Amazon KDP: 2026 Checklist',
    description:
      'Publish your children’s picture book on Amazon KDP in 7 steps: manuscript and cover specs, ISBN options, pricing and royalty choices, and the mistakes that get books rejected.',
    date: 'Nov 3, 2026',
    section: 'Publishing Guide',
  },
  {
    slug: 'how-to-make-a-childrens-book',
    title: "How to Make a Children's Book with AI — 8 Steps to a Printable Book",
    description:
      "Learn how to make a children's book with AI in 8 steps: a consistent character on every page, GRL A–E leveled text, and print-ready Amazon KDP PDFs. Free plan — no credit card.",
    date: 'Mar 1, 2026',
    section: 'How-to Guide',
  },
]

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 md:pt-16 text-center">
        <p className="text-sm text-[#8E8E93] font-medium uppercase tracking-widest mb-3">Blog</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto leading-[1.1]">
          Guides for <span className="bunny-text-gradient">parents & teachers</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          Reading levels, bedtime stories, sight words, and publishing — practical guides to
          helping kids fall in love with reading.
        </p>
      </section>

      {/* Article list */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-5">
          {POSTS.map((post) => (
            <article key={post.slug} className="apple-card p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8E8E93] mb-2">
                <span className="font-semibold text-[#FF6B8A] uppercase tracking-wide">{post.section}</span>
                <span aria-hidden="true">·</span>
                <time>{post.date}</time>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2D2D2D] leading-snug">
                <Link href={`/blog/${post.slug}`} className="hover:text-[#FF6B8A] transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[#545558]">{post.description}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-3 inline-block text-sm font-medium text-[#FF6B8A] hover:opacity-80"
              >
                Read the guide →
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[#545558] mb-4">Ready to make your first book?</p>
          <Link href="/create" className="apple-button text-base px-8 py-3.5">
            Try It Free →
          </Link>
        </div>
      </section>
    </div>
  )
}
