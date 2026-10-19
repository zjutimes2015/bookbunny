import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="flex flex-col items-center text-center">
          {/* Bunny + Badge */}
          <div className="bunny-bounce mb-6">
            <BunnyMascot size={100} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5EE] border border-[#FFDAB9] text-sm text-[#FF6B8A] font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FF6B8A]" />
            Leveled Reading · GRL A–E · AI Children&apos;s Books
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl leading-[1.08]">
            Books That Match{' '}
            <span className="bunny-text-gradient">Your Child&apos;s Reading Level</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-[#8E8E93] max-w-xl leading-relaxed">
            Create personalized leveled readers — vocabulary and sentences matched to GRL A–E,
            with comprehension questions built in. Every book stars your child.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="/create"
              className="apple-button text-base px-8 py-3.5 text-center"
            >
              Create Your First Book Free →
            </Link>
            <Link
              href="/pricing"
              className="apple-button-secondary text-base px-8 py-3.5 text-center"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#2D2D2D] mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Pick a Reading Level', desc: 'Choose GRL A–E — from first words to confident readers. AI matches vocabulary and sentence length to your child&apos;s level.' },
            { step: '2', title: 'Star Your Child', desc: 'Upload a photo or describe a character. AI creates a consistent hero and writes a leveled story just for them.' },
            { step: '3', title: 'Read, Check, Grow', desc: 'Each book comes with comprehension questions and a reading journey that suggests the next level up.' },
          ].map((item) => (
            <div key={item.step} className="apple-card p-8 text-center">
              <div className="w-10 h-10 rounded-full bunny-gradient text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">
                {item.step}
              </div>
              <h3 className="font-semibold text-lg text-[#2D2D2D] mb-2">{item.title}</h3>
              <p className="text-sm text-[#8E8E93] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample Books */}
      <section className="bg-[#FAF0E6]/30 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-4">
            Ready to Create?
          </h2>
          <p className="text-[#8E8E93] mb-8 max-w-md mx-auto">
            Join thousands of parents and authors creating beautiful children&apos;s books.
          </p>
          <Link
            href="/create"
            className="apple-button text-base px-8 py-3.5 inline-block"
          >
            Start Creating Free
          </Link>
        </div>
      </section>

      {/* Why Families and Teachers Choose SproutTales */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#2D2D2D] mb-12">
          Why families and teachers choose SproutTales
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '∞', title: 'No credits, no expiry', desc: 'Flat pricing, unlimited books, and creations that never expire. No credit meter, no monthly reset.' },
            { icon: '📐', title: 'Print-ready for Amazon KDP', desc: 'Two separate spec-compliant PDFs — interior and full cover — with bleed, gutter and spine width handled for you.' },
            { icon: '📖', title: 'Reading levels that actually teach', desc: 'GRL A–E leveled text with matched vocabulary, comprehension questions and a reading-progress view.' },
          ].map((item) => (
            <div key={item.title} className="apple-card p-8 text-center">
              <div className="w-10 h-10 rounded-full bunny-gradient text-white flex items-center justify-center mx-auto mb-4 text-lg">
                {item.icon}
              </div>
              <h3 className="font-semibold text-lg text-[#2D2D2D] mb-2">{item.title}</h3>
              <p className="text-sm text-[#8E8E93] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
