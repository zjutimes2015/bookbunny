import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getAdminSession } from '@/lib/admin'
import { AFFILIATE_TIERS, isAffiliateTier } from '@/lib/affiliate'

/** GET /api/admin/affiliates — affiliate roster with performance and payout queue. */
export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    const rows = await sql`
      SELECT a.*, u.email AS user_email,
        (SELECT COUNT(*)::int FROM affiliate_clicks c WHERE c.code = a.code) AS clicks,
        (SELECT COUNT(*)::int FROM referrals r WHERE r.affiliate_id = a.id) AS signups,
        (SELECT COUNT(*)::int FROM referrals r WHERE r.affiliate_id = a.id AND r.status = 'converted') AS conversions,
        (SELECT COALESCE(SUM(amount_cents), 0)::int FROM affiliate_commissions k
          WHERE k.affiliate_id = a.id AND k.status <> 'void') AS lifetime_cents,
        (SELECT COALESCE(SUM(amount_cents), 0)::int FROM affiliate_commissions k
          WHERE k.affiliate_id = a.id AND k.status = 'approved') AS payable_cents
      FROM affiliates a
      LEFT JOIN bookbunny_users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
    `

    const payouts = await sql`
      SELECT p.*, a.code, u.email AS user_email
      FROM affiliate_payouts p
      JOIN affiliates a ON a.id = p.affiliate_id
      LEFT JOIN bookbunny_users u ON u.id = a.user_id
      ORDER BY p.created_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      affiliates: (rows as Record<string, unknown>[]).map((r) => ({
        id: r.id,
        code: r.code,
        tier: r.tier,
        status: r.status,
        email: r.user_email,
        payoutEmail: r.payout_email,
        payoutMethod: r.payout_method,
        firstRate: Number(r.first_rate),
        recurringRate: Number(r.recurring_rate),
        clicks: Number(r.clicks),
        signups: Number(r.signups),
        conversions: Number(r.conversions),
        lifetimeCents: Number(r.lifetime_cents),
        payableCents: Number(r.payable_cents),
        createdAt: r.created_at,
      })),
      payouts: (payouts as Record<string, unknown>[]).map((p) => ({
        id: p.id,
        affiliateId: p.affiliate_id,
        code: p.code,
        email: p.user_email,
        amountCents: Number(p.amount_cents),
        method: p.method,
        reference: p.reference,
        status: p.status,
        createdAt: p.created_at,
        paidAt: p.paid_at,
      })),
      tiers: Object.values(AFFILIATE_TIERS).map((t) => ({
        id: t.id,
        label: t.label,
        firstRate: t.firstRate,
        recurringRate: t.recurringRate,
      })),
    })
  } catch (err) {
    console.error('admin affiliates error:', err)
    return NextResponse.json({ error: 'Could not load affiliates' }, { status: 500 })
  }
}

/** PATCH /api/admin/affiliates — update tier/status, or mark a payout as paid. */
export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let body: {
    affiliateId?: string
    tier?: string
    status?: string
    payoutId?: string
    markPaid?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    if (body.payoutId && body.markPaid) {
      const rows = await sql`
        UPDATE affiliate_payouts
        SET status = 'paid', paid_at = NOW()
        WHERE id = ${body.payoutId}
        RETURNING id, status, paid_at
      `
      if (rows.length === 0) return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
      return NextResponse.json({ payout: rows[0] })
    }

    if (!body.affiliateId) {
      return NextResponse.json({ error: 'affiliateId is required' }, { status: 400 })
    }

    if (body.tier && !isAffiliateTier(body.tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }
    if (body.status && !['active', 'suspended'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const tier = body.tier && isAffiliateTier(body.tier) ? body.tier : null
    const config = tier ? AFFILIATE_TIERS[tier] : null

    const rows = await sql`
      UPDATE affiliates
      SET tier = COALESCE(${tier}::text, tier),
          first_rate = COALESCE(${config?.firstRate ?? null}::int, first_rate),
          recurring_rate = COALESCE(${config?.recurringRate ?? null}::int, recurring_rate),
          status = COALESCE(${body.status ?? null}::text, status),
          updated_at = NOW()
      WHERE id = ${body.affiliateId}
      RETURNING id, code, tier, status, first_rate, recurring_rate
    `
    if (rows.length === 0) return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })

    return NextResponse.json({ affiliate: rows[0] })
  } catch (err) {
    console.error('admin affiliate update error:', err)
    return NextResponse.json({ error: 'Could not update affiliate' }, { status: 500 })
  }
}
