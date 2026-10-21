/** 生成任务持久化 + 限流 + 额度表迁移 */
const fs = require('fs')
const path = require('path')
const { neon } = require('@neondatabase/serverless')

function loadDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const env = fs.readFileSync(envPath, 'utf-8')
  const match = env.match(/^\s*NEON_DATABASE_URL\s*=\s*(.+)$/m)
  if (!match) throw new Error('NEON_DATABASE_URL not found in .env.local')
  return match[1].trim().replace(/^["']|["']$/g, '')
}

async function main() {
  const sql = neon(loadDatabaseUrl())

  await sql`
    CREATE TABLE IF NOT EXISTS generation_jobs (
      id TEXT PRIMARY KEY,
      book_id UUID,
      status TEXT NOT NULL DEFAULT 'running',
      total INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      pages JSONB NOT NULL DEFAULT '[]'::jsonb,
      error TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('✓ Table: generation_jobs')

  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0,
      window_start TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('✓ Table: rate_limits')

  await sql`ALTER TABLE bookbunny_users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0`
  console.log('✓ Column: bookbunny_users.credits')

  console.log('\n✅ Migration complete')
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
