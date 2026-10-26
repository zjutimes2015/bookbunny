import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'AI Picture Book Generator Pricing — Free Plan, $29/mo Creator, $79/mo Studio'
const DESCRIPTION =
  'Transparent AI picture book generator pricing. Free plan: 1 book/month. Creator $29/mo (8 books, KDP export, 12 pages). Studio $79/mo (22 books, batch generation). Pro Animation Packs from $55. No expiring credits.'

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
        alt: 'SproutTales pricing — AI picture book generator plans',
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
    'ai picture book generator pricing',
    'ai storybook generator free',
    'children book generator cost',
    'kdp picture book generator pricing',
    'personalized childrens book price',
    'ai childrens book subscription',
    'SproutTales pricing',
  ],
  robots: { index: true, follow: true },
}

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
