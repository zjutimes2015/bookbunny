/**
 * Remix 地基：世界共享 + 主角私有。
 *
 * series 是「一个家庭的连续剧」：主角档案（孩子形象）挂在 series 上，只有该家庭的
 * 账户能读到；世界只以快照形式引用，作者永远看不到这个家庭的孩子。
 *
 * 本脚本幂等：ALTER TABLE ... IF NOT EXISTS，可重复执行。
 *
 * 用法: node --experimental-strip-types scripts/migrate-remix.ts
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

  // 家庭连续剧：主角档案是私有的，世界只存快照
  await sql`
    CREATE TABLE IF NOT EXISTS series (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      world_id TEXT,
      world_snapshot JSONB,
      protagonist_name TEXT NOT NULL,
      protagonist_card JSONB,
      protagonist_consistency_line TEXT,
      protagonist_image_url TEXT,
      style TEXT,
      style_lexicon JSONB,
      theme TEXT NOT NULL,
      age_group TEXT NOT NULL,
      level TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // 每一集挂在 series 上；episode_number 决定寓意轮换与续集编号
  await sql`ALTER TABLE series ADD COLUMN IF NOT EXISTS style_lexicon JSONB`
  await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS series_id UUID`
  await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS episode_number INTEGER DEFAULT 1`
  await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS remix_kind TEXT`
  await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS moral TEXT`

  await sql`CREATE INDEX IF NOT EXISTS stories_series_id_idx ON stories (series_id)`
  await sql`CREATE INDEX IF NOT EXISTS series_user_id_idx ON series (user_id)`

  const cols = (await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name IN ('series', 'stories')
      AND column_name IN ('series_id', 'episode_number', 'remix_kind', 'moral', 'user_id', 'world_snapshot')
    ORDER BY column_name
  `) as { column_name: string }[]

  console.log('Remix migration done. Columns:', cols.map((c) => c.column_name).join(', '))
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
