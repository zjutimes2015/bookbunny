/**
 * Waffo 店铺/产品诊断（只读）
 *
 * 用法: node scripts/waffo-inspect.cjs
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

async function main() {
  const merchantId = process.env.WAFFO_MERCHANT_ID
  const privateKey = process.env.WAFFO_PRIVATE_KEY
  if (!merchantId || !privateKey) {
    console.error('缺少 WAFFO_MERCHANT_ID / WAFFO_PRIVATE_KEY')
    process.exit(1)
  }

  const client = new WaffoPancake({
    merchantId,
    privateKey,
    environment: process.env.WAFFO_TEST_MODE === 'false' ? 'prod' : 'test',
  })

  console.log('merchantId:', merchantId)

  const res = await client.graphql.query({
    query: 'query { stores { id name status } }',
  })

  if (res.errors) {
    console.error('GraphQL errors:', JSON.stringify(res.errors, null, 2))
    process.exit(1)
  }
  console.log('stores:', JSON.stringify(res.data, null, 2))

  const storeId = process.env.WAFFO_STORE_ID
  if (storeId) {
    const q = await client.graphql.query({
      query: 'query ($id: ID!) { store(id: $id) { id name status } }',
      variables: { id: storeId },
    })
    console.log('configured store:', JSON.stringify(q.data, null, 2), q.errors || '')
  }

  const target = 'STO_6dLDkeEbdxBz55WSGduhqa'
  const p = await client.graphql.query({
    query: `query ($id: String!) {
      store(id: $id) {
        id
        name
        subscriptionProducts { id name status billingPeriod prices { currency priceInfo { amount taxCategory } } }
        onetimeProducts { id name status prices { currency priceInfo { amount taxCategory } } }
      }
    }`,
    variables: { id: target },
  })
  console.log('products:', JSON.stringify(p, null, 2))
}

main().catch((e) => {
  console.error('FATAL:', e?.message || e)
  process.exit(1)
})
