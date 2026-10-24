import type { Metadata } from 'next'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import { refundPolicySections } from '@/lib/legal/refund-policy'
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY,
  POLICY_VERSION,
  REFUND_WINDOW_DAYS,
  SITE_NAME,
  SITE_URL,
} from '@/lib/site'

const TITLE = `Refund Policy — ${SITE_NAME}`
const DESCRIPTION = `How ${SITE_NAME} refunds work for parents and guardians: eligibility, the ${REFUND_WINDOW_DAYS}-day window, how to request a refund, and why used credits and generated books are not refundable.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/refunds` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/refunds`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} refund policy`,
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
    'refund policy children books',
    'subscription refund',
    'credit pack refund',
    `${SITE_NAME} refunds`,
  ],
}

export default function RefundsPage() {
  return (
    <div className="min-h-screen">
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 text-center">
        <div className="bunny-bounce mb-4 inline-block">
          <BunnyMascot size={64} />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto leading-[1.1]">
          Refund <span className="bunny-text-gradient">Policy</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          Who can ask for a refund on {SITE_NAME}, the {REFUND_WINDOW_DAYS}-day limit, how to
          request one, and what happens after a credit is used or a book has already been generated.
        </p>
        <p className="mt-4 text-sm text-[#8E8E93]">Effective date: {POLICY_VERSION}</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-6">
          {refundPolicySections().map((section, index) => (
            <div key={section.id} id={section.id} className="apple-card p-8">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">
                <span className="text-[#FF6B8A]">{index + 1}.</span> {section.title}
              </h2>
              <div className="space-y-3 text-sm text-[#8E8E93] leading-relaxed">{section.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="apple-card p-8">
          <p className="text-sm text-[#2D2D2D] leading-relaxed">
            This page describes our refund rules. It is not legal advice. Questions about a charge
            can be sent to{' '}
            <a
              href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=Refund%20request`}
              className="text-[#FF6B8A] font-medium"
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
            .
          </p>
          <p className="mt-4 text-sm text-[#8E8E93] leading-relaxed">
            {LEGAL_ENTITY} operates {SITE_NAME}. See also our{' '}
            <Link href="/terms" className="text-[#FF6B8A] font-medium">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[#FF6B8A] font-medium">
              Privacy Policy
            </Link>
            , or return to the{' '}
            <Link href="/" className="text-[#FF6B8A] font-medium">
              {SITE_NAME} home page
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
