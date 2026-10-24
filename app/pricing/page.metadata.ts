import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = "Pricing — Free & Paid Plans for AI Children's Books | SproutTales"
const DESCRIPTION =
  'SproutTales pricing: Free plan (1 book), Starter $12/mo, Creator $29/mo with KDP export and commercial license, Studio $59/mo. Optional credit packs never expire. Annual billing saves up to 25%.'

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
