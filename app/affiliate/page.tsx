import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import AffiliateClient from './affiliate-client'

const TITLE = 'Affiliate Program — Earn Recurring Commission'
const DESCRIPTION =
  'Earn 30% on the first payment and 15% recurring for every creator you refer to SproutTales. Real-time dashboard, 90-day attribution, PayPal/Stripe/Wise payouts.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/affiliate` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/affiliate`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} affiliate program`,
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
    'children book affiliate program',
    'AI tools affiliate',
    'parenting creator program',
    'recurring commission SaaS',
    'SproutTales affiliate',
  ],
}

export default function AffiliatePage() {
  return <AffiliateClient />
}
