import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import {
  verifyWebhook,
  WebhookEventType,
  type WebhookEvent,
  type WebhookEventData,
} from '@waffo/pancake-ts'
import { planTier, planGrant, planCycle, PRO_CREDITS_PER_BOOK } from '@/lib/payments/waffo'
import { recordCommissionForPayment } from '@/lib/affiliate'
import { allowanceFor } from '@/lib/allocation'

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
    const plan = d.orderMetadata?.plan || ''
    const tier = plan ? planTier(plan) : null

    switch (event.eventType) {
      case WebhookEventType.OrderCompleted:
      case WebhookEventType.SubscriptionActivated: {
        const amount = Math.round(Number.parseFloat(d.chargedAmount ?? d.amount ?? '0') * 100) || 0
        // 幂等：同一订单只发放一次权益（Waffo 可能重复投递同一事件）
        const inserted = await sql`
          INSERT INTO payments (id, user_id, plan, amount, currency, status, created_at)
          VALUES (${d.orderId}, ${userId}, ${plan}, ${amount}, ${d.currency || 'USD'}, 'completed', NOW())
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `
        // Affiliate commission (idempotent per payment_id; never blocks payment handling)
        try {
          await recordCommissionForPayment(sql, {
            userId: userId || null,
            email: d.buyerEmail,
            paymentId: d.orderId,
            grossCents: amount,
          })
        } catch (commissionErr) {
          console.error('Affiliate commission error:', commissionErr)
        }

        // 已处理过的订单直接返回，不再重复发额度
        if (Array.isArray(inserted) && inserted.length === 0) {
          return NextResponse.json({ received: true, duplicate: true })
        }

        // 未知套餐（已下架的历史 plan）：只记账，不发放权益
        if (!tier || !userId) {
          if (!tier) console.warn(`Unknown Waffo plan "${plan}", payment recorded without grants`)
          else console.warn(`Waffo payment ${d.orderId} has no user identity, grants skipped`)
          break
        }

        if (tier === 'pro-anim') {
          // Pro 动画面包：独立额度池（1 本 = 3 credits）
          const credits = planGrant(plan) * PRO_CREDITS_PER_BOOK
          await sql`
            UPDATE bookbunny_users
            SET pro_animation_credits = COALESCE(pro_animation_credits, 0) + ${credits}, updated_at = NOW()
            WHERE id = ${userId}
          `
        } else if (tier === 'credits') {
          // 历史通用额度包：保留兼容
          await sql`
            UPDATE bookbunny_users
            SET credits = COALESCE(credits, 0) + 5, updated_at = NOW()
            WHERE id = ${userId}
          `
        } else {
          // 订阅档位：重置月度书籍 allowance。
          // Pro 动画不再随订阅附赠（Wan 3 单页成本 $0.25，附赠 10 本会吃掉整月毛利），
          // 统一走一次性 Pro 包；pro_grant_next_at 置空以停掉历史遗留的按月补发。
          // 计费周期要落库：年付价格是月付的 75%，额度必须按周期区分。
          const cycle = planCycle(plan)
          const allowance = allowanceFor(tier, cycle)
          await sql`
            UPDATE bookbunny_users
            SET is_paid = TRUE,
                subscription_tier = ${tier},
                billing_cycle = ${cycle},
                monthly_allowance_remaining = ${allowance},
                allowance_reset_at = ${nextResetAt()},
                pro_grant_next_at = NULL,
                updated_at = NOW()
            WHERE id = ${userId}
          `
        }
        console.log(`✅ Waffo payment: ${d.buyerEmail} -> ${plan} (${d.orderId})`)
        break
      }

      case WebhookEventType.SubscriptionCanceled:
      case WebhookEventType.SubscriptionPastDue: {
        // 取消/逾期时停止后续 Pro 额度发放（已发放的余额保留）
        if (userId) {
          await sql`
            UPDATE bookbunny_users
            SET is_paid = FALSE,
                subscription_tier = 'free',
                monthly_allowance_remaining = NULL,
                allowance_reset_at = NULL,
                pro_grant_next_at = NULL,
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
                pro_grant_next_at = NULL,
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
