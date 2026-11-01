import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin'
import {
  getWaffo,
  isWaffoConfigured,
  WAFFO_ENVIRONMENT,
  WAFFO_PLANS,
  isPlanPurchasable,
} from '@/lib/payments/waffo'

export const dynamic = 'force-dynamic'

interface WaffoProduct {
  id: string
  name: string
  status?: string
  billingPeriod?: string
  prices?: { currency: string; priceInfo?: { amount?: string; taxCategory?: string } }[]
}

interface WaffoWebhook {
  id: string
  channel: string
  url: string
  events: string[]
  testMode: boolean
}

/**
 * GET /api/admin/payments
 *
 * 支付通道自检：确认线上跑的是 Waffo 生产环境（不是测试环境），
 * 并回读后台店铺里商品是否已发布、webhook 是否指向本站。
 *
 * 只返回状态和 ID，不回传任何密钥。
 */
export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const storeId = process.env.WAFFO_STORE_ID || ''
  const configured = isWaffoConfigured()

  const report: Record<string, unknown> = {
    environment: WAFFO_ENVIRONMENT,
    configured,
    storeId: storeId || null,
    siteUrl: process.env.SITE_URL || null,
    plans: Object.entries(WAFFO_PLANS).map(([key, plan]) => ({
      key,
      productId: plan.productId || null,
      productIdSet: !!plan.productId,
      purchasable: isPlanPurchasable(key),
    })),
  }

  if (!configured) {
    return NextResponse.json({ ...report, error: 'WAFFO_MERCHANT_ID / WAFFO_PRIVATE_KEY missing' })
  }

  try {
    const client = getWaffo()

    const storeRes = await client.graphql.query({
      query: `query ($id: String!) {
        store(id: $id) {
          id
          name
          status
          subscriptionProducts { id name status billingPeriod prices { currency priceInfo { amount taxCategory } } }
          onetimeProducts { id name status prices { currency priceInfo { amount taxCategory } } }
          storeWebhooks { id channel url events testMode }
        }
      }`,
      variables: { id: storeId },
    })

    if (storeRes.errors) {
      return NextResponse.json(
        { ...report, error: 'Waffo GraphQL error', details: storeRes.errors },
        { status: 502 },
      )
    }

    const store = storeRes.data?.store as
      | {
          id: string
          name: string
          status?: string
          subscriptionProducts?: WaffoProduct[]
          onetimeProducts?: WaffoProduct[]
          storeWebhooks?: WaffoWebhook[]
        }
      | undefined
    if (!store) {
      return NextResponse.json(
        { ...report, error: `Store ${storeId} not found in ${WAFFO_ENVIRONMENT} environment` },
        { status: 502 },
      )
    }

    const products = [
      ...(store.subscriptionProducts ?? []),
      ...(store.onetimeProducts ?? []),
    ].map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status ?? null,
      usd: p.prices?.find((x) => x.currency === 'USD')?.priceInfo?.amount ?? null,
    }))

    return NextResponse.json({
      ...report,
      store: { id: store.id, name: store.name, status: store.status ?? null },
      products,
      webhooks: (store.storeWebhooks ?? []).map((w) => ({
        id: w.id,
        channel: w.channel,
        url: w.url,
        events: w.events,
        testMode: w.testMode,
      })),
    })
  } catch (err) {
    return NextResponse.json(
      { ...report, error: err instanceof Error ? err.message : 'Waffo request failed' },
      { status: 502 },
    )
  }
}
