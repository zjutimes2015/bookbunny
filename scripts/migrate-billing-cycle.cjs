/**
 * 给 bookbunny_users 加 billing_cycle 列。
 *
 * 年付价格只有月付的 75%（$261/$29、$711/$79），月度 allowance 必须按计费周期区分，
 * 否则年付用户的毛利会被击穿到 80% 以下（见 lib/allocation.ts）。
 *
 * 用法: node scripts/migrate-billing-cycle.cjs
 */
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

function databaseUrl() {
  if (process.env.NEON_DATABASE_URL) return process.env.NEON_DATABASE_URL

  const envPath = path.join(__dirname, '..', '.env.local')
  const raw = fs.readFileSync(envPath, 'utf8')
  return raw.match(/^NEON_DATABASE_URL=(.*)$/m)?.[1]?.trim()
}

const sql = neon(databaseUrl())

;(async () => {
  await sql`
    ALTER TABLE bookbunny_users
    ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'month'
  `
  console.log('billing_cycle column is ready')

  // 存量付费用户默认按月付额度回填，避免升级后 allowance 突然变大
  const updated = await sql`
    UPDATE bookbunny_users
    SET billing_cycle = 'month'
    WHERE subscription_tier IN ('creator', 'studio') AND billing_cycle IS NULL
    RETURNING id
  `
  console.log(`backfilled ${updated.length} existing paid users to 'month'`)

  const rows = await sql`
    SELECT subscription_tier, billing_cycle, COUNT(*)::int AS cnt
    FROM bookbunny_users
    GROUP BY subscription_tier, billing_cycle
    ORDER BY cnt DESC
  `
  console.log('current distribution:', JSON.stringify(rows))
})().catch((e) => {
  console.error('MIGRATION FAILED:', e?.message || e)
  process.exit(1)
})
