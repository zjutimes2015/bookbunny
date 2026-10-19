import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import {
  verifyWebhook,
  WebhookEventType,
  type WebhookEvent,
  type WebhookEventData,
} from '@waffo/pancake-ts'
import { WAFFO_ENVIRONMENT } from '@/lib/payments/waffo'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-waffo-signature')

  // SDK 内置测试/生产公钥，无需自己管理 webhook secret；自带重放保护
  let event: WebhookEvent<WebhookEventData>
  try {
    event = verifyWebhook<WebhookEventData>(rawBody, signature, { environment: WAFFO_ENVIRONMENT })
  } catch {
    return new Response('Invalid signature', { status: 401 })
  }

  try {
    const d = event.data
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const userId = d.merchantProvidedBuyerIdentity || ''
    const plan = d.orderMetadata?.plan || 'pro'

    switch (event.eventType) {
      case WebhookEventType.OrderCompleted:
      case WebhookEventType.SubscriptionActivated: {
        const amount = Math.round(Number.parseFloat(d.chargedAmount ?? d.amount ?? '0') * 100) || 0
        await sql`
          INSERT INTO payments (id, user_id, plan, amount, currency, status, created_at)
          VALUES (${d.orderId}, ${userId}, ${plan}, ${amount}, ${d.currency || 'USD'}, 'completed', NOW())
          ON CONFLICT (id) DO NOTHING
        `
        if (userId) {
          await sql`
            UPDATE bookbunny_users
            SET is_paid = TRUE, subscription_tier = ${plan}, updated_at = NOW()
            WHERE id = ${userId}
          `
        } else if (d.buyerEmail) {
          await sql`
            UPDATE bookbunny_users
            SET is_paid = TRUE, subscription_tier = ${plan}, updated_at = NOW()
            WHERE email = ${d.buyerEmail}
          `
        }
        console.log(`✅ Waffo payment: ${d.buyerEmail} -> ${plan} (${d.orderId})`)
        break
      }

      case WebhookEventType.SubscriptionCanceled:
      case WebhookEventType.SubscriptionPastDue: {
        if (userId) {
          await sql`
            UPDATE bookbunny_users
            SET is_paid = FALSE, subscription_tier = 'free', updated_at = NOW()
            WHERE id = ${userId}
          `
        } else if (d.buyerEmail) {
          await sql`
            UPDATE bookbunny_users
            SET is_paid = FALSE, subscription_tier = 'free', updated_at = NOW()
            WHERE email = ${d.buyerEmail}
          `
        }
        console.log(`❌ Waffo subscription ended: ${d.buyerEmail}`)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Waffo webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
