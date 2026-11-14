'use client'

import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import { REFUND_WINDOW_DAYS, SITE_NAME } from '@/lib/site'
import { readPricingGates } from './gates'

type MatrixValue = string | boolean

interface MatrixRow {
  label: string
  free: MatrixValue
  creator: MatrixValue
  studio: MatrixValue
  teacher: MatrixValue
}

const MATRIX: { title: string; rows: MatrixRow[] }[] = [
  {
    title: 'Create',
    rows: [
      { label: 'Books per month', free: '1', creator: '8', studio: '22', teacher: '40' },
      { label: 'Books per month (annual)', free: '1', creator: '6', studio: '16', teacher: '30' },
      { label: 'Pro animated books', free: false, creator: 'Add-on packs', studio: 'Add-on packs', teacher: 'Add-on packs' },
      { label: 'Pages per book', free: '8 pages', creator: 'Up to 16', studio: 'Up to 24', teacher: 'Up to 24' },
      { label: 'Picture-book art styles', free: '3 styles', creator: 'All 15 styles', studio: 'All 15 styles', teacher: 'All 15 styles' },
      { label: 'Characters per book', free: '1', creator: '5', studio: '5', teacher: '5' },
      { label: 'Book languages', free: '1', creator: 'All 10', studio: 'All 10', teacher: 'All 10' },
      { label: 'Photo-to-character', free: false, creator: true, studio: true, teacher: true },
    ],
  },
  {
    title: 'Export & publish',
    rows: [
      { label: 'PDF export', free: 'Watermarked preview', creator: true, studio: true, teacher: true },
      { label: 'KDP interior + cover PDFs', free: false, creator: true, studio: true, teacher: true },
      { label: 'Commercial license', free: false, creator: true, studio: true, teacher: true },
      { label: 'Narration & background music', free: true, creator: true, studio: true, teacher: true },
      { label: 'Animated video (Wan 3 + voice + music)', free: false, creator: 'Add-on packs', studio: 'Add-on packs', teacher: 'Add-on packs' },
      { label: 'Batched generation (5 pages at a time)', free: true, creator: true, studio: true, teacher: true },
    ],
  },
  {
    title: 'Teaching',
    rows: [
      { label: 'GRL A–E leveled text', free: '1 level', creator: 'All 5', studio: 'All 5', teacher: 'All 5' },
      { label: 'English learner (ELL) mode', free: false, creator: true, studio: true, teacher: true },
      { label: 'Vocabulary list export', free: false, creator: true, studio: true, teacher: true },
      { label: 'GRL score report export', free: false, creator: true, studio: true, teacher: true },
      { label: 'Student progress report', free: false, creator: false, studio: false, teacher: true },
      { label: 'Classroom sheets (worksheet-ready)', free: false, creator: false, studio: false, teacher: true },
    ],
  },
]

const COLUMNS = ['Free', 'Creator', 'Studio', 'Teacher'] as const

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
      'Up to 16 pages per book',
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
      'Up to 24 pages per book',
      'Everything in Creator',
      'Batched generation',
      'Priority support',
    ],
    cta: 'Choose Studio',
    checkout: true,
  },
  {
    key: 'teacher',
    name: 'Teacher',
    monthly: 99,
    annualTotal: 891,
    books: 40,
    annualBooks: 30,
    desc: 'For classrooms building leveled readers',
    features: [
      'Up to 24 pages per book',
      'GRL A–E leveled readers',
      'English learner (ELL) mode',
      'Vocabulary & score reports',
      'Student progress reports',
      'Classroom-ready sheets',
    ],
    cta: 'Choose Teacher',
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

/**
 * 年付总额：现有 25% 价用 plan.annualTotal；5 折开关开启时用月付 × 12 × 0.5
 *（由现有月付价算出，不新编价格）。Free 档返回 null。
 */
function annualTotalFor(plan: PlanCard, annual50: boolean): number | null {
  if (plan.monthly === 0) return null
  if (annual50) return plan.monthly * 12 * 0.5
  return plan.annualTotal
}

function priceLabel(plan: PlanCard, annual: boolean, annual50 = false) {
  if (plan.monthly === 0) return { amount: '$0', suffix: 'forever' }
  const annualTotal = annualTotalFor(plan, annual50)
  if (annual && annualTotal) {
    const perMonth = annualTotal / 12
    const amount = Number.isInteger(perMonth) ? `$${perMonth}` : `$${perMonth.toFixed(2)}`
    return { amount, suffix: `/mo · $${annualTotal}/year` }
  }
  return { amount: `$${plan.monthly}`, suffix: '/month' }
}

/** 当前计费周期下的每月本数（年付额度按比例下调） */
function booksLabel(plan: PlanCard, annual: boolean) {
  const n = annual ? plan.annualBooks : plan.books
  return `${n} ${n === 1 ? 'book' : 'books'} per month`
}

const PRICING_FAQS: { q: string; a: string }[] = [
  {
    q: 'Is there a free AI picture book generator?',
    a: 'Yes. The Free plan costs $0 forever and includes 1 complete book per month, 8 pages, 3 art styles, 1 character and 1 language. You can export a watermarked preview PDF. No credit card is required.',
  },
  {
    q: 'How much does an AI children\'s book cost?',
    a: 'Creator is $29/month for 8 books ($3.63 per book), or $261/year. Studio is $79/month for 22 books ($3.59 per book), or $711/year. Teacher is $99/month for 40 books, or $891/year. Pro Animation Packs are one-off: $55 for 5 animated books, $100 for 10.',
  },
  {
    q: 'Can I sell the books I make on Amazon KDP?',
    a: 'Yes on Creator, Studio and Teacher. Those plans include KDP interior and cover PDFs, a commercial licence, and no watermark.',
  },
  {
    q: 'Do my credits or books expire?',
    a: 'Books never expire and stay in your library. Plan allowances reset monthly, with 50% of the unused allowance rolling into the next cycle. Pro Animation Packs never expire.',
  },
  {
    q: 'How many pages can a book have?',
    a: 'Up to 8 pages on the Free plan, 16 pages on Creator, and 24 pages on Studio and Teacher. Books over 12 pages use 2 book credits because each extra illustrated page costs more to generate. Pro Animation Packs cover up to 8 pages per book. KDP exports are automatically padded to an even page count of at least 24.',
  },
  {
    q: 'What does the Teacher plan add?',
    a: 'Teacher is $99/month for 40 books of up to 24 pages, plus everything in Creator. It adds GRL A–E leveled vocabulary lists you can export per book, GRL score reports, shareable student progress reports, and classroom-ready sheets.',
  },
  {
    q: 'Can I make graded English books for a child learning English?',
    a: 'Yes. English learner (ELL) mode writes the story in English only — nothing is translated — but pitches the vocabulary and sentence length to the GRL level you pick, reuses the same core words across pages, avoids idioms and phrasal verbs, and draws every concrete noun in the illustration. The home language you select is used only to keep that language out of the text.',
  },
  {
    q: 'Is there an unlimited plan?',
    a: 'No. Every plan has a hard monthly book allowance and there is no unlimited tier, because each illustrated page has a real generation cost. Pro Animation Packs give extra volume without a subscription.',
  },
  {
    q: 'What is your refund policy?',
    a: `You can request a refund within ${REFUND_WINDOW_DAYS} days of the charge date, as long as you have not used the purchase — a subscription is refundable only when you have used none of that period's book allowance and generated no book during it, and a credit pack is refundable only when none of its credits have been used. Used credits and books that have already been generated are not refundable, and we do not give partial cash refunds for a partly used period or pack. If a charge never reached your account, we refund it even after ${REFUND_WINDOW_DAYS} days. Email privacy@sprouttales.com with the subject line "Refund request" and we acknowledge within two business days. Full details: the Refund Policy.`,
  },
]

/**
 * 「How much does an AI children's book cost?」的答案：年付总额随 5 折开关变化，
 * 其余数字（月付价、本数、每本价、Pro 包价）与现有文案一致，全部由 PLANS 算出。
 */
function costFaqAnswer(annual50: boolean): string {
  const byKey = Object.fromEntries(PLANS.map((p) => [p.key, p]))
  const creator = byKey.creator
  const studio = byKey.studio
  const teacher = byKey.teacher
  const perBook = (plan: PlanCard) => `$${(plan.monthly / plan.books).toFixed(2)}`
  return (
    `Creator is $${creator.monthly}/month for ${creator.books} books (${perBook(creator)} per book), ` +
    `or $${annualTotalFor(creator, annual50)}/year. ` +
    `Studio is $${studio.monthly}/month for ${studio.books} books (${perBook(studio)} per book), ` +
    `or $${annualTotalFor(studio, annual50)}/year. ` +
    `Teacher is $${teacher.monthly}/month for ${teacher.books} books, ` +
    `or $${annualTotalFor(teacher, annual50)}/year. ` +
    'Pro Animation Packs are one-off: $55 for 5 animated books, $100 for 10.'
  )
}

/** 开关关闭时返回 PRICING_FAQS 本身（零文案变化）；开启时只替换 cost 答案。 */
function faqsFor(annual50: boolean): { q: string; a: string }[] {
  if (!annual50) return PRICING_FAQS
  return PRICING_FAQS.map((item) =>
    item.q === "How much does an AI children's book cost?"
      ? { ...item, a: costFaqAnswer(true) }
      : item,
  )
}

function faqSchemaFor(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

export default function PricingPage() {
  // 功能开关在渲染时读取（便于测试切换；Next 会在构建时内联 NEXT_PUBLIC_ 变量）。
  const gates = readPricingGates({
    annualBillingEnabled: process.env.NEXT_PUBLIC_ANNUAL_BILLING_ENABLED,
    bookPacksEnabled: process.env.NEXT_PUBLIC_BOOK_PACKS_ENABLED,
  })
  // 5 折年付开启时默认选中 Yearly；关闭时与今天一样默认 Monthly。
  const [annual, setAnnual] = useState(gates.annualBilling50)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  // 哪些套餐已开售（后端建好商品才为 true）；null = 还没拉到
  const [purchasable, setPurchasable] = useState<Record<string, boolean> | null>(null)
  const faqs = faqsFor(gates.annualBilling50)
  const faqSchema = faqSchemaFor(faqs)

  useEffect(() => {
    fetch('/api/plans')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.plans) return
        const map: Record<string, boolean> = {}
        for (const p of d.plans) map[p.key] = p.purchasable
        setPurchasable(map)
      })
      .catch(() => {})
  }, [])

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

  /**
   * 套餐是否可下单：后端还没建好 Waffo 商品时置灰按钮，
   * 避免用户点到一个必然失败的结账页。拉取失败时保持可用（乐观假设）。
   */
  const isAvailable = (planKey: string): boolean =>
    !purchasable || purchasable[planKey] !== false

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
          <span className="ml-1.5 text-[11px] font-semibold text-[#FF6B8A]">
            {gates.annualBilling50 ? 'Save 50%' : 'Save up to 25%'}
          </span>
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const price = priceLabel(plan, annual, gates.annualBilling50)
          const planKey = annual ? `${plan.key}_annual` : `${plan.key}_monthly`
          // 5 折年付商品尚未创建：开关开启且选中 Yearly 时，年付按钮不可下单，
          // 避免用户按旧商品价（$261/$711/$891）被收费；月付不受影响。
          const annualComingSoon = gates.annualBilling50 && annual && plan.checkout
          const available = isAvailable(planKey) && !annualComingSoon
          const effectiveAnnualTotal = annualTotalFor(plan, gates.annualBilling50)
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
              {annual && effectiveAnnualTotal && (
                <p className="text-[11px] text-[#4A9E8E] mt-1">
                  ${plan.monthly * 12 - effectiveAnnualTotal} saved per year
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
                disabled={checkingOut !== null || !available}
                className={`mt-6 text-center text-sm font-medium px-5 py-3 rounded-xl transition-all disabled:opacity-50 ${
                  plan.featured
                    ? 'bg-[#2D2D2D] text-white hover:opacity-85'
                    : 'bg-[#F2F2F7] text-[#2D2D2D] hover:bg-[#E5E5EA]'
                }`}
              >
                {checkingOut === plan.key
                  ? 'Opening checkout…'
                  : !available
                    ? 'Coming soon'
                    : plan.cta}
              </button>
              {!available && (
                <p className="mt-2 text-[11px] text-[#8E8E93] text-center">
                  {annualComingSoon
                    ? 'New 50%-off annual billing is coming soon. Monthly billing is available now.'
                    : 'This plan is being prepared. Free and Creator are available now.'}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Rights ladder — what each tier can do with a finished book.
          Always visible (not gated): every claim mirrors the export gating in
          app/create (exportWatermark / canKdp). Free exports carry the
          'SproutTales Preview' watermark; Creator and above export without
          it, including the KDP full cover PDF and commercial license. */}
      <div className="apple-card mt-6 p-6">
        <h2 className="text-base font-bold text-[#2D2D2D]">What you can do with your books</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-[#2D2D2D]">Free</h3>
            <ul className="mt-2 space-y-2 text-sm text-[#8E8E93] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#FF6B8A]">•</span>
                <span>Read your books in the app.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#FF6B8A]">•</span>
                <span>Export a watermarked preview PDF.</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#2D2D2D]">Creator, Studio &amp; Teacher</h3>
            <ul className="mt-2 space-y-2 text-sm text-[#8E8E93] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#FF6B8A]">•</span>
                <span>PDF export with no watermark.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#FF6B8A]">•</span>
                <span>KDP interior + full cover PDFs, ready for Amazon KDP.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#FF6B8A]">•</span>
                <span>Commercial license included.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Book packs — gated by NEXT_PUBLIC_BOOK_PACKS_ENABLED. No Waffo products
          or prices exist for book packs yet, so the cards are coming-soon
          placeholders: no prices, no checkout. Do not wire checkout until
          products and plan keys exist. */}
      {gates.bookPacks && (
        <div id="book-packs" className="apple-card mt-6 p-6 scroll-mt-24">
          <h3 className="text-base font-semibold text-[#2D2D2D]">Book packs</h3>
          <p className="text-sm text-[#8E8E93] mt-1">
            Buy books one at a time, without a subscription. Book packs are coming soon —
            pricing is not final and nothing is on sale yet.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            {[
              { name: 'Single book', desc: 'One complete book, yours to keep.' },
              { name: '3-book pack', desc: 'Three books — a series, or one for each reader.' },
            ].map((pack) => (
              <div
                key={pack.name}
                className="rounded-2xl border border-[#E5E5EA] p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <span className="text-sm font-semibold text-[#2D2D2D]">{pack.name}</span>
                  <p className="text-xs text-[#8E8E93] mt-1">{pack.desc}</p>
                </div>
                <button
                  type="button"
                  disabled
                  className="text-sm font-medium px-4 py-2.5 rounded-xl shrink-0 bg-[#F2F2F7] text-[#8E8E93] disabled:opacity-70"
                >
                  Coming soon
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
          {PRO_PACKS.map((pack) => {
            const available = pack.available && isAvailable(pack.key)
            return (
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
                disabled={checkingOut !== null || !available}
                className="text-sm font-medium px-4 py-2.5 rounded-xl shrink-0 text-white bg-[#7B3FBF] hover:bg-[#6A2FB0] transition-all disabled:opacity-50"
              >
                {!available
                  ? 'Coming soon'
                  : checkingOut === pack.key
                    ? 'Opening…'
                    : `Buy · $${pack.price}`}
              </button>
            </div>
            )
          })}
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
            <table className="w-full min-w-[760px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5EA]">
                  <th className="w-1/4 px-5 py-4 text-left font-semibold text-[#2D2D2D]">Feature</th>
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
                      {name === 'Teacher' && (
                        <span className="mt-0.5 block text-[10px] font-medium text-[#8E8E93]">For classrooms</span>
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
                        <MatrixCell value={row.creator} highlight />
                        <MatrixCell value={row.studio} highlight={false} />
                        <MatrixCell value={row.teacher} highlight={false} />
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Refund summary — the review asked for the refund policy to be visible at the
          point of purchase, not only inside the Terms. */}
      <div className="mx-auto mt-10 max-w-3xl">
        <div className="apple-card p-6">
          <h2 className="text-base font-bold text-[#2D2D2D]">Refunds</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#8E8E93] leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[#FF6B8A]">•</span>
              <span>
                Request a refund within {REFUND_WINDOW_DAYS} days of the charge date. We acknowledge
                every request within two business days.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[#FF6B8A]">•</span>
              <span>
                A subscription is refundable only if you have used none of that billing
                period&apos;s allowance and generated no book during it. A credit pack is refundable
                only if none of its credits have been used.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[#FF6B8A]">•</span>
              <span>
                Credits already used and books already generated are not refundable, and we do not
                issue partial cash refunds for a partly used period or pack.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[#FF6B8A]">•</span>
              <span>
                If a charge never reached your account, we refund it even after{' '}
                {REFUND_WINDOW_DAYS} days.
              </span>
            </li>
          </ul>
          <p className="mt-3 text-sm text-[#8E8E93] leading-relaxed">
            Cancel anytime — cancelling stops the next renewal and you keep access until the end of
            the period you already paid for. Pro Animation Packs never expire and are never resold
            as &quot;unlimited&quot;.{' '}
            <Link href="/refunds" className="font-medium text-[#FF6B8A]">
              Read the full Refund Policy
            </Link>
            .
          </p>
        </div>
      </div>

      {/* FAQ — visible text so the answers are quotable by AI answer engines */}
      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="text-center text-2xl font-bold text-[#2D2D2D]">Pricing questions</h2>
        <p className="mt-2 text-center text-sm text-[#8E8E93]">
          What you actually get on each plan.
        </p>
        <div className="mt-6">
          {faqs.map((item) => (
            <details key={item.q} className="group border-b border-[#E5E5EA] py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#2D2D2D] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="shrink-0 text-[#8E8E93] group-open:hidden">+</span>
                <span className="hidden shrink-0 text-[#8E8E93] group-open:block">–</span>
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-[#8E8E93]">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
