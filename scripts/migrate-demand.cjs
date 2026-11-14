const { neon } = require('@neondatabase/serverless')

async function migrate() {
  const sql = neon(process.env.NEON_DATABASE_URL)

  // Demand cache: one row per normalized theme (+ title for listings) per
  // marketplace/language. Payload is the versioned score/listing JSON; the
  // routes serve a row past expires_at as stale data on API failure, labeled
  // with its fetched_at date. TTL is 30 days (D3); expiry is enforced by the
  // readers, not by deletion, so stale fallback survives.
  await sql`
    CREATE TABLE IF NOT EXISTS demand_cache (
      cache_key     TEXT PRIMARY KEY,
      kind          TEXT NOT NULL CHECK (kind IN ('score', 'listing')),
      theme_key     TEXT NOT NULL,
      marketplace   TEXT NOT NULL DEFAULT 'amazon.com',
      language      TEXT NOT NULL DEFAULT 'en',
      payload       JSONB NOT NULL,
      fetched_at    TIMESTAMP DEFAULT NOW(),
      expires_at    TIMESTAMP NOT NULL
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS demand_cache_theme_idx ON demand_cache (theme_key)`
  await sql`CREATE INDEX IF NOT EXISTS demand_cache_kind_idx ON demand_cache (kind)`

  // Demand call log: one row per lookup (cache hit or live call). The monthly
  // budget fuse (R5) sums estimated_cost_usd over the current calendar month,
  // so this table must exist for the fuse to count; readers fail open to 0
  // when it does not. estimated_cost_usd is 0 for cache hits.
  await sql`
    CREATE TABLE IF NOT EXISTS demand_calls (
      id                  SERIAL PRIMARY KEY,
      created_at          TIMESTAMP DEFAULT NOW(),
      route               TEXT NOT NULL CHECK (route IN ('score', 'listing-suggestions')),
      user_id             TEXT NOT NULL,
      theme_key           TEXT NOT NULL,
      cache_hit           BOOLEAN NOT NULL DEFAULT FALSE,
      estimated_cost_usd  NUMERIC(10, 6) NOT NULL DEFAULT 0,
      price_version       TEXT NOT NULL DEFAULT 'labs-amazon-2026-11-14'
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS demand_calls_created_idx ON demand_calls (created_at)`
  await sql`CREATE INDEX IF NOT EXISTS demand_calls_user_idx ON demand_calls (user_id)`

  console.log('demand_cache + demand_calls tables ready')
}

migrate().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
