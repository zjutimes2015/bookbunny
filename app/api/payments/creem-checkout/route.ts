import { NextRequest, NextResponse } from 'next/server'
import { getCreem, PLANS, isCreemConfigured, type PlanKey } from '@/lib/payments/creem'
import { neon } from '@neondatabase/serverless'

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, userEmail } = await req.json()
    if (!plan || !PLANS[plan as PlanKey]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const p = PLANS[plan as PlanKey]
    const siteUrl = process.env.SITE_URL || 'http://localhost:3000'

    // Dev mode: simulate successful checkout
    if (!isCreemConfigured()) {
      const fakeId = `ch_sim_${Date.now()}`
      // Store simulated payment in DB
      const sql = neon(process.env.NEON_DATABASE_URL!)
      await sql`
        INSERT INTO payments (id, user_id, plan, amount, status, created_at)
        VALUES (${fakeId}, ${userId}, ${plan}, ${Math.round(p.price * 100)}, 'completed', NOW())
      `
      await sql`UPDATE bookbunny_users SET is_paid = TRUE, subscription_tier = ${plan} WHERE id = ${userId}`
      return NextResponse.json({ url: `${siteUrl}/create?paid=success` })
    }

    // Real Creem checkout
    const creem = getCreem()
    const checkout = await creem.checkouts.create({
      productId: p.productId,
      successUrl: `${siteUrl}/create?paid=success`,
      metadata: {
        userId: userId || 'anonymous',
        plan,
      },
      customer: userEmail ? { email: userEmail } : undefined,
    })

    return NextResponse.json({ url: checkout.checkoutUrl })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Checkout failed' },
      { status: 500 },
    )
  }
}
