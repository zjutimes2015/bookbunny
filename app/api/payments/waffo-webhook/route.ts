import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import {
  verifyWebhook,
  WebhookEventType,
  type WebhookEvent,
  type WebhookEventData,
} from '@waffo/pancake-ts'
import { planTier } from '@/lib/payments/waffo'

/** 各订阅档位的月度书籍 allowance（credits 档不走这里） */
const TIER_ALLOWANCE: Record<string, number> = {
  starter: 10,
  creator: 30,
  studio: 100,
}

/** 下一次 allowance 重置时间（下个月 1 号 00:00 UTC） */
function nextResetAt() {
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() + 1, 1)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-waffo-signature')

  // SDK 内置测试/生产公钥，无需自己管理 webhook secret；不指定 environment 时自动识别测试/生产事件
  let event: WebhookEvent<WebhookEventData>
  try {
    event = verifyWebhook<WebhookEventData>(rawBody, signature)
  } catch {
    return new Response('Invalid signature', { status: 401 })
  }

  try {
    const d = event.data
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const userId = d.merchantProvidedBuyerIdentity || d.orderMetadata?.userId || ''
    const plan = d.orderMetadata?.plan || 'starter_monthly'
    const tier = planTier(plan)

    switch (event.eventType) {
      case WebhookEventType.OrderCompleted:
      case WebhookEventType.SubscriptionActivated: {
        const amount = Math.round(Number.parseFloat(d.chargedAmount ?? d.amount ?? '0') * 100) || 0
        await sql`
          INSERT INTO payments (id, user_id, plan, amount, currency, status, created_at)
          VALUES (${d.orderId}, ${userId}, ${plan}, ${amount}, ${d.currency || 'USD'}, 'completed', NOW())
          ON CONFLICT (id) DO NOTHING
        `
        if (tier === 'credits') {
          // 额度包：一次性加 5 本，永久有效
          if (userId) {
            await sql`
              UPDATE bookbunny_users
              SET credits = COALESCE(credits, 0) + 5, updated_at = NOW()
              WHERE id = ${userId}
            `
          } else if (d.buyerEmail) {
            await sql`
              UPDATE bookbunny_users
              SET credits = COALESCE(credits, 0) + 5, updated_at = NOW()
              WHERE email = ${d.buyerEmail}
            `
          }
        } else if (userId) {
          const allowance = TIER_ALLOWANCE[tier] ?? null
          if (allowance !== null) {
            await sql`
              UPDATE bookbunny_users
              SET is_paid = TRUE,
                  subscription_tier = ${tier},
                  monthly_allowance_remaining = ${allowance},
                  allowance_reset_at = ${nextResetAt()},
                  updated_at = NOW()
              WHERE id = ${userId}
            `
          } else {
            await sql`
              UPDATE bookbunny_users
              SET is_paid = TRUE, subscription_tier = ${tier}, updated_at = NOW()
              WHERE id = ${userId}
            `
          }
        } else if (d.buyerEmail) {
          const allowance = TIER_ALLOWANCE[tier] ?? null
          if (allowance !== null) {
            await sql`
              UPDATE bookbunny_users
              SET is_paid = TRUE,
                  subscription_tier = ${tier},
                  monthly_allowance_remaining = ${allowance},
                  allowance_reset_at = ${nextResetAt()},
                  updated_at = NOW()
              WHERE email = ${d.buyerEmail}
            `
          } else {
            await sql`
              UPDATE bookbunny_users
              SET is_paid = TRUE, subscription_tier = ${tier}, updated_at = NOW()
              WHERE email = ${d.buyerEmail}
            `
          }
        }
        console.log(`✅ Waffo payment: ${d.buyerEmail} -> ${plan} (${d.orderId})`)
        break
      }

      case WebhookEventType.SubscriptionCanceled:
      case WebhookEventType.SubscriptionPastDue: {
        if (userId) {
          await sql`
            UPDATE bookbunny_users
            SET is_paid = FALSE,
                subscription_tier = 'free',
                monthly_allowance_remaining = NULL,
                allowance_reset_at = NULL,
                updated_at = NOW()
            WHERE id = ${userId}
          `
        } else if (d.buyerEmail) {
          await sql`
            UPDATE bookbunny_users
            SET is_paid = FALSE,
                subscription_tier = 'free',
                monthly_allowance_remaining = NULL,
                allowance_reset_at = NULL,
                updated_at = NOW()
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
