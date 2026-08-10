import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'

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
    </div>
  )
}
