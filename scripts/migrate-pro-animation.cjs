/**
 * 建 Pro 动画任务表。
 *
 * 注意 book_id 必须是 uuid（与 books.id 一致）：早先的定义写成 TEXT，
 * 外键创建失败又被 `.catch(() => {})` 吞掉，导致生产库一直没有这张表，
 * Pro 动画一创建就报 relation does not exist。
 */
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

function databaseUrl() {
  if (process.env.NEON_DATABASE_URL) return process.env.NEON_DATABASE_URL

  const envPath = path.join(__dirname, '..', '.env.local')
  const raw = fs.readFileSync(envPath, 'utf8')
  return raw.match(/^NEON_DATABASE_URL=(.*)$/m)?.[1]?.trim()
}

const sql = neon(databaseUrl())

;(async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS pro_animation_jobs (
      id TEXT PRIMARY KEY,
      book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES bookbunny_users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      total_pages INTEGER NOT NULL DEFAULT 0,
      completed_pages INTEGER NOT NULL DEFAULT 0,
      pages JSONB NOT NULL DEFAULT '[]'::jsonb,
      music_url TEXT,
      cover_url TEXT,
      final_video_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('pro_animation_jobs is ready')
})()
