/**
 * 阅读数据回流表（幂等迁移）
 *
 * 只记录"这一集读得怎么样"，不记录孩子是谁：user_id 是家庭账户，事件里没有任何
 * 姓名、照片或音频。跟读准确率只上传一个 0–1 的比例，声音本身不落库。
 *
 * 用法: node --experimental-strip-types scripts/migrate-analytics.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'

function loadDatabaseUrl(): string | undefined {
  if (process.env.NEON_DATABASE_URL) return process.env.NEON_DATABASE_URL
  const file = path.join(import.meta.dirname, '..', '.env.local')
  if (!fs.existsSync(file)) return undefined
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*NEON_DATABASE_URL\s*=\s*(.*)\s*$/)
    if (m) return m[1].replace(/^["']|["']$/g, '')
  }
  return undefined
}

async function main() {
  const url = loadDatabaseUrl()
  if (!url) throw new Error('NEON_DATABASE_URL not found (env or .env.local)')
  const sql = neon(url)

  await sql`
    CREATE TABLE IF NOT EXISTS reading_events (
      id BIGSERIAL PRIMARY KEY,
      book_id UUID NOT NULL,
      user_id TEXT,
      series_id UUID,
      world_id TEXT,
      event_type TEXT NOT NULL,
      page_number INTEGER,
      value_num NUMERIC(6, 4),
      value_int INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS reading_events_book_idx ON reading_events (book_id, created_at)`
  await sql`CREATE INDEX IF NOT EXISTS reading_events_world_idx ON reading_events (world_id, created_at)`

  const rows = (await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'reading_events'
    ORDER BY column_name
  `) as { column_name: string }[]
  console.log('Analytics migration done. Columns:', rows.map((r) => r.column_name).join(', '))
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
