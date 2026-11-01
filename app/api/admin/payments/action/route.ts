import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin'
import { getWaffo, isWaffoConfigured, WAFFO_PLANS } from '@/lib/payments/waffo'
import { WaffoPancake, WebhookEventType } from '@waffo/pancake-ts'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/payments/action
 *
 * 把 Waffo 从测试版切到生产版需要两个动作，这里都能做：
 *   action=publish  把测试环境的商品版本发布到生产
 *   action=webhook  注册生产 webhook（testMode=false），指向本站
 *   action=inspect  逐个套餐回读商品在 test / prod 的状态（只读）
 *
 * 安全边界：
 *   1. 必须管理员登录态，或带上一次性运维令牌 PAYMENT_REPAIR_TOKEN；
 *   2. 请求体只接受 action 字符串，其余一律来自代码常量；
 *   3. webhook URL 用 SITE_URL 拼出来，不接受外部传入的 URL。
 */

const PUBLISH_ACTIONS = new Set(['publish', 'webhook', 'inspect'])

/**
 * 一次性运维令牌。
 *
 * 管理员登录态是首选入口，但上线时往往没有可用的浏览器会话；
 * 这个 token 让运维脚本能在生产环境里完成「发布商品 + 注册 webhook」，
 * 用完就删（删掉后该变量为空，端点自动只认管理员登录态）。
 */
function authorizedByToken(req: NextRequest): boolean {
  const expected = process.env.PAYMENT_REPAIR_TOKEN || ''
  if (!expected) return false
  const header = req.headers.get('authorization') || ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : ''
  const query = req.nextUrl.searchParams.get('token') || ''
  return (bearer || query) === expected
}

/** 需要订阅的事件：发放权益 + 退订降级 */
const PROD_EVENTS = [
  WebhookEventType.OrderCompleted,
  WebhookEventType.SubscriptionActivated,
  WebhookEventType.SubscriptionPaymentSucceeded,
  WebhookEventType.SubscriptionRenewed,
  WebhookEventType.SubscriptionCanceled,
  WebhookEventType.SubscriptionCanceling,
  WebhookEventType.SubscriptionPastDue,
  WebhookEventType.RefundSucceeded,
]

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin && !authorizedByToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (!isWaffoConfigured()) {
    return NextResponse.json(
      { error: 'WAFFO_MERCHANT_ID / WAFFO_PRIVATE_KEY missing' },
      { status: 503 },
    )
  }

  const body = (await req.json().catch(() => ({}))) as { action?: string }
  const action = body.action || ''
  if (!PUBLISH_ACTIONS.has(action)) {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const storeId = process.env.WAFFO_STORE_ID || ''
  const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '')
  if (!storeId || !siteUrl) {
    return NextResponse.json({ error: 'WAFFO_STORE_ID / SITE_URL missing' }, { status: 503 })
  }

  try {
    if (action === 'publish') {
      const prod = getWaffo()
      // 测试环境用同一套商户凭据，但要把 environment 切成 test
      const test = new WaffoPancake({
        merchantId: process.env.WAFFO_MERCHANT_ID!,
        privateKey: process.env.WAFFO_PRIVATE_KEY!,
        environment: 'test',
      })

      const query = `query ($id: String!) {
        store(id: $id) {
          subscriptionProducts { id name status }
          onetimeProducts { id name status }
        }
      }`

      const [testRes, prodRes] = await Promise.all([
        test.graphql.query({ query, variables: { id: storeId } }),
        prod.graphql.query({ query, variables: { id: storeId } }),
      ])

      if (testRes.errors) throw new Error(`test query failed: ${JSON.stringify(testRes.errors)}`)
      if (prodRes.errors) throw new Error(`prod query failed: ${JSON.stringify(prodRes.errors)}`)

      const testStore = testRes.data?.store as
        | { subscriptionProducts?: { id: string; name: string }[]; onetimeProducts?: { id: string; name: string }[] }
        | undefined
      const prodStore = prodRes.data?.store as
        | { subscriptionProducts?: { id: string; name: string }[]; onetimeProducts?: { id: string; name: string }[] }
        | undefined

      const testSubs = testStore?.subscriptionProducts ?? []
      const testOnes = testStore?.onetimeProducts ?? []
      const prodSubs = prodStore?.subscriptionProducts ?? []
      const prodOnes = prodStore?.onetimeProducts ?? []

      const prodIds = new Set([...prodSubs, ...prodOnes].map((p) => p.id))
      const published: string[] = []
      const skipped: string[] = []
      const failed: { name: string; error: string }[] = []

      for (const [kind, list] of [
        ['subscription', testSubs],
        ['onetime', testOnes],
      ] as const) {
        for (const p of list) {
          if (prodIds.has(p.id)) {
            skipped.push(p.name)
            continue
          }
          try {
            if (kind === 'subscription') {
              await test.subscriptionProducts.publish({ id: p.id })
            } else {
              await test.onetimeProducts.publish({ id: p.id })
            }
            published.push(p.name)
          } catch (err) {
            failed.push({ name: p.name, error: err instanceof Error ? err.message : 'Unknown error' })
          }
        }
      }

      return NextResponse.json({ ok: failed.length === 0, published, skipped, failed })
    }

    if (action === 'inspect') {
      // 单个商品在 test / prod 两个环境里分别是什么状态。
      // publish 之前需要确认商品到底是「没发布」还是「压根没建」。
      const prod = getWaffo()
      const test = new WaffoPancake({
        merchantId: process.env.WAFFO_MERCHANT_ID!,
        privateKey: process.env.WAFFO_PRIVATE_KEY!,
        environment: 'test',
      })

      const one = `query ($id: String!) {
        subscriptionProduct(id: $id) { id name status billingPeriod }
      }`
      const two = `query ($id: String!) {
        onetimeProduct(id: $id) { id name status }
      }`

      const out: Record<string, unknown> = {}
      for (const [key, plan] of Object.entries(WAFFO_PLANS)) {
        if (!plan.productId) {
          out[key] = { error: 'productId not configured' }
          continue
        }
        const q = plan.cycle === 'once' ? two : one
        const [t, p] = await Promise.all([
          test.graphql.query({ query: q, variables: { id: plan.productId } }),
          prod.graphql.query({ query: q, variables: { id: plan.productId } }),
        ])
        const pick = (r: typeof t) => {
          if (r.errors) return { error: 'not found' }
          const d = r.data as Record<string, { id: string; name: string; status?: string } | undefined>
          const node = d?.subscriptionProduct ?? d?.onetimeProduct
          return node ? { id: node.id, name: node.name, status: node.status ?? null } : { error: 'not found' }
        }
        out[key] = { test: pick(t), prod: pick(p) }
      }
      return NextResponse.json(out)
    }

    if (action === 'webhook') {
      const client = getWaffo()
      const url = `${siteUrl}/api/payments/waffo-webhook`

      const existing = await client.graphql.query({
        query: `query ($id: String!) {
          store(id: $id) { storeWebhooks { id url testMode channel events } }
        }`,
        variables: { id: storeId },
      })

      if (existing.errors) throw new Error(JSON.stringify(existing.errors))

      const hooks = (
        (existing.data?.store as { storeWebhooks?: { id: string; url: string; testMode: boolean; channel: string }[] } | undefined)
          ?.storeWebhooks ?? []
      )

      const prodHook = hooks.find((h) => h.testMode === false)
      if (prodHook) {
        return NextResponse.json({
          ok: true,
          created: false,
          reason: 'A production webhook already exists',
          url: prodHook.url,
        })
      }

      const res = await client.webhooks.add({
        storeId,
        channel: 'http',
        url,
        events: PROD_EVENTS as unknown as `${WebhookEventType}`[],
        testMode: false,
      })

      return NextResponse.json({
        ok: true,
        created: true,
        webhookId: res.webhook?.id ?? null,
        url,
        events: PROD_EVENTS,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Action failed' },
      { status: 502 },
    )
  }
}