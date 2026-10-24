import type { Metadata } from 'next'
import { Fragment, useState } from 'react'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'Pricing — Free & Paid Plans for AI Children\'s Books | SproutTales'
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

type MatrixValue = string | boolean

interface MatrixRow {
  label: string
  free: MatrixValue
  starter: MatrixValue
  creator: MatrixValue
  studio: MatrixValue
}

const MATRIX: { title: string; rows: MatrixRow[] }[] = [
  {
    title: 'Create',
    rows: [
      { label: 'Books per month', free: '1 book total', starter: '10', creator: '30', studio: '100' },
      { label: 'Pages per book', free: '8 pages', starter: 'Up to 12', creator: 'Up to 20', studio: 'Up to 24' },
      { label: 'Picture-book art styles', free: '3 styles', starter: 'All 15 styles', creator: 'All 15 styles', studio: 'All 15 styles' },
      { label: 'Characters per book', free: '1', starter: '3', creator: '5', studio: '5' },
      { label: 'Book languages', free: '1', starter: '2', creator: 'All 10', studio: 'All 10' },
      { label: 'Photo-to-character', free: false, starter: true, creator: true, studio: true },
      { label: 'Watermark-free pages', free: false, starter: true, creator: true, studio: true },
    ],
  },
  {
    title: 'Export & publish',
    rows: [
      { label: 'PDF export', free: 'Preview only', starter: true, creator: true, studio: true },
      { label: 'KDP interior + cover PDFs', free: false, starter: false, creator: true, studio: true },
      { label: 'Commercial license', free: false, starter: false, creator: true, studio: true },
      { label: 'Narration & background music', free: false, starter: false, creator: true, studio: true },
      { label: 'Batch generation', free: false, starter: false, creator: false, studio: true },
    ],
  },
  {
    title: 'Service',
    rows: [
      { label: 'Concurrent jobs', free: '1', starter: '1', creator: '2', studio: '3' },
      { label: 'Generation queue', free: 'Standard', starter: 'Standard', creator: 'Priority', studio: 'Priority' },
      { label: 'Support', free: 'Community', starter: 'Email', creator: 'Priority email', studio: 'Priority email' },
    ],
  },
]

const COLUMNS = ['Free', 'Starter', 'Creator', 'Studio'] as const

function MatrixCell({ value, highlight }: { value: MatrixValue; highlight: boolean }) {
  const base = highlight ? 'bg-[#FFF9F7]' : ''
  if (value === true) return <td className={`px-3 py-3 text-center ${base}`}><span className="text-[#FF6B8A] font-semibold">✓</span></td>
  if (value === false) return <td className={`px-3 py-3 text-center ${base}`}><span className="text-[#C7C7CC]">—</span></td>
  return <td className={`px-3 py-3 text-center text-[#2D2D2D] ${base} ${highlight ? 'font-medium' : ''}`}>{value}</td>
}

interface PlanCard {
  key: string
  name: string
  monthly: number
  annualTotal: number | null
  desc: string
  features: string[]
  cta: string
  checkout: boolean
  featured?: boolean
}

const PLANS: PlanCard[] = [
  {
    key: 'free',
    name: 'Free',
    monthly: 0,
    annualTotal: null,
    desc: 'Try the whole flow',
    features: [
      '1 book to explore the creator',
      '8-page book, 3 art styles',
      'Watermarked preview',
      '1 character, 1 language',
    ],
    cta: 'Start free',
    checkout: false,
  },
  {
    key: 'starter',
    name: 'Starter',
    monthly: 12,
    annualTotal: 108,
    desc: 'For families making books together',
    features: [
      '10 books per month',
      'Up to 12 pages per book',
      'No watermark · PDF export',
      '3 characters · 2 languages',
      'Photo-to-character',
      'All 15 art styles',
    ],
    cta: 'Choose Starter',
    checkout: true,
  },
  {
    key: 'creator',
    name: 'Creator',
    monthly: 29,
    annualTotal: 261,
    desc: 'For authors publishing on Amazon KDP',
    features: [
      '30 books per month',
      'Up to 20 pages per book',
      'KDP interior + cover PDFs',
      'Commercial license included',
      '5 characters · all 10 languages',
      'Narration & background music',
      'Priority queue',
    ],
    cta: 'Choose Creator',
    checkout: true,
    featured: true,
  },
  {
    key: 'studio',
    name: 'Studio',
    monthly: 59,
    annualTotal: 531,
    desc: 'For teams shipping books at volume',
    features: [
      '100 books per month',
      'Up to 24 pages per book',
      '3 concurrent generation jobs',
      'Batch generation',
      'Everything in Creator',
      'Priority support',
    ],
    cta: 'Choose Studio',
    checkout: true,
  },
]

function priceLabel(plan: PlanCard, annual: boolean) {
  if (plan.monthly === 0) return { amount: '$0', suffix: 'forever' }
  if (annual && plan.annualTotal) {
    const perMonth = plan.annualTotal / 12
    const amount = Number.isInteger(perMonth) ? `$${perMonth}` : `$${perMonth.toFixed(2)}`
    return { amount, suffix: `/mo · $${plan.annualTotal}/year` }
  }
  return { amount: `$${plan.monthly}`, suffix: '/month' }
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  const handleSelect = async (plan: PlanCard) => {
    if (!plan.checkout) {
      window.location.href = '/create'
      return
    }

    const planKey = plan.key === 'credits'
      ? 'credits_5'
      : annual ? `${plan.key}_annual` : `${plan.key}_monthly`
    setCheckingOut(plan.key)
    try {
      const res = await fetch('/api/payments/waffo-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      })
      if (res.status === 401) {
        window.location.href = '/api/auth/google?next=/pricing'
        return
      }
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url as string
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setCheckingOut(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <BunnyMascot size={60} />
        <h1 className="text-3xl sm:text-4xl font-bold text-[#2D2D2D] mt-4">Simple Pricing</h1>
        <p className="text-[#8E8E93] mt-2">Books your child will keep. Credits that never expire.</p>
      </div>

      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={`text-sm font-medium px-4 py-2 rounded-xl transition-all ${
            !annual ? 'bg-[#2D2D2D] text-white' : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-[#2D2D2D]'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setAnnual(true)}
          className={`text-sm font-medium px-4 py-2 rounded-xl transition-all ${
            annual ? 'bg-[#2D2D2D] text-white' : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-[#2D2D2D]'
          }`}
        >
          Annual
          <span className="ml-1.5 text-[11px] font-semibold text-[#FF6B8A]">Save up to 25%</span>
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const price = priceLabel(plan, annual)
          return (
            <div
              key={plan.name}
              className={`apple-card p-6 flex flex-col ${plan.featured ? 'ring-2 ring-[#FF6B8A] lg:-translate-y-1' : ''}`}
            >
              {plan.featured && (
                <div className="text-xs font-semibold text-[#FF6B8A] bg-[#FFF5EE] px-3 py-1 rounded-full self-start mb-3">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-[#2D2D2D]">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#2D2D2D]">{price.amount}</span>
                <span className="text-[#8E8E93] text-xs">{price.suffix}</span>
              </div>
              {annual && plan.annualTotal && (
                <p className="text-[11px] text-[#4A9E8E] mt-1">
                  ${plan.monthly * 12 - plan.annualTotal} saved per year
                </p>
              )}
              <p className="text-sm text-[#8E8E93] mt-1">{plan.desc}</p>
              <ul className="mt-5 space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-[#2D2D2D] flex items-start gap-2">
                    <span className="text-[#FF6B8A] mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleSelect(plan)}
                disabled={checkingOut !== null}
                className={`mt-6 text-center text-sm font-medium px-5 py-3 rounded-xl transition-all disabled:opacity-50 ${
                  plan.featured
                    ? 'bg-[#2D2D2D] text-white hover:opacity-85'
                    : 'bg-[#F2F2F7] text-[#2D2D2D] hover:bg-[#E5E5EA]'
                }`}
              >
                {checkingOut === plan.key ? 'Opening checkout…' : plan.cta}
              </button>
            </div>
          )
        })}
      </div>

      {/* Credit pack */}
      <div className="apple-card mt-6 p-6 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[#2D2D2D]">Need more books without a subscription?</h3>
          <p className="text-sm text-[#8E8E93] mt-1">
            Buy a 5-book credit pack for $9. Credits never expire — use them whenever inspiration strikes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleSelect({
            key: 'credits',
            name: '5-Book Credit Pack',
            monthly: 9,
            annualTotal: null,
            desc: '',
            features: [],
            cta: 'Buy 5 credits',
            checkout: true,
          })}
          disabled={checkingOut !== null}
          className="apple-button text-sm px-5 py-2.5 shrink-0 disabled:opacity-50"
        >
          {checkingOut === 'credits' ? 'Opening checkout…' : 'Buy 5 credits · $9'}
        </button>
      </div>

      {/* Feature comparison matrix */}
      <div className="mt-16">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#2D2D2D]">Compare every plan</h2>
          <p className="text-sm text-[#8E8E93] mt-1">The full breakdown, feature by feature.</p>
        </div>

        <div className="apple-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5EA]">
                  <th className="w-1/3 px-5 py-4 text-left font-semibold text-[#2D2D2D]">Feature</th>
                  {COLUMNS.map((name) => (
                    <th
                      key={name}
                      className={`px-3 py-4 text-center font-semibold ${
                        name === 'Creator' ? 'text-[#FF6B8A]' : 'text-[#2D2D2D]'
                      }`}
                    >
                      {name}
                      {name === 'Creator' && (
                        <span className="mt-0.5 block text-[10px] font-medium text-[#8E8E93]">Most popular</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((section) => (
                  <Fragment key={section.title}>
                    <tr className="bg-[#FAFAFB]">
                      <td
                        colSpan={5}
                        className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#8E8E93]"
                      >
                        {section.title}
                      </td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr key={row.label} className="border-b border-[#F2F2F7] last:border-0">
                        <td className="px-5 py-3 text-[#2D2D2D]">{row.label}</td>
                        <MatrixCell value={row.free} highlight={false} />
                        <MatrixCell value={row.starter} highlight={false} />
                        <MatrixCell value={row.creator} highlight />
                        <MatrixCell value={row.studio} highlight={false} />
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="text-center mt-10">
        <p className="text-xs text-[#8E8E93]">
          Cancel anytime. Credits never expire and are never resold as "unlimited".
        </p>
      </div>
    </div>
  )
}
