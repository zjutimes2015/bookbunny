import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'
import { softwareApplicationJsonLd } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'SproutTales pricing: Free, Starter at $12/month, Creator at $29/month and Studio at $59/month. Every plan includes a monthly book allowance, and optional 5-book credit packs never expire.',
  alternates: { canonical: `${SITE_URL}/pricing` },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd()) }}
      />
      {children}
    </>
  )
}
