import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = "Pricing — Free, Creator $29, Studio $79 & Pro Animation Packs | SproutTales"
const DESCRIPTION =
  'SproutTales pricing: Free plan (1 book/month), Creator $29/mo with KDP export and commercial license, Studio $79/mo with 22 books. Pro Animation Packs $55 for 5 books or $100 for 10. Packs never expire. Annual billing saves up to 25%.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/pricing`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SproutTales pricing plans',
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
    'AI children book pricing',
    'picture book generator cost',
    'KDP book creator pricing',
    'children story app price',
    'SproutTales plans',
  ],
}
