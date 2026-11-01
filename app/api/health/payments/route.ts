import { NextResponse } from 'next/server'
import { getWaffo, isWaffoConfigured, WAFFO_ENVIRONMENT } from '@/lib/payments/waffo'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health/payments
 *
 * 支付通道就绪检查（脱敏）。
 *
 * 上线前必须确认两件事：
 *   1. 线上跑的是 Waffo 生产环境，不是测试环境 —— 测试环境收款等于白送；
 *   2. 商品已从测试版本发布到生产，且生产 Webhook 指向本站。
 *
 * 这些只能从已部署的运行时读到：Vercel 把 WAFFO_MERCHANT_ID / WAFFO_PRIVATE_KEY
 * 存为 sensitive，本地拉不出来（拉下来是 [SENSITIVE] 占位符）。
 *
 * 只返回布尔与枚举，不回传 merchant id、私钥、product id、webhook url。
 * 详细清单走管理员接口 /api/admin/payments。
 */
export async function GET() {
  const configured = isWaffoConfigured()
  const report: Record<string, unknown> = {
    ok: false,
    configured,
    environment: WAFFO_ENVIRONMENT,
    storeIdSet: !!process.env.WAFFO_STORE_ID,
    siteUrl: process.env.SITE_URL || null,
  }

  if (!configured) {
    return NextResponse.json(
      { ...report, error: 'WAFFO_MERCHANT_ID / WAFFO_PRIVATE_KEY missing' },
      { status: 503 },
    )
  }

  try {
    const res = await getWaffo().graphql.query({
      query: `query ($id: String!) {
        store(id: $id) {
          status
          subscriptionProducts { id status }
          onetimeProducts { id status }
          storeWebhooks { id url testMode channel }
        }
      }`,
      variables: { id: process.env.WAFFO_STORE_ID },
    })

    if (res.errors) {
      return NextResponse.json(
        { ...report, error: 'Waffo API error', detail: (res.errors as unknown[]).length },
        { status: 502 },
      )
    }

    const store = res.data?.store as
      | {
          status?: string
          subscriptionProducts?: { id: string; status?: string }[]
          onetimeProducts?: { id: string; status?: string }[]
          storeWebhooks?: { id: string; url: string; testMode: boolean; channel: string }[]
        }
      | undefined

    if (!store) {
      return NextResponse.json(
        { ...report, error: 'Store not found in this environment' },
        { status: 502 },
      )
    }

    const products = [...(store.subscriptionProducts ?? []), ...(store.onetimeProducts ?? [])]
    const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '')
    const webhooks = store.storeWebhooks ?? []
    const prodWebhook = webhooks.find((w) => w.testMode === false)
    const webhookOnSite = prodWebhook ? prodWebhook.url.startsWith(siteUrl) : false

    return NextResponse.json({
      ...report,
      ok: true,
      storeActive: store.status === 'active',
      storeStatus: store.status ?? null,
      productCount: products.length,
      activeProductCount: products.filter((p) => (p.status ?? 'active') === 'active').length,
      webhookCount: webhooks.length,
      prodWebhookConfigured: !!prodWebhook,
      prodWebhookOnSite: webhookOnSite,
    })
  } catch (err) {
    return NextResponse.json(
      { ...report, error: err instanceof Error ? err.message : 'Waffo request failed' },
      { status: 502 },
    )
  }
}
