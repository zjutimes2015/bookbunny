/**
 * 给 bookbunny_users 加 allowance_rollover 列（额度滚存）。
 *
 * 背景：对外承诺「未用完的月度额度有 50% 结转到下一个周期」，
 * 但结转部分必须单独存一列 —— 重置时才能算出「当月剩余 × 50%」这个正确基数，
 * 混在 monthly_allowance_remaining 里会算错。
 *
 * 注意：lib/auth-db.ts 里的自动 ALTER 从未生效（该模块没有被任何路由 import），
 * 所以每一列新字段都必须在这里显式迁移一次。
 *
 * 用法: node scripts/migrate-allowance-rollover.cjs
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
    ADD COLUMN IF NOT EXISTS allowance_rollover INTEGER DEFAULT 0
  `
  console.log('✓ allowance_rollover column is ready')

  const rows = await sql`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'bookbunny_users'
      AND column_name IN (
        'allowance_rollover', 'monthly_allowance_remaining',
        'allowance_reset_at', 'billing_cycle', 'subscription_tier'
      )
    ORDER BY column_name
  `
  for (const r of rows) {
    console.log(`  ${r.column_name.padEnd(28)} ${r.data_type.padEnd(28)} default=${r.column_default ?? '—'}`)
  }
})().catch((e) => {
  console.error('MIGRATION FAILED:', e?.message || e)
  process.exit(1)
})
