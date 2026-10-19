import { NextRequest, NextResponse } from 'next/server'
import { getWaffo, WAFFO_PLANS, isWaffoConfigured, type WaffoPlanKey } from '@/lib/payments/waffo'
import { neon } from '@neondatabase/serverless'

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, userEmail } = await req.json()
    if (!plan || !WAFFO_PLANS[plan as WaffoPlanKey]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const p = WAFFO_PLANS[plan as WaffoPlanKey]
    const siteUrl = process.env.SITE_URL || 'http://localhost:3000'

    // 未配置密钥时：开发态模拟成功支付
    if (!isWaffoConfigured()) {
      const fakeId = `waffo_sim_${Date.now()}`
      const sql = neon(process.env.NEON_DATABASE_URL!)
      await sql`
        INSERT INTO payments (id, user_id, plan, amount, status, created_at)
        VALUES (${fakeId}, ${userId}, ${plan}, ${Math.round(p.price * 100)}, 'completed', NOW())
      `
      await sql`UPDATE bookbunny_users SET is_paid = TRUE, subscription_tier = ${plan} WHERE id = ${userId}`
      return NextResponse.json({ url: `${siteUrl}/create?paid=success`, simulated: true })
    }

    // 正式：创建 Waffo 托管结账会话（authenticated 模式，订单绑定我们自己的 userId）
    const result = await getWaffo().checkout.authenticated.create({
      productId: p.productId,
      currency: p.currency,
      buyerIdentity: userId || userEmail || 'anonymous',
      buyerEmail: userEmail || undefined,
      metadata: { plan, userId: userId || '' },
      successUrl: `${siteUrl}/create?paid=success`,
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
