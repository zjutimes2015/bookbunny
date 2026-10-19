/**
 * 补建缺失的鉴权/用户表（bookbunny_users + auth_sessions）。
 * 背景：lib/auth-db.ts 里的自动建表从未生效（该模块没有被任何路由 import），
 *       导致登录 / 我的书架 / 支付回调在 DB 层全部失败。
 * 字段严格对齐代码实际用法：
 *   - bookbunny_users: id/name/email/image/is_paid/subscription_tier/google_id/created_at/updated_at
 *   - auth_sessions:   token/user_id/expires_at/created_at
 * 幂等，可反复执行。
 */
const fs = require('fs')
const path = require('path')
const { neon } = require('@neondatabase/serverless')

/** 从 .env.local 读取 NEON_DATABASE_URL，避免把连接串硬编码进仓库 */
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
    CREATE TABLE IF NOT EXISTS bookbunny_users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      image TEXT,
      is_paid BOOLEAN DEFAULT FALSE,
      subscription_tier TEXT DEFAULT 'free',
      google_id TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('✓ Table: bookbunny_users')

  await sql`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES bookbunny_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('✓ Table: auth_sessions')

  await sql`ALTER TABLE bookbunny_users ADD COLUMN IF NOT EXISTS creem_customer_id TEXT`
  await sql`CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id)`

  const rows = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('bookbunny_users', 'auth_sessions', 'payments', 'stories', 'books')
    ORDER BY table_name
  `
  console.log('✅ 已存在的相关表:', rows.map(r => r.table_name).join(', '))
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
