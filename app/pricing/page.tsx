import { Fragment } from 'react'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'

type MatrixValue = string | boolean

interface MatrixRow {
  label: string
  starter: MatrixValue
  pro: MatrixValue
  commercial: MatrixValue
}

/** Feature-by-feature comparison matrix, derived from the plan feature lists */
const MATRIX: { title: string; rows: MatrixRow[] }[] = [
  {
    title: 'Create',
    rows: [
      { label: 'Book library', starter: 'Preview only', pro: 'Unlimited', commercial: 'Unlimited' },
      { label: 'Pages per book', starter: '3 preview pages', pro: 'Up to 20', commercial: 'Up to 20' },
      { label: 'Picture-book art styles', starter: '1 style', pro: 'All styles', commercial: 'All styles' },
      { label: 'Photo-to-character', starter: false, pro: true, commercial: true },
    ],
  },
  {
    title: 'Learn',
    rows: [
      { label: 'Leveled reading (GRL A–E)', starter: false, pro: true, commercial: true },
      { label: 'Vocabulary matched to level', starter: false, pro: true, commercial: true },
      { label: 'Comprehension questions', starter: false, pro: true, commercial: true },
      { label: 'Reading journey & progress', starter: false, pro: true, commercial: true },
    ],
  },
  {
    title: 'Publish & share',
    rows: [
      { label: 'KDP-ready PDF export', starter: false, pro: true, commercial: true },
      { label: 'Commercial rights', starter: false, pro: false, commercial: true },
      { label: 'Multi-character books', starter: false, pro: false, commercial: true },
      { label: 'Video export', starter: false, pro: false, commercial: 'Coming soon' },
      { label: 'Priority support', starter: false, pro: false, commercial: true },
    ],
  },
]

const COLUMNS = ['Starter', 'Pro', 'Commercial']

function MatrixCell({ value, highlight }: { value: MatrixValue; highlight: boolean }) {
  const base = highlight ? 'bg-[#FFF9F7]' : ''
  if (value === true) return <td className={`px-4 py-3 text-center ${base}`}><span className="text-[#FF6B8A] font-semibold">✓</span></td>
  if (value === false) return <td className={`px-4 py-3 text-center ${base}`}><span className="text-[#C7C7CC]">—</span></td>
  return <td className={`px-4 py-3 text-center text-[#2D2D2D] ${base} ${highlight ? 'font-medium' : ''}`}>{value}</td>
}

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: '',
      desc: 'Try before you buy',
      features: ['Preview 3 book pages', '1 character style', 'Basic story generation'],
      cta: 'Try Free',
      featured: false,
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: '/month',
      desc: 'For parents & creators',
      features: [
        'Leveled reading (GRL A–E)',
        'Vocabulary matched to level',
        'Comprehension questions',
        'Reading journey & progress',
        'Unlimited books',
        'Photo-to-character',
        '20-page books',
        'KDP-ready PDF export',
        'All art styles',
      ],
      cta: 'Create Stories',
      featured: true,
    },
    {
      name: 'Commercial',
      price: '$49',
      period: '/month',
      desc: 'For publishing businesses',
      features: ['Everything in Pro', 'Commercial rights', 'Multi-character books', 'Video export (coming soon)', 'Priority support'],
      cta: 'Go Commercial',
      featured: false,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <BunnyMascot size={60} />
        <h1 className="text-3xl sm:text-4xl font-bold text-[#2D2D2D] mt-4">Simple Pricing</h1>
        <p className="text-[#8E8E93] mt-2">No credits, no hidden fees. Just create.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className={`apple-card p-8 flex flex-col ${plan.featured ? 'ring-2 ring-[#FF6B8A] scale-[1.02]' : ''}`}>
            {plan.featured && (
              <div className="text-xs font-semibold text-[#FF6B8A] bg-[#FFF5EE] px-3 py-1 rounded-full self-start mb-3">
                Most Popular
              </div>
            )}
            <h3 className="text-lg font-semibold text-[#2D2D2D]">{plan.name}</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-[#8E8E93] text-sm">{plan.period}</span>
            </div>
            <p className="text-sm text-[#8E8E93] mt-1">{plan.desc}</p>
            <ul className="mt-6 space-y-3 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="text-sm text-[#2D2D2D] flex items-center gap-2">
                  <span className="text-[#FF6B8A]">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/create"
              className={`mt-8 text-center text-sm font-medium px-5 py-3 rounded-xl transition-all ${
                plan.featured
                  ? 'bg-[#2D2D2D] text-white hover:opacity-85'
                  : 'bg-[#F2F2F7] text-[#2D2D2D] hover:bg-[#E5E5EA]'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
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
                  <th className="w-2/5 px-5 py-4 text-left font-semibold text-[#2D2D2D]">Feature</th>
                  {COLUMNS.map((name, i) => (
                    <th
                      key={name}
                      className={`px-4 py-4 text-center font-semibold ${i === 1 ? 'text-[#FF6B8A]' : 'text-[#2D2D2D]'}`}
                    >
                      {name}
                      {i === 1 && (
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
                        <MatrixCell value={row.starter} highlight={false} />
                        <MatrixCell value={row.pro} highlight />
                        <MatrixCell value={row.commercial} highlight={false} />
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
