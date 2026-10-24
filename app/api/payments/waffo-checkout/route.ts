import { NextRequest, NextResponse } from 'next/server'
import { getWaffo, getPlan, isWaffoConfigured } from '@/lib/payments/waffo'
import { getSessionUser } from '@/lib/auth'
import { neon } from '@neondatabase/serverless'

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json()
    const selected = typeof plan === 'string' ? getPlan(plan) : null
    if (!selected) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // 收款必须先绑定账号，否则支付成功后无法开通权益
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in before checkout', code: 'auth_required' }, { status: 401 })
    }

    const siteUrl = process.env.SITE_URL || 'http://localhost:3000'
    const tier = selected.tier

    // 未配置密钥时：开发态模拟成功支付
    if (!isWaffoConfigured()) {
      const fakeId = `waffo_sim_${Date.now()}`
      const sql = neon(process.env.NEON_DATABASE_URL!)
      await sql`
        INSERT INTO payments (id, user_id, plan, amount, currency, status, created_at)
        VALUES (${fakeId}, ${user.id}, ${plan}, ${Math.round(selected.price * 100)}, ${selected.currency}, 'completed', NOW())
      `
      if (tier === 'credits') {
        await sql`UPDATE bookbunny_users SET credits = COALESCE(credits, 0) + 5, updated_at = NOW() WHERE id = ${user.id}`
      } else if (tier === 'pro-anim') {
        await sql`UPDATE bookbunny_users SET pro_animation_credits = COALESCE(pro_animation_credits, 0) + 5, updated_at = NOW() WHERE id = ${user.id}`
      } else {
        await sql`
          UPDATE bookbunny_users
          SET is_paid = TRUE, subscription_tier = ${tier}, updated_at = NOW()
          WHERE id = ${user.id}
        `
      }
      return NextResponse.json({
        url: `${siteUrl}/create?paid=success&plan=${plan}`,
        simulated: true,
      })
    }

    // 正式：创建 Waffo 托管结账会话（authenticated 模式，订单绑定我们自己的 userId）
    const result = await getWaffo().checkout.authenticated.create({
      productId: selected.productId,
      currency: selected.currency,
      buyerIdentity: user.id,
      buyerEmail: user.email || undefined,
      metadata: { plan, tier, userId: user.id },
      successUrl: `${siteUrl}/create?paid=success&plan=${plan}`,
    })

    return NextResponse.json({ url: result.checkoutUrl })
  } catch (err) {
    console.error('Waffo checkout error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Checkout failed' },
      { status: 500 },
    )
  }
}
