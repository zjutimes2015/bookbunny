const { neon } = require('@neondatabase/serverless')

async function migrate() {
  const sql = neon(process.env.NEON_DATABASE_URL)
  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      plan TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  try {
    await sql`ALTER TABLE bookbunny_users ADD COLUMN IF NOT EXISTS creem_customer_id TEXT`
  } catch {}
  console.log('Payments table ready')
}

migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
