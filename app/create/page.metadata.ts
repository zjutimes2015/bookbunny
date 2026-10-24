import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: "Create Your AI Children's Book — Picture Book Generator | SproutTales",
  description:
    'Start creating your child\'s personalized picture book with AI. Pick an age group, reading level (GRL A-E), art style, and character. Get consistent illustrations and a print-ready PDF. No credit card needed for the first book.',
  alternates: {
    canonical: `${SITE_URL}/create`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/create`,
    siteName: SITE_NAME,
    title: "Create Your AI Children's Book — SproutTales",
    description:
      'Start creating your child\'s personalized picture book with AI. Pick an age group, reading level (GRL A-E), art style, and character. No credit card needed.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: "SproutTales — Create AI children's picture book",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Create Your AI Children's Book — SproutTales",
    description:
      "Start creating your child's personalized picture book with AI. No credit card needed for the first book.",
    images: ['/twitter-image.png'],
  },
  keywords: [
    'create children book AI',
    'AI story generator',
    'illustrated book maker',
    'children story creator',
    'GRL leveled book',
    'Amazon KDP creator',
  ],
  robots: {
    index: false,
    follow: false,
  },
}
