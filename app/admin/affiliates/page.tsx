'use client'

import { useCallback, useEffect, useState } from 'react'

interface AdminAffiliate {
  id: string
  code: string
  tier: string
  status: string
  email: string | null
  payoutEmail: string | null
  payoutMethod: string
  firstRate: number
  recurringRate: number
  clicks: number
  signups: number
  conversions: number
  lifetimeCents: number
  payableCents: number
  createdAt: string
}

interface AdminPayout {
  id: string
  affiliateId: string
  code: string
  email: string | null
  amountCents: number
  method: string
  reference: string
  status: string
  createdAt: string
  paidAt: string | null
}

interface TierOption {
  id: string
  label: string
  firstRate: number
  recurringRate: number
}

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([])
  const [payouts, setPayouts] = useState<AdminPayout[]>([])
  const [tiers, setTiers] = useState<TierOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/affiliates')
      if (!res.ok) {
        setError('Could not load affiliates.')
        return
      }
      const data = await res.json()
      setAffiliates(data.affiliates || [])
      setPayouts(data.payouts || [])
      setTiers(data.tiers || [])
    } catch {
      setError('Could not load affiliates.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function updateAffiliate(id: string, patch: { tier?: string; status?: string }) {
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId: id, ...patch }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Update failed.')
        return
      }
      await load()
    } catch {
      setError('Update failed.')
    } finally {
      setBusyId('')
    }
  }

  async function markPaid(payoutId: string) {
    setBusyId(payoutId)
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, markPaid: true }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Could not mark payout as paid.')
        return
      }
      await load()
    } catch {
      setError('Could not mark payout as paid.')
    } finally {
      setBusyId('')
    }
  }

  const totals = affiliates.reduce(
    (acc, a) => ({
      clicks: acc.clicks + a.clicks,
      signups: acc.signups + a.signups,
      conversions: acc.conversions + a.conversions,
      lifetime: acc.lifetime + a.lifetimeCents,
      payable: acc.payable + a.payableCents,
    }),
    { clicks: 0, signups: 0, conversions: 0, lifetime: 0, payable: 0 },
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#2D2D2D]">Affiliates</h1>
        <p className="mt-1 text-sm text-[#8E8E93]">
          Manage partner tiers, review performance and settle payouts.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-[#FDECEA] px-4 py-3 text-sm text-[#D93025]">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Affiliates', value: String(affiliates.length) },
          { label: 'Clicks', value: String(totals.clicks) },
          { label: 'Sign-ups', value: String(totals.signups) },
          { label: 'Commission earned', value: usd(totals.lifetime) },
          { label: 'Payable now', value: usd(totals.payable) },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-[#E5E5EA] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-[#2D2D2D]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#E5E5EA] bg-white">
        <div className="border-b border-[#E5E5EA] px-5 py-4">
          <h2 className="font-semibold text-[#2D2D2D]">Program members</h2>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-sm text-[#8E8E93]">Loading…</p>
        ) : affiliates.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[#8E8E93]">
            No affiliates yet. Share the /affiliate page to recruit your first partners.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F8FA] text-xs uppercase tracking-wide text-[#8E8E93]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-3 py-3 font-semibold">Member</th>
                  <th className="px-3 py-3 font-semibold">Tier</th>
                  <th className="px-3 py-3 font-semibold">Clicks</th>
                  <th className="px-3 py-3 font-semibold">Sign-ups</th>
                  <th className="px-3 py-3 font-semibold">Paid</th>
                  <th className="px-3 py-3 font-semibold">Earned</th>
                  <th className="px-3 py-3 font-semibold">Payable</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F7]">
                {affiliates.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3 font-mono text-xs text-[#2D2D2D]">{a.code}</td>
                    <td className="px-3 py-3">
                      <p className="text-[#2D2D2D]">{a.email || '—'}</p>
                      <p className="text-xs text-[#8E8E93]">
                        {a.payoutMethod} · {a.payoutEmail || '—'}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={a.tier}
                        disabled={busyId === a.id}
                        onChange={(e) => updateAffiliate(a.id, { tier: e.target.value })}
                        className="rounded-lg border border-[#E5E5EA] bg-white px-2 py-1 text-xs text-[#2D2D2D]"
                      >
                        {tiers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label} ({t.firstRate}/{t.recurringRate})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-[#8E8E93]">{a.clicks}</td>
                    <td className="px-3 py-3 text-[#8E8E93]">{a.signups}</td>
                    <td className="px-3 py-3 text-[#8E8E93]">{a.conversions}</td>
                    <td className="px-3 py-3 text-[#2D2D2D]">{usd(a.lifetimeCents)}</td>
                    <td className="px-3 py-3 text-[#2D2D2D]">{usd(a.payableCents)}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() =>
                          updateAffiliate(a.id, {
                            status: a.status === 'active' ? 'suspended' : 'active',
                          })
                        }
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          a.status === 'active'
                            ? 'bg-[#E8F7EE] text-[#1E9E5A]'
                            : 'bg-[#FDECEA] text-[#D93025]'
                        }`}
                      >
                        {a.status === 'active' ? 'Active' : 'Suspended'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#E5E5EA] bg-white">
        <div className="border-b border-[#E5E5EA] px-5 py-4">
          <h2 className="font-semibold text-[#2D2D2D]">Payout queue</h2>
        </div>
        {payouts.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[#8E8E93]">No payout requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F8FA] text-xs uppercase tracking-wide text-[#8E8E93]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Requested</th>
                  <th className="px-3 py-3 font-semibold">Code</th>
                  <th className="px-3 py-3 font-semibold">Send to</th>
                  <th className="px-3 py-3 font-semibold">Amount</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F7]">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 text-[#8E8E93]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-[#2D2D2D]">{p.code}</td>
                    <td className="px-3 py-3">
                      <p className="text-[#2D2D2D]">{p.reference}</p>
                      <p className="text-xs capitalize text-[#8E8E93]">{p.method}</p>
                    </td>
                    <td className="px-3 py-3 font-medium text-[#2D2D2D]">{usd(p.amountCents)}</td>
                    <td className="px-3 py-3 capitalize text-[#8E8E93]">{p.status}</td>
                    <td className="px-3 py-3">
                      {p.status !== 'paid' && (
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => markPaid(p.id)}
                          className="rounded-lg bg-[#2D2D2D] px-3 py-1.5 text-xs font-medium text-white hover:opacity-85 disabled:opacity-50"
                        >
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
