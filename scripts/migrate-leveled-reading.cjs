#!/usr/bin/env node
/**
 * Migration: add level + quiz columns to BookBunny DB
 * Run: node scripts/migrate-leveled-reading.cjs
 * Idempotent: safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
 */
const fs = require('fs')
const path = require('path')
const { neon } = require('@neondatabase/serverless')

// Load NEON_DATABASE_URL from .env.local (parse simple KEY=VALUE lines)
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

  // stories: add level (GRL A-E) + quiz (JSON text)
  await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS level TEXT`
  console.log('✓ stories.level')
  await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS quiz TEXT`
  console.log('✓ stories.quiz')

  // books: add level (denormalized for list queries)
  await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS level TEXT`
  console.log('✓ books.level')

  // books: add user_id (parent panel aggregation)
  await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS user_id TEXT`
  console.log('✓ books.user_id')

  console.log('✅ Migration complete')
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
