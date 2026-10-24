/**
 * 把 data/worlds.ts 的 20 个种子世界写入 Neon（幂等 upsert，可重复执行）
 *
 * 用法: node --experimental-strip-types scripts/seed-worlds.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { WORLDS } from '../data/worlds.ts'

// 只取 NEON_DATABASE_URL，避免解析 .env.local 里的多行密钥
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
    CREATE TABLE IF NOT EXISTS worlds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age_range TEXT NOT NULL,
      theme TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      difficulty TEXT,
      scene TEXT,
      characters JSONB NOT NULL DEFAULT '[]'::jsonb,
      art_style TEXT,
      moral_pool JSONB NOT NULL DEFAULT '[]'::jsonb,
      forbidden_zones_specific JSONB NOT NULL DEFAULT '[]'::jsonb,
      sample_episode JSONB,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  for (const [index, world] of WORLDS.entries()) {
    await sql`
      INSERT INTO worlds (
        id, name, age_range, theme, status, difficulty, scene,
        characters, art_style, moral_pool, forbidden_zones_specific,
        sample_episode, sort_order, updated_at
      ) VALUES (
        ${world.id}, ${world.name}, ${world.ageRange}, ${world.theme}, ${world.status},
        ${world.difficulty}, ${world.scene},
        ${JSON.stringify(world.characters)}::jsonb, ${world.artStyle},
        ${JSON.stringify(world.moralPool)}::jsonb,
        ${JSON.stringify(world.forbiddenZonesSpecific)}::jsonb,
        ${JSON.stringify(world.sampleEpisode)}::jsonb,
        ${index}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        age_range = EXCLUDED.age_range,
        theme = EXCLUDED.theme,
        status = EXCLUDED.status,
        difficulty = EXCLUDED.difficulty,
        scene = EXCLUDED.scene,
        characters = EXCLUDED.characters,
        art_style = EXCLUDED.art_style,
        moral_pool = EXCLUDED.moral_pool,
        forbidden_zones_specific = EXCLUDED.forbidden_zones_specific,
        sample_episode = EXCLUDED.sample_episode,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `
  }

  const rows = (await sql`SELECT COUNT(*)::int AS n FROM worlds`) as { n: number }[]
  console.log(`Seeded ${WORLDS.length} worlds. Table now holds ${rows[0].n} rows.`)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
