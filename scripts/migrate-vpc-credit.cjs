const { neon } = require('@neondatabase/serverless')

async function migrate() {
  const sql = neon(process.env.NEON_DATABASE_URL)

  // VPC credit ledger: one row per $1.00 verification fee that settled. A row is
  // created only by the Waffo webhook after the VPC charge settles (see
  // lib/payments/vpc-credit.ts); it is never written by the browser. Status
  // transitions granted -> consumed happen in place so the row stays the single
  // audit record for who / when / how much / which orders.
  await sql`
    CREATE TABLE IF NOT EXISTS vpc_credits (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL,
      amount_cents      INTEGER NOT NULL CHECK (amount_cents > 0),
      status            TEXT NOT NULL DEFAULT 'granted'
                          CHECK (status IN ('granted', 'consumed', 'void')),
      source_order_id   TEXT NOT NULL,
      first_order_id    TEXT,
      first_order_at    TIMESTAMP,
      consumed_order_id TEXT,
      consumed_at       TIMESTAMP,
      granted_at        TIMESTAMP DEFAULT NOW()
    )
  `

  // One credit per settled VPC charge: the ON CONFLICT (source_order_id) grant
  // relies on this index as its arbiter, so duplicate webhook deliveries cannot
  // mint a second credit for the same $1.00 charge.
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS vpc_credits_source_order_uidx ON vpc_credits (source_order_id)`

  await sql`CREATE INDEX IF NOT EXISTS vpc_credits_user_idx ON vpc_credits (user_id)`

  // A user may hold at most one pending credit at a time (re-verification does
  // not stack a second $1.00 credit on top of an unspent one).
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS vpc_credits_pending_uidx
      ON vpc_credits (user_id)
      WHERE status = 'granted'
  `

  console.log('vpc_credits table ready')
}

migrate().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
