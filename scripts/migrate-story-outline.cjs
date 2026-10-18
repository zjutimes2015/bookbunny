#!/usr/bin/env node
/**
 * Migration: add outline (jsonb) column to stories table
 * 结构化单页大纲 PageOutline[]（《AI 制作绘本的超详细攻略》第四章，18 字段）
 * Run: node scripts/migrate-story-outline.cjs
 * Idempotent: safe to re-run (ADD COLUMN IF NOT EXISTS)
 * 注意：不修改/不删除既有 content 列（保留为页面文字投影，兼容存量数据）
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

  // stories: add outline (结构化单页大纲 JSON)
  await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS outline JSONB`
  console.log('✓ stories.outline')

  console.log('✅ Migration complete')
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
