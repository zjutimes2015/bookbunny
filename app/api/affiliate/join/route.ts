import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getSessionUser } from '@/lib/auth'
import {
  DEFAULT_TIER,
  generateReferralCode,
  getAffiliateForUser,
  isValidEmail,
  tierConfig,
} from '@/lib/affiliate'

const PAYOUT_METHODS = ['paypal', 'stripe', 'wise']

/**
 * POST /api/affiliate/join
 * Creates the affiliate account for the logged-in user. Idempotent: calling it twice
 * returns the existing account instead of erroring.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { payoutEmail?: string; payoutMethod?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const payoutEmail = (body.payoutEmail || user.email || '').trim().toLowerCase()
  if (!isValidEmail(payoutEmail)) {
    return NextResponse.json({ error: 'A valid payout email is required' }, { status: 400 })
  }
  const payoutMethod = PAYOUT_METHODS.includes(body.payoutMethod || '')
    ? (body.payoutMethod as string)
    : 'paypal'

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    const existing = await getAffiliateForUser(sql, user.id)
    if (existing) {
      return NextResponse.json({ affiliate: existing, created: false })
    }

    const rate = tierConfig(DEFAULT_TIER)
    let created: Record<string, unknown> | null = null

    // Collision chance is negligible, but retry so a duplicate code can never 500.
    for (let attempt = 0; attempt < 6 && !created; attempt += 1) {
      const code = generateReferralCode()
      const rows = await sql`
        INSERT INTO affiliates (user_id, code, tier, first_rate, recurring_rate, payout_email, payout_method)
        VALUES (${user.id}, ${code}, ${DEFAULT_TIER}, ${rate.firstRate}, ${rate.recurringRate}, ${payoutEmail}, ${payoutMethod})
        ON CONFLICT DO NOTHING
        RETURNING *
      `
      created = (rows[0] as Record<string, unknown>) || null
    }

    if (!created) {
      // Concurrent join for the same user won the race — return that row.
      const raced = await getAffiliateForUser(sql, user.id)
      if (raced) return NextResponse.json({ affiliate: raced, created: false })
      return NextResponse.json({ error: 'Could not allocate a referral code' }, { status: 500 })
    }

    return NextResponse.json({ affiliate: created, created: true }, { status: 201 })
  } catch (err) {
    console.error('affiliate join error:', err)
    return NextResponse.json({ error: 'Could not join the program' }, { status: 500 })
  }
}
