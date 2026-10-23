import type { Metadata } from 'next'
import Link from 'next/link'
import {
  SITE_URL,
  SITE_NAME,
  LEGAL_CONTACT_EMAIL,
} from '@/lib/site'

const TITLE = 'Child Safety at SproutTales — Verifiable Parental Consent & COPPA Compliance'
const DESCRIPTION =
  'How SproutTales protects children: verifiable parental consent before any child photo or biometric data is processed, COPPA-aligned data minimization, and audit logs you can request.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/safety' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/safety`,
    siteName: SITE_NAME,
    type: 'website',
  },
}

const STRONG = 'text-[#2D2D2D] font-semibold'
const DOT = 'text-[#FF6B8A] mt-1.5'

type Feature = {
  icon: string
  title: string
  body: string
}

const FEATURES: Feature[] = [
  {
    icon: '🛡️',
    title: 'Verifiable parental consent — always first',
    body: 'Before any child photo, face, or biometric data is uploaded and processed, SproutTales requires verifiable parental consent. The parent completes a signed consent form, receives a confirmation email, and can withdraw consent at any time with one click.',
  },
  {
    icon: '🔒',
    title: 'Data minimization by design',
    body: 'We store only the minimum needed to make the book: character name and a ref image you chose. We never store full face recognition data, never sell child data, and our AI providers (OpenRouter) are contractually bound to do the same.',
  },
  {
    icon: '📋',
    title: 'Audit trail you can inspect',
    body: 'Every consent event, data use, and deletion request is logged with timestamps. Parents can request a full audit report of their child\'s data activity via privacy@sprouttales.com.',
  },
  {
    icon: '✏️',
    title: 'No photo — still make a book',
    body: 'SproutTales works perfectly without any child photo. Many families prefer a fully illustrated "look-alike" character instead of a real photo. We support both paths and make the choice transparent.',
  },
]

type Step = {
  n: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    n: '01',
    title: 'Parent initiates consent',
    body: 'When a parent adds a child photo, a consent gate appears. The parent must provide their own email and explicitly confirm they have custody or legal guardianship.',
  },
  {
    n: '02',
    title: 'Verified consent stored securely',
    body: 'Consent is stored with a timestamp, IP address, and signed audit record. It is separate from the child\'s creative data and only used to prove compliance.',
  },
  {
    n: '03',
    title: 'Processing proceeds only after confirmation',
    body: 'The image is uploaded to generation pipelines only after consent is confirmed. No child photo ever touches an AI endpoint without a stored consent record.',
  },
  {
    n: '04',
    title: 'Withdraw anytime',
    body: 'A parent can revoke consent and request deletion of all child-related data at any time. Deletion is completed within 72 hours and confirmed by email.',
  },
]

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5EE] via-white to-white">
      {/* Hero */}
      <section className="pt-20 pb-16 px-6 max-w-4xl mx-auto text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-[#FFE8EC] text-[#E4574F] text-xs font-semibold tracking-wide mb-5">
          CHILD SAFETY · COPPA ALIGNED
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-[-0.02em] text-[#2D2D2D]">
          We put <span className="text-[#E4574F]">safety</span> before the first story.
        </h1>
        <p className="mt-6 text-lg text-[#5A5A5A] leading-relaxed max-w-2xl mx-auto">
          SproutTales is designed from day one so a child&apos;s photo — or any biometric data —
          never reaches an AI endpoint without verifiable parental consent. This is not a checkbox
          feature. It is the first thing we built.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/create"
            className="px-5 py-3 rounded-full bg-[#E4574F] text-white text-sm font-semibold hover:bg-[#D0453C] transition-colors"
          >
            Start a safe picture book →
          </Link>
          <Link
            href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=Child%20data%20audit%20request`}
            className="px-5 py-3 rounded-full bg-white border border-[#E5E5EA] text-[#2D2D2D] text-sm font-semibold hover:bg-[#F5F5F7] transition-colors"
          >
            Request an audit report
          </Link>
        </div>
      </section>

      {/* Core commitments */}
      <section className="pb-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-10">
          Four non-negotiable commitments
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className={`${STRONG} text-lg mb-2`}>{f.title}</h3>
              <p className="text-sm text-[#5A5A5A] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Consent flow */}
      <section className="pb-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] text-center mb-3">
          How verifiable parental consent works
        </h2>
        <p className="text-center text-[#8E8E93] text-sm mb-10">
          Four-step flow — every step logged, every consent revocable.
        </p>
        <div className="relative">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex gap-5 mb-6 last:mb-0">
              <div className="flex-shrink-0 w-14 text-center">
                <div className="w-10 h-10 rounded-full bg-[#E4574F] text-white text-sm font-bold flex items-center justify-center mx-auto">
                  {step.n}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-px h-8 bg-[#E5E5EA] mx-auto mt-2" />
                )}
              </div>
              <div className="pt-1">
                <h3 className={`${STRONG} text-base mb-1`}>{step.title}</h3>
                <p className="text-sm text-[#5A5A5A] leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo placeholder */}
      <section className="pb-16 px-6 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-[#2D2D2D] text-center mb-6">
          Watch the consent flow (30 s demo)
        </h2>
        <div className="aspect-video rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA] flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-sm text-[#8E8E93]">
              Demo video placeholder — showing the consent gate in action.
            </p>
            <p className="text-xs text-[#B8B8BD] mt-2">
              Coming soon. In the meantime, start a book and see the flow yourself.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison strip */}
      <section className="pb-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-[#2D2D2D] text-center mb-8">
          How we compare
        </h2>
        <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
          <div className="grid grid-cols-4 text-xs font-semibold text-[#8E8E93] bg-[#FAFAFA] border-b border-[#E5E5EA]">
            <div className="p-3">Feature</div>
            <div className="p-3 text-center">SproutTales</div>
            <div className="p-3 text-center">Competitor A</div>
            <div className="p-3 text-center">Competitor B</div>
          </div>
          {[
            ['Verifiable parental consent before any child image processing', '✓ Built in', '⚠ Mentioned only', '✗ None'],
            ['Consent audit log + exportable report', '✓ Yes', '✗ No', '✗ No'],
            ['Delete all child data with one click', '✓ Yes', '⚠ Email only', '✗ No'],
            ['Works without any child photo', '✓ Look-alike characters', '✓ Yes', '✗ Photo-first'],
          ].map(([feature, ours, c1, c2], idx) => (
            <div
              key={idx}
              className={`grid grid-cols-4 text-sm border-b border-[#E5E5EA] last:border-b-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}
            >
              <div className="p-3 text-[#2D2D2D]">{feature}</div>
              <div className="p-3 text-center font-medium text-[#16A34A]">{ours}</div>
              <div className="p-3 text-center text-[#8E8E93]">{c1}</div>
              <div className="p-3 text-center text-[#8E8E93]">{c2}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#B8B8BD] text-center mt-3">
          Competitor columns represent the most common public-facing positions among AI picture-book tools as of mid-2026.
          They are illustrative, not a binding comparison of any named product.
        </p>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-[#2D2D2D] mb-3">Questions about child data?</h2>
        <p className="text-[#5A5A5A] text-sm mb-6 leading-relaxed">
          We publish our full privacy policy, a verifiable parental consent record, and are happy
          to walk through the flow on a quick call. Email{' '}
          <a className="text-[#E4574F] underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link
            href="/privacy"
            className="text-[#2D2D2D] border-b border-[#2D2D2D] hover:text-[#E4574F] hover:border-[#E4574F]"
          >
            Read our full privacy policy
          </Link>
          <Link
            href="/terms"
            className="text-[#2D2D2D] border-b border-[#2D2D2D] hover:text-[#E4574F] hover:border-[#E4574F]"
          >
            Terms of service
          </Link>
          <Link
            href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=Parental%20consent%20audit%20request`}
            className="text-[#2D2D2D] border-b border-[#2D2D2D] hover:text-[#E4574F] hover:border-[#E4574F]"
          >
            Request consent audit
          </Link>
        </div>
      </section>
    </div>
  )
}
