#!/usr/bin/env node
/**
 * Migration: 角色一致性 + 画幅比例（阶段3）
 * - characters: card (jsonb 角色设定卡) / consistency_line (一致性固定句)
 * - books: aspect (画幅比例: 1:1 / 4:3 / 3:4 / 16:9 / a4)
 * Run: node scripts/migrate-character-consistency.cjs
 * Idempotent: safe to re-run (ADD COLUMN IF NOT EXISTS)
 */
const fs = require('fs')
const path = require('path')
const { neon } = require('@neondatabase/serverless')

function loadEnv(file) {
  const content = fs.readFileSync(file, 'utf-8')
  const result = {}
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/)
    if (m) result[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return result
}

async function main() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const env = loadEnv(envPath)
  const url = env.NEON_DATABASE_URL
  if (!url) throw new Error('NEON_DATABASE_URL not found in .env.local')

  const sql = neon(url)

  await sql`ALTER TABLE characters ADD COLUMN IF NOT EXISTS card JSONB`
  console.log('✓ characters.card')
  await sql`ALTER TABLE characters ADD COLUMN IF NOT EXISTS consistency_line TEXT`
  console.log('✓ characters.consistency_line')
  await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS aspect TEXT`
  console.log('✓ books.aspect')

  console.log('✅ Migration complete')
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
