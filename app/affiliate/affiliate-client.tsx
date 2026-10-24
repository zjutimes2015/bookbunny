'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { AFFILIATE_TIERS, MIN_PAYOUT_CENTS, buildReferralLink } from '@/lib/affiliate'

interface AffiliateAccount {
  code: string
  tier: keyof typeof AFFILIATE_TIERS
  status: string
  firstRate: number
  recurringRate: number
  payoutEmail: string | null
  payoutMethod: string
  createdAt: string
}

interface AffiliateStats {
  clicks: number
  clicks30d: number
  signups: number
  conversions: number
  earnings: {
    pendingCents: number
    approvedCents: number
    paidCents: number
    lifetimeCents: number
  }
  payableCents: number
  minPayoutCents: number
}

interface ReferralRow {
  id: string
  status: string
  email: string
  createdAt: string
  convertedAt: string | null
}

interface CommissionRow {
  id: string
  kind: string
  grossCents: number
  rate: number
  amountCents: number
  status: string
  createdAt: string
}

interface PayoutRow {
  id: string
  amountCents: number
  method: string
  reference: string
  status: string
  createdAt: string
  paidAt: string | null
}

interface AffiliatePayload {
  affiliate: AffiliateAccount | null
  stats?: AffiliateStats
  referrals?: ReferralRow[]
  commissions?: CommissionRow[]
  payouts?: PayoutRow[]
}

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`

const STAT_LABELS: { key: keyof AffiliateStats; label: string }[] = [
  { key: 'clicks', label: 'Link clicks' },
  { key: 'signups', label: 'Sign-ups' },
  { key: 'conversions', label: 'Paid customers' },
]

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#E5E5EA] bg-white p-6 ${className}`}>{children}</div>
  )
}

export default function AffiliateClient() {
  const { user, loading: authLoading, login } = useAuth()
  const [payload, setPayload] = useState<AffiliatePayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [origin, setOrigin] = useState('')

  const [payoutEmail, setPayoutEmail] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('paypal')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/affiliate/me')
      if (res.ok) {
        const data: AffiliatePayload = await res.json()
        setPayload(data)
        if (data.affiliate?.payoutEmail) setPayoutEmail(data.affiliate.payoutEmail)
        if (data.affiliate?.payoutMethod) setPayoutMethod(data.affiliate.payoutMethod)
      } else if (res.status === 401) {
        setPayload(null)
      } else {
        setError('Could not load your affiliate data. Please refresh.')
      }
    } catch {
      setError('Could not load your affiliate data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user) load()
  }, [authLoading, user, load])

  const referralLink = useMemo(() => {
    if (!payload?.affiliate || !origin) return ''
    return buildReferralLink(origin, payload.affiliate.code)
  }, [payload?.affiliate, origin])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/affiliate/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutEmail, payoutMethod }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not join the program.')
        return
      }
      await load()
    } catch {
      setError('Could not join the program. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePayout() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/affiliate/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: payoutMethod, reference: payoutEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not request a payout.')
        return
      }
      await load()
    } catch {
      setError('Could not request a payout.')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyLink() {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Copy failed — select the link and copy manually.')
    }
  }

  const affiliate = payload?.affiliate ?? null
  const stats = payload?.stats

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF0F4] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#FF6B8A]">
          Affiliate program
        </span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-[#2D2D2D] sm:text-5xl">
          Earn recurring income from every creator you refer
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#8E8E93]">
          Share SproutTales with parents, teachers and self-publishers. You earn{' '}
          <strong className="text-[#2D2D2D]">30% of the first payment</strong> and{' '}
          <strong className="text-[#2D2D2D]">15% of every renewal</strong> — with a 90-day
          cookie window and a real-time dashboard.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-[#8E8E93]">
          <span>90-day attribution</span>
          <span aria-hidden>·</span>
          <span>$50 minimum payout</span>
          <span aria-hidden>·</span>
          <span>PayPal / Stripe / Wise</span>
        </div>
      </section>

      {/* Signed-in dashboard */}
      {!authLoading && user && affiliate && stats && (
        <section className="mt-12 space-y-6">
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">
                  Your referral link
                </p>
                <p className="mt-1 font-mono text-sm text-[#2D2D2D] break-all">
                  {referralLink || '—'}
                </p>
                <p className="mt-2 text-xs text-[#8E8E93]">
                  Code <span className="font-semibold text-[#2D2D2D]">{affiliate.code}</span> ·{' '}
                  {AFFILIATE_TIERS[affiliate.tier]?.label ?? affiliate.tier} · {affiliate.firstRate}% first /{' '}
                  {affiliate.recurringRate}% recurring
                </p>
              </div>
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 rounded-xl bg-[#2D2D2D] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAT_LABELS.map(({ key, label }) => (
              <Card key={key}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">{label}</p>
                <p className="mt-2 text-3xl font-bold text-[#2D2D2D]">
                  {Number(stats[key] ?? 0)}
                </p>
              </Card>
            ))}
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">
                Lifetime earnings
              </p>
              <p className="mt-2 text-3xl font-bold text-[#2D2D2D]">
                {usd(stats.earnings.lifetimeCents)}
              </p>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">Pending</p>
              <p className="mt-2 text-2xl font-semibold text-[#2D2D2D]">
                {usd(stats.earnings.pendingCents)}
              </p>
              <p className="mt-1 text-xs text-[#8E8E93]">Clears after 30-day refund window</p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">Available</p>
              <p className="mt-2 text-2xl font-semibold text-[#2D2D2D]">
                {usd(stats.payableCents)}
              </p>
              <p className="mt-1 text-xs text-[#8E8E93]">Ready to withdraw</p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">Paid out</p>
              <p className="mt-2 text-2xl font-semibold text-[#2D2D2D]">
                {usd(stats.earnings.paidCents)}
              </p>
              <p className="mt-1 text-xs text-[#8E8E93]">Lifetime withdrawals</p>
            </Card>
          </div>

          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#2D2D2D]">Request a payout</h2>
                <p className="mt-1 text-sm text-[#8E8E93]">
                  Minimum {usd(MIN_PAYOUT_CENTS)}. Requests are reviewed within 2 business days.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePayout}
                disabled={
                  submitting ||
                  stats.payableCents < stats.minPayoutCents ||
                  (payload?.payouts ?? []).some((p) => p.status === 'requested')
                }
                className="rounded-xl bg-[#FF6B8A] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? 'Submitting…' : `Withdraw ${usd(stats.payableCents)}`}
              </button>
            </div>

            {(payload?.payouts ?? []).length > 0 && (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-[#8E8E93]">
                    <tr>
                      <th className="pb-2 font-semibold">Date</th>
                      <th className="pb-2 font-semibold">Amount</th>
                      <th className="pb-2 font-semibold">Method</th>
                      <th className="pb-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2F2F7]">
                    {(payload?.payouts ?? []).map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 text-[#8E8E93]">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 font-medium text-[#2D2D2D]">{usd(p.amountCents)}</td>
                        <td className="py-2 capitalize text-[#8E8E93]">{p.method}</td>
                        <td className="py-2 capitalize text-[#8E8E93]">{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="text-lg font-semibold text-[#2D2D2D]">Recent referrals</h2>
              {(payload?.referrals ?? []).length === 0 ? (
                <p className="mt-3 text-sm text-[#8E8E93]">
                  No sign-ups yet. Share your link to get started.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-[#F2F2F7] text-sm">
                  {(payload?.referrals ?? []).map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2.5">
                      <span className="text-[#2D2D2D]">{r.email}</span>
                      <span className="flex items-center gap-3 text-xs text-[#8E8E93]">
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${
                            r.status === 'converted'
                              ? 'bg-[#E8F7EE] text-[#1E9E5A]'
                              : 'bg-[#F2F2F7] text-[#8E8E93]'
                          }`}
                        >
                          {r.status === 'converted' ? 'Paid' : 'Signed up'}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-[#2D2D2D]">Recent commissions</h2>
              {(payload?.commissions ?? []).length === 0 ? (
                <p className="mt-3 text-sm text-[#8E8E93]">
                  Commissions appear here as soon as a referral makes a payment.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-[#F2F2F7] text-sm">
                  {(payload?.commissions ?? []).map((c) => (
                    <li key={c.id} className="flex items-center justify-between py-2.5">
                      <span className="text-[#2D2D2D]">
                        {usd(c.amountCents)}
                        <span className="ml-2 text-xs text-[#8E8E93]">
                          {c.rate}% of {usd(c.grossCents)} · {c.kind}
                        </span>
                      </span>
                      <span className="text-xs capitalize text-[#8E8E93]">{c.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </section>
      )}

      {/* Join form */}
      {!authLoading && user && payload && !affiliate && (
        <section className="mt-12">
          <Card className="mx-auto max-w-xl">
            <h2 className="text-xl font-bold text-[#2D2D2D]">Join the program</h2>
            <p className="mt-2 text-sm text-[#8E8E93]">
              Free to join. You will get a personal referral link, a real-time dashboard and a
              launch kit with demo videos and swipe copy.
            </p>
            <form onSubmit={handleJoin} className="mt-5 space-y-4">
              <div>
                <label htmlFor="payout-email" className="text-sm font-medium text-[#2D2D2D]">
                  Payout email
                </label>
                <input
                  id="payout-email"
                  type="email"
                  required
                  value={payoutEmail || user.email}
                  onChange={(e) => setPayoutEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-xl border border-[#E5E5EA] px-4 py-2.5 text-sm text-[#2D2D2D] outline-none focus:border-[#FF6B8A]"
                />
              </div>
              <div>
                <label htmlFor="payout-method" className="text-sm font-medium text-[#2D2D2D]">
                  Preferred payout method
                </label>
                <select
                  id="payout-method"
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E5E5EA] bg-white px-4 py-2.5 text-sm text-[#2D2D2D] outline-none focus:border-[#FF6B8A]"
                >
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="wise">Wise</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#2D2D2D] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {submitting ? 'Creating your account…' : 'Create my affiliate account'}
              </button>
            </form>
          </Card>
        </section>
      )}

      {/* Logged-out CTA + program details */}
      {!authLoading && !user && (
        <section className="mt-12">
          <Card className="mx-auto max-w-xl text-center">
            <h2 className="text-xl font-bold text-[#2D2D2D]">Sign in to get your link</h2>
            <p className="mt-2 text-sm text-[#8E8E93]">
              One click with Google. Your referral link and dashboard are ready immediately.
            </p>
            <button
              type="button"
              onClick={login}
              className="mt-5 rounded-xl bg-[#2D2D2D] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85"
            >
              Continue with Google
            </button>
          </Card>
        </section>
      )}

      {/* Tiers */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold text-[#2D2D2D]">Commission tiers</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-[#8E8E93]">
          Everyone starts on Rising Creator. Move up as your audience and conversions grow — rates
          apply to new payments from the day we upgrade you.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Object.values(AFFILIATE_TIERS).map((tier) => (
            <Card key={tier.id} className="flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#FF6B8A]">
                {tier.audience}
              </p>
              <h3 className="mt-2 text-xl font-bold text-[#2D2D2D]">{tier.label}</h3>
              <p className="mt-3 text-3xl font-extrabold text-[#2D2D2D]">
                {tier.firstRate}%<span className="ml-1 text-sm font-medium text-[#8E8E93]">first</span>
              </p>
              <p className="text-lg font-semibold text-[#2D2D2D]">
                {tier.recurringRate}%<span className="ml-1 text-sm font-medium text-[#8E8E93]">recurring</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[#8E8E93]">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex gap-2">
                    <span className="text-[#1E9E5A]">✓</span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold text-[#2D2D2D]">How it works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '1',
              title: 'Join free',
              body: 'Sign in and create your affiliate account — no application review.',
            },
            {
              step: '2',
              title: 'Share your link',
              body: 'Post it on YouTube, TikTok, a newsletter or your community.',
            },
            {
              step: '3',
              title: 'Earn 30% + 15%',
              body: 'We track for 90 days. You earn on the first payment and every renewal.',
            },
            {
              step: '4',
              title: 'Get paid',
              body: 'Commissions clear after 30 days, then withdraw from $50.',
            },
          ].map((item) => (
            <Card key={item.step}>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF0F4] text-sm font-bold text-[#FF6B8A]">
                {item.step}
              </span>
              <h3 className="mt-3 font-semibold text-[#2D2D2D]">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#8E8E93]">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Resource kit */}
      <section className="mt-16">
        <Card className="bg-[#FDFBF7]">
          <h2 className="text-xl font-bold text-[#2D2D2D]">Creator launch kit</h2>
          <p className="mt-2 text-sm text-[#8E8E93]">
            Everything you need to make content that converts — no guesswork.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-[#2D2D2D] sm:grid-cols-2">
            {[
              'Vertical + horizontal demo videos',
              'One-page value proposition deck',
              'Real parent case studies with numbers',
              'FAQ and objection-handling doc',
              'Custom discount code for your audience',
              'Product roadmap briefings for partners',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-[#1E9E5A]">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#8E8E93]">
            Need the kit? Email <span className="font-medium text-[#2D2D2D]">partners@sprouttales.com</span>{' '}
            after joining.
          </p>
        </Card>
      </section>

      {error && (
        <p role="alert" className="mt-6 text-center text-sm text-[#D93025]">
          {error}
        </p>
      )}

      {loading && !payload && (
        <p className="mt-6 text-center text-sm text-[#8E8E93]">Loading your dashboard…</p>
      )}

      <p className="mt-10 text-center text-xs text-[#8E8E93]">
        Self-referrals are not eligible. Commissions are voided on refunds or chargebacks. See our{' '}
        <Link href="/terms" className="underline hover:text-[#FF6B8A]">
          Terms of Service
        </Link>{' '}
        for the full program rules.
      </p>
    </div>
  )
}
