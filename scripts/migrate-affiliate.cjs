const { neon } = require('@neondatabase/serverless')
const fs = require('node:fs')
const path = require('node:path')

// 读取 .env.local（脚本直跑时不会自动加载）
function loadEnv() {
  if (process.env.NEON_DATABASE_URL) return
  const file = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const [, key, raw] = match
    if (!process.env[key]) process.env[key] = raw.replace(/^["']|["']$/g, '')
  }
}

async function migrate() {
  loadEnv()
  if (!process.env.NEON_DATABASE_URL) {
    throw new Error('NEON_DATABASE_URL is not set')
  }
  const sql = neon(process.env.NEON_DATABASE_URL)

  await sql`
    CREATE TABLE IF NOT EXISTS affiliates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      tier TEXT NOT NULL DEFAULT 'tier1',
      first_rate INTEGER NOT NULL DEFAULT 30,
      recurring_rate INTEGER NOT NULL DEFAULT 15,
      payout_email TEXT,
      payout_method TEXT NOT NULL DEFAULT 'paypal',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS referrals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
      referred_user_id TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'signed_up',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      converted_at TIMESTAMPTZ
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS affiliate_commissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
      referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
      payment_id TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL,
      gross_cents INTEGER NOT NULL,
      rate INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payout_id UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS affiliate_payouts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
      amount_cents INTEGER NOT NULL,
      method TEXT NOT NULL DEFAULT 'paypal',
      reference TEXT,
      status TEXT NOT NULL DEFAULT 'requested',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL,
      ip_hash TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_code ON affiliate_clicks (code, created_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON referrals (affiliate_id, created_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON affiliate_commissions (affiliate_id, status)`
  await sql`CREATE INDEX IF NOT EXISTS idx_payouts_affiliate ON affiliate_payouts (affiliate_id, created_at DESC)`

  console.log('Affiliate tables ready')
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
