'use client'

import { Fragment, useState } from 'react'
import BunnyMascot from '@/components/BunnyMascot'

type MatrixValue = string | boolean

interface MatrixRow {
  label: string
  free: MatrixValue
  creator: MatrixValue
  studio: MatrixValue
}

const MATRIX: { title: string; rows: MatrixRow[] }[] = [
  {
    title: 'Create',
    rows: [
      { label: 'Books per month', free: '1', creator: '8', studio: '22' },
      { label: 'Books per month (annual)', free: '1', creator: '6', studio: '16' },
      { label: 'Pro animated books', free: false, creator: 'Add-on packs', studio: 'Add-on packs' },
      { label: 'Pages per book', free: '8 pages', creator: 'Up to 12', studio: 'Up to 12' },
      { label: 'Picture-book art styles', free: '3 styles', creator: 'All 15 styles', studio: 'All 15 styles' },
      { label: 'Characters per book', free: '1', creator: '5', studio: '5' },
      { label: 'Book languages', free: '1', creator: 'All 10', studio: 'All 10' },
      { label: 'Photo-to-character', free: false, creator: true, studio: true },
    ],
  },
  {
    title: 'Export & publish',
    rows: [
      { label: 'PDF export', free: 'Preview only', creator: true, studio: true },
      { label: 'KDP interior + cover PDFs', free: false, creator: true, studio: true },
      { label: 'Commercial license', free: false, creator: true, studio: true },
      { label: 'Narration & background music', free: true, creator: true, studio: true },
      { label: 'Animated video (Wan 3 + voice + music)', free: false, creator: 'Add-on packs', studio: 'Add-on packs' },
      { label: 'Batched generation (5 pages at a time)', free: true, creator: true, studio: true },
    ],
  },
]

const COLUMNS = ['Free', 'Creator', 'Studio'] as const

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
  /** 月付时的每月本数 */
  books: number
  /** 年付时的每月本数（年付价格更低，额度按比例下调，见 lib/allocation.ts） */
  annualBooks: number
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
    books: 1,
    annualBooks: 1,
    desc: 'Try the whole flow',
    features: [
      '1 book per month',
      '8-page book, 3 art styles',
      'Read books in the app',
      '1 character, 1 language',
    ],
    cta: 'Start free',
    checkout: false,
  },
  {
    key: 'creator',
    name: 'Creator',
    monthly: 29,
    annualTotal: 261,
    books: 8,
    annualBooks: 6,
    desc: 'For authors publishing on Amazon KDP',
    features: [
      'Up to 12 pages per book',
      'KDP interior + cover PDFs',
      'Commercial license included',
      '5 characters · all 10 languages',
      'Narration & background music',
    ],
    cta: 'Choose Creator',
    checkout: true,
    featured: true,
  },
  {
    key: 'studio',
    name: 'Studio',
    monthly: 79,
    annualTotal: 711,
    books: 22,
    annualBooks: 16,
    desc: 'For teams shipping books at volume',
    features: [
      'Up to 12 pages per book',
      'Everything in Creator',
      'Batched generation',
      'Priority support',
    ],
    cta: 'Choose Studio',
    checkout: true,
  },
]

/** 一次性 Pro 动画面包（独立商品，不进订阅） */
interface PackCard {
  key: string
  name: string
  price: number
  books: number
  badge?: string
  /** 交付是否已上线；未上线时不允许购买，避免收了钱却没有成品 */
  available: boolean
}

const PRO_PACKS: PackCard[] = [
  { key: 'pro_anim_5', name: 'Pro Animation Pack', price: 55, books: 5, available: true },
  { key: 'pro_anim_10', name: 'Pro Animation Pack ×2', price: 100, books: 10, badge: 'Best value', available: true },
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

/** 当前计费周期下的每月本数（年付额度按比例下调） */
function booksLabel(plan: PlanCard, annual: boolean) {
  const n = annual ? plan.annualBooks : plan.books
  return `${n} ${n === 1 ? 'book' : 'books'} per month`
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  const handleSelect = async (planKey: string, displayKey: string) => {
    setCheckingOut(displayKey)
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

  const selectPlan = (plan: PlanCard) => {
    if (!plan.checkout) {
      window.location.href = '/create'
      return
    }
    handleSelect(annual ? `${plan.key}_annual` : `${plan.key}_monthly`, plan.key)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <BunnyMascot size={60} />
        <h1 className="text-3xl sm:text-4xl font-bold text-[#2D2D2D] mt-4">Simple Pricing</h1>
        <p className="text-[#8E8E93] mt-2">Books your child will keep. Packs that never expire.</p>
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                <li className="text-sm text-[#2D2D2D] flex items-start gap-2">
                  <span className="text-[#FF6B8A] mt-0.5">✓</span>
                  <span>{booksLabel(plan, annual)}</span>
                </li>
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-[#2D2D2D] flex items-start gap-2">
                    <span className="text-[#FF6B8A] mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => selectPlan(plan)}
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

      {/* Pro Animation Packs */}
      <div id="pro-animation" className="apple-card mt-6 p-6 scroll-mt-24 ring-1 ring-[#C8A2E8]/30">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-[#2D2D2D]">✨ Pro Animation Packs</h3>
          <span className="text-[10px] font-semibold text-white bg-[#7B3FBF] px-2 py-0.5 rounded-full">Add-on</span>
        </div>
        <p className="text-sm text-[#8E8E93] mt-1">
          Turn any finished book into an animated video with AI voiceover and original music.
          One-time purchase, never expires. Works with every plan. Each book animates up to 8 pages.
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          {['Wan 3 video clips per page', 'Inworld TTS 2 voiceover', 'MiniMax original music'].map((f) => (
            <li key={f} className="text-xs text-[#2D2D2D] flex items-center gap-1.5">
              <span className="text-[#C8A2E8]">✓</span> {f}
            </li>
          ))}
        </ul>

        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          {PRO_PACKS.map((pack) => (
            <div
              key={pack.key}
              className={`rounded-2xl border p-5 flex items-center justify-between gap-4 ${
                pack.badge ? 'border-[#7B3FBF]/40 bg-[#7B3FBF]/[0.04]' : 'border-[#E5E5EA]'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#2D2D2D]">{pack.books} animated books</span>
                  {pack.badge && (
                    <span className="text-[10px] font-semibold text-[#7B3FBF] bg-[#C8A2E8]/20 px-2 py-0.5 rounded-full">
                      {pack.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8E8E93] mt-1">
                  ${(pack.price / pack.books).toFixed(2)} per animated book · never expires
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSelect(pack.key, pack.key)}
                disabled={checkingOut !== null || !pack.available}
                className="text-sm font-medium px-4 py-2.5 rounded-xl shrink-0 text-white bg-[#7B3FBF] hover:bg-[#6A2FB0] transition-all disabled:opacity-50"
              >
                {!pack.available
                  ? 'Coming soon'
                  : checkingOut === pack.key
                    ? 'Opening…'
                    : `Buy · $${pack.price}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Feature comparison matrix */}
      <div className="mt-16">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#2D2D2D]">Compare every plan</h2>
          <p className="text-sm text-[#8E8E93] mt-1">The full breakdown, feature by feature.</p>
        </div>

        <div className="apple-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm border-collapse">
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
                        colSpan={4}
                        className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#8E8E93]"
                      >
                        {section.title}
                      </td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr key={row.label} className="border-b border-[#F2F2F7] last:border-0">
                        <td className="px-5 py-3 text-[#2D2D2D]">{row.label}</td>
                        <MatrixCell value={row.free} highlight={false} />
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
          Cancel anytime. Pro Animation Packs never expire and are never resold as &quot;unlimited&quot;.
        </p>
      </div>
    </div>
  )
}
