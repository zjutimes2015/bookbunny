/**
 * Waffo 产品开通：在 SproutTales 店铺创建订阅 + 一次性商品，并发布到生产。
 *
 * 幂等：按产品名匹配，已存在则跳过创建，必要时补 publish。
 *
 * 用法:
 *   node scripts/waffo-provision.cjs            # 执行
 *   node scripts/waffo-provision.cjs --dry-run  # 只打印计划
 */
const fs = require('fs')
const path = require('path')

function loadEnv(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

loadEnv(path.join(__dirname, '..', '.env.local'))

const { WaffoPancake } = require('@waffo/pancake-ts')

const STORE_ID = process.env.WAFFO_STORE_ID || 'STO_6dLDkeEbdxBz55WSGduhqa'
const DRY = process.argv.includes('--dry-run')

const TAX = 'digital_goods'

/** 产品清单：与 lib/payments/waffo.ts 的 WAFFO_PLANS 一一对应 */
const PRODUCTS = [
  { kind: 'subscription', key: 'WAFFO_CREATOR_MONTHLY_PRODUCT_ID', name: 'Creator Monthly', billingPeriod: 'monthly', amount: '29.00', description: '30 books/month, KDP export, commercial license' },
  { kind: 'subscription', key: 'WAFFO_CREATOR_ANNUAL_PRODUCT_ID', name: 'Creator Annual', billingPeriod: 'yearly', amount: '261.00', description: '30 books/month, KDP export, commercial license (annual)' },
  { kind: 'subscription', key: 'WAFFO_STUDIO_MONTHLY_PRODUCT_ID', name: 'Studio Monthly', billingPeriod: 'monthly', amount: '79.00', description: '100 books/month + 10 Pro animated books, batch generation' },
  { kind: 'subscription', key: 'WAFFO_STUDIO_ANNUAL_PRODUCT_ID', name: 'Studio Annual', billingPeriod: 'yearly', amount: '711.00', description: '100 books/month + 10 Pro animated books (annual)' },
  { kind: 'onetime', key: 'WAFFO_PRO_ANIM_5_PRODUCT_ID', name: 'Pro Animation Pack · 5 Books', amount: '12.00', description: '5 animated books with video, voice and music — never expires' },
  { kind: 'onetime', key: 'WAFFO_PRO_ANIM_10_PRODUCT_ID', name: 'Pro Animation Pack · 10 Books', amount: '20.00', description: '10 animated books with video, voice and music — never expires' },
]

async function main() {
  const merchantId = process.env.WAFFO_MERCHANT_ID
  const privateKey = process.env.WAFFO_PRIVATE_KEY
  if (!merchantId || !privateKey) {
    throw new Error('缺少 WAFFO_MERCHANT_ID / WAFFO_PRIVATE_KEY')
  }

  // 始终用 test 环境创建（test version 由 publish 推到生产）
  const client = new WaffoPancake({ merchantId, privateKey, environment: 'test' })

  console.log(`store: ${STORE_ID}${DRY ? '  (dry-run)' : ''}`)

  const existing = await client.graphql.query({
    query: `query ($id: String!) {
      store(id: $id) {
        subscriptionProducts { id name status }
        onetimeProducts { id name status }
      }
    }`,
    variables: { id: STORE_ID },
  })
  if (existing.errors) throw new Error(JSON.stringify(existing.errors))

  const subs = existing.data?.store?.subscriptionProducts ?? []
  const ones = existing.data?.store?.onetimeProducts ?? []
  console.log(`existing: ${subs.length} subscription, ${ones.length} one-time`)

  const result = {}

  for (const p of PRODUCTS) {
    const list = p.kind === 'subscription' ? subs : ones
    const found = list.find((x) => x.name === p.name)

    if (found) {
      console.log(`= ${p.name} already exists (${found.id}, ${found.status})`)
      result[p.key] = found.id
      continue
    }

    if (DRY) {
      console.log(`+ would create ${p.name} (${p.kind}, $${p.amount})`)
      continue
    }

    const prices = { USD: { amount: p.amount, taxCategory: TAX } }
    const params = {
      storeId: STORE_ID,
      name: p.name,
      prices,
      description: p.description,
    }

    const created =
      p.kind === 'subscription'
        ? await client.subscriptionProducts.create({ ...params, billingPeriod: p.billingPeriod })
        : await client.onetimeProducts.create(params)

    if (!created?.product?.id) {
      throw new Error(`create failed for ${p.name}: ${JSON.stringify(created)}`)
    }

    const id = created.product.id
    console.log(`+ created ${p.name} -> ${id}`)
    result[p.key] = id

    // test version → 生产版本
    try {
      if (p.kind === 'subscription') {
        await client.subscriptionProducts.publish({ id })
      } else {
        await client.onetimeProducts.publish({ id })
      }
      console.log(`  ↳ published to production`)
    } catch (err) {
      console.warn(`  ↳ publish failed: ${err?.message || err}`)
    }
  }

  console.log('\n--- product IDs ---')
  for (const p of PRODUCTS) {
    if (result[p.key]) console.log(`${p.key}=${result[p.key]}`)
  }
  if (DRY) console.log('(dry-run: nothing was created)')
}

main().catch((e) => {
  console.error('FATAL:', e?.message || e)
  process.exit(1)
})
