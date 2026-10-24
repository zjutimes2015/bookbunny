import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getSessionUser } from '@/lib/auth'
import {
  MIN_PAYOUT_CENTS,
  approveMatureCommissions,
  getAffiliateForUser,
  maskEmail,
  resolveRates,
} from '@/lib/affiliate'

/** GET /api/affiliate/me — affiliate account, stats, referrals and commissions. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const affiliate = await getAffiliateForUser(sql, user.id)
    if (!affiliate) return NextResponse.json({ affiliate: null })

    await approveMatureCommissions(sql, affiliate.id)

    const [clicks, clicks30, signupCount, conversionCount, referralRows, commissionRows, payoutRows, commissionTotals] =
      await Promise.all([
        sql`SELECT COUNT(*)::int AS cnt FROM affiliate_clicks WHERE code = ${affiliate.code}`,
        sql`
          SELECT COUNT(*)::int AS cnt FROM affiliate_clicks
          WHERE code = ${affiliate.code} AND created_at >= NOW() - INTERVAL '30 days'
        `,
        sql`SELECT COUNT(*)::int AS cnt FROM referrals WHERE affiliate_id = ${affiliate.id}`,
        sql`
          SELECT COUNT(*)::int AS cnt FROM referrals
          WHERE affiliate_id = ${affiliate.id} AND status = 'converted'
        `,
        sql`
          SELECT r.id, r.status, r.created_at, r.converted_at, u.email
          FROM referrals r
          LEFT JOIN bookbunny_users u ON u.id = r.referred_user_id
          WHERE r.affiliate_id = ${affiliate.id}
          ORDER BY r.created_at DESC
          LIMIT 25
        `,
        sql`
          SELECT id, kind, gross_cents, rate, amount_cents, status, created_at
          FROM affiliate_commissions
          WHERE affiliate_id = ${affiliate.id}
          ORDER BY created_at DESC
          LIMIT 25
        `,
        sql`
          SELECT id, amount_cents, method, reference, status, created_at, paid_at
          FROM affiliate_payouts
          WHERE affiliate_id = ${affiliate.id}
          ORDER BY created_at DESC
          LIMIT 10
        `,
        sql`
          SELECT status, COALESCE(SUM(amount_cents), 0)::int AS total, COUNT(*)::int AS cnt
          FROM affiliate_commissions
          WHERE affiliate_id = ${affiliate.id}
          GROUP BY status
        `,
      ])

    const totals: Record<string, { total: number; cnt: number }> = {}
    for (const row of commissionTotals as { status: string; total: number; cnt: number }[]) {
      totals[row.status] = { total: Number(row.total), cnt: Number(row.cnt) }
    }

    const referrals = referralRows as {
      id: string
      status: string
      created_at: string
      converted_at: string | null
      email: string | null
    }[]

    const { firstRate, recurringRate } = resolveRates(affiliate)

    return NextResponse.json({
      affiliate: {
        code: affiliate.code,
        tier: affiliate.tier,
        status: affiliate.status,
        firstRate,
        recurringRate,
        payoutEmail: affiliate.payout_email,
        payoutMethod: affiliate.payout_method,
        createdAt: affiliate.created_at,
      },
      stats: {
        clicks: Number(clicks[0]?.cnt ?? 0),
        clicks30d: Number(clicks30[0]?.cnt ?? 0),
        signups: Number(signupCount[0]?.cnt ?? 0),
        conversions: Number(conversionCount[0]?.cnt ?? 0),
        earnings: {
          pendingCents: totals.pending?.total ?? 0,
          approvedCents: totals.approved?.total ?? 0,
          paidCents: totals.paid?.total ?? 0,
          lifetimeCents:
            (totals.pending?.total ?? 0) + (totals.approved?.total ?? 0) + (totals.paid?.total ?? 0),
        },
        payableCents: totals.approved?.total ?? 0,
        minPayoutCents: MIN_PAYOUT_CENTS,
      },
      referrals: referrals.map((r) => ({
        id: r.id,
        status: r.status,
        email: maskEmail(r.email),
        createdAt: r.created_at,
        convertedAt: r.converted_at,
      })),
      commissions: (commissionRows as Record<string, unknown>[]).map((c) => ({
        id: c.id,
        kind: c.kind,
        grossCents: Number(c.gross_cents),
        rate: Number(c.rate),
        amountCents: Number(c.amount_cents),
        status: c.status,
        createdAt: c.created_at,
      })),
      payouts: (payoutRows as Record<string, unknown>[]).map((p) => ({
        id: p.id,
        amountCents: Number(p.amount_cents),
        method: p.method,
        reference: p.reference,
        status: p.status,
        createdAt: p.created_at,
        paidAt: p.paid_at,
      })),
    })
  } catch (err) {
    console.error('affiliate me error:', err)
    return NextResponse.json({ error: 'Could not load affiliate data' }, { status: 500 })
  }
}
