const { neon } = require('@neondatabase/serverless')

async function migrate() {
  const sql = neon(process.env.NEON_DATABASE_URL)

  // Append-only consent ledger. A row is created only once a parent has passed a
  // verifiable-parental-consent step; revocation stamps revoked_at instead of deleting.
  await sql`
    CREATE TABLE IF NOT EXISTS parental_consents (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL,
      policy_version    TEXT NOT NULL,
      purposes          TEXT[] NOT NULL,
      vpc_method        TEXT NOT NULL,
      vpc_reference     TEXT,
      vpc_amount_cents  INTEGER,
      vpc_verified_at   TIMESTAMP,
      consent_ip        TEXT,
      consent_user_agent TEXT,
      granted_at        TIMESTAMP DEFAULT NOW(),
      revoked_at        TIMESTAMP,
      revoked_reason    TEXT
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS parental_consents_user_idx ON parental_consents (user_id)`

  // A parent may hold at most one live consent at a time.
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS parental_consents_active_uidx
      ON parental_consents (user_id)
      WHERE revoked_at IS NULL
  `

  console.log('parental_consents table ready')
}

migrate().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
