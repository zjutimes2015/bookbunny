import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import crypto from 'node:crypto'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('creem-signature') || req.headers.get('x-creem-signature')

  // Verify webhook signature
  const webhookSecret = process.env.CREEM_WEBHOOK_SECRET
  if (webhookSecret && signature) {
    const computed = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
    const sigBuf = Buffer.from(signature)
    const compBuf = Buffer.from(computed)
    if (sigBuf.length !== compBuf.length || !crypto.timingSafeEqual(sigBuf, compBuf)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  try {
    const event = JSON.parse(rawBody)
    const sql = neon(process.env.NEON_DATABASE_URL!)

    if (event.eventType === 'checkout.completed') {
      const obj = event.object
      const checkout = obj.checkout || obj
      const metadata = checkout.metadata || {}
      const userId = metadata.userId as string
      const plan = (metadata.plan as string) || 'pro'
      const customerEmail = obj.customer?.email || checkout.customer?.email || ''

      // Store payment record
      const orderId = obj.order?.id || obj.id || `ch_${Date.now()}`
      const amount = obj.order?.amount || 0

      await sql`
        INSERT INTO payments (id, user_id, plan, amount, currency, status, created_at)
        VALUES (${orderId}, ${userId}, ${plan}, ${amount}, ${obj.order?.currency || 'USD'}, 'completed', NOW())
        ON CONFLICT (id) DO NOTHING
      `

      // Update user subscription
      if (userId) {
        await sql`
          UPDATE bookbunny_users
          SET is_paid = TRUE, subscription_tier = ${plan}, updated_at = NOW()
          WHERE id = ${userId}
        `
      } else if (customerEmail) {
        await sql`
          UPDATE bookbunny_users
          SET is_paid = TRUE, subscription_tier = ${plan}, updated_at = NOW()
          WHERE email = ${customerEmail}
        `
      }

      console.log(`✅ Payment completed: ${customerEmail} -> ${plan} (${orderId})`)
    }

    if (event.eventType === 'subscription.canceled' || event.eventType === 'subscription.past_due') {
      const sub = event.object
      const customerEmail = sub.customer?.email || ''
      if (customerEmail) {
        const sql = neon(process.env.NEON_DATABASE_URL!)
        await sql`
          UPDATE bookbunny_users
          SET is_paid = FALSE, subscription_tier = 'free', updated_at = NOW()
          WHERE email = ${customerEmail}
        `
      }
      console.log(`❌ Subscription ended: ${customerEmail}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
