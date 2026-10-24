import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getSessionUser } from '@/lib/auth'
import { MIN_PAYOUT_CENTS, getAffiliateForUser } from '@/lib/affiliate'

const PAYOUT_METHODS = ['paypal', 'stripe', 'wise']

/**
 * POST /api/affiliate/payout
 * Converts all approved commissions into a payout request (paid manually by an admin).
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { method?: string; reference?: string }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const affiliate = await getAffiliateForUser(sql, user.id)
    if (!affiliate) return NextResponse.json({ error: 'Not an affiliate' }, { status: 404 })
    if (affiliate.status !== 'active') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 })
    }

    const method = PAYOUT_METHODS.includes(body.method || '')
      ? (body.method as string)
      : affiliate.payout_method || 'paypal'
    const reference = (body.reference || affiliate.payout_email || '').trim()
    if (!reference) {
      return NextResponse.json({ error: 'Payout account is required' }, { status: 400 })
    }

    const approved = await sql`
      SELECT COALESCE(SUM(amount_cents), 0)::int AS total, COUNT(*)::int AS cnt
      FROM affiliate_commissions
      WHERE affiliate_id = ${affiliate.id} AND status = 'approved'
    `
    const amountCents = Number(approved[0]?.total ?? 0)
    if (amountCents < MIN_PAYOUT_CENTS) {
      return NextResponse.json(
        {
          error: `Minimum payout is $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}`,
          payableCents: amountCents,
        },
        { status: 400 },
      )
    }

    const pending = await sql`
      SELECT 1 FROM affiliate_payouts
      WHERE affiliate_id = ${affiliate.id} AND status = 'requested'
      LIMIT 1
    `
    if (pending.length > 0) {
      return NextResponse.json({ error: 'A payout request is already in review' }, { status: 409 })
    }

    const payoutRows = await sql`
      INSERT INTO affiliate_payouts (affiliate_id, amount_cents, method, reference)
      VALUES (${affiliate.id}, ${amountCents}, ${method}, ${reference})
      RETURNING id, amount_cents, method, reference, status, created_at
    `
    const payout = payoutRows[0]

    await sql`
      UPDATE affiliate_commissions
      SET status = 'paid', payout_id = ${payout.id}
      WHERE affiliate_id = ${affiliate.id} AND status = 'approved'
    `

    return NextResponse.json({ payout, requestedCents: amountCents }, { status: 201 })
  } catch (err) {
    console.error('affiliate payout error:', err)
    return NextResponse.json({ error: 'Could not request payout' }, { status: 500 })
  }
}
