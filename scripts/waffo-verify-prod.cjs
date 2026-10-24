/**
 * 生产环境冒烟验证：用 prod 环境的 Waffo 凭证为两个代表性商品创建 checkout 会话。
 * 只创建会话，不收款、不写数据库，用于确认生产凭证 + 已发布产品可用。
 *
 * 用法: node scripts/waffo-verify-prod.cjs
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

const CASES = [
  { plan: 'creator_monthly', envKey: 'WAFFO_CREATOR_MONTHLY_PRODUCT_ID' },
  { plan: 'pro_anim_5', envKey: 'WAFFO_PRO_ANIM_5_PRODUCT_ID' },
]

async function main() {
  const client = new WaffoPancake({
    merchantId: process.env.WAFFO_MERCHANT_ID,
    privateKey: process.env.WAFFO_PRIVATE_KEY,
    environment: 'prod',
  })

  console.log('environment: prod')

  for (const c of CASES) {
    const productId = process.env[c.envKey]
    if (!productId) {
      console.log(`✗ ${c.plan}: missing ${c.envKey}`)
      continue
    }
    try {
      const res = await client.checkout.authenticated.create({
        productId,
        currency: 'USD',
        buyerIdentity: 'smoke-test',
        buyerEmail: 'smoke-test@example.com',
        metadata: { plan: c.plan, tier: 'smoke-test', userId: 'smoke-test' },
        successUrl: 'https://sprouttales.com/pricing',
      })
      console.log(`✓ ${c.plan} (${productId}) -> ${res.checkoutUrl.slice(0, 72)}…`)
    } catch (err) {
      console.log(`✗ ${c.plan} (${productId}): ${err?.message || err}`)
    }
  }
}

main().catch((e) => {
  console.error('FATAL:', e?.message || e)
  process.exit(1)
})
