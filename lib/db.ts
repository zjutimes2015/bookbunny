import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { pgTable, text, integer, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'

// Database connection
const sql = neon(process.env.NEON_DATABASE_URL!)
export const db = drizzle(sql)

// === Schema ===

export const characters = pgTable('characters', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  imageUrl: text('image_url').notNull(),
  style: text('style').notNull().default('watercolor'),
  refSeed: integer('ref_seed').notNull(),
  promptTemplate: text('prompt_template').notNull(),
  card: jsonb('card'),                          // 角色设定卡 CharacterCard（12 项）
  consistencyLine: text('consistency_line'),    // 一致性固定句（注入每页 prompt）
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const stories = pgTable('stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').array().notNull(),  // 页面文字投影（阅读进度/词汇校验用）
  outline: jsonb('outline'),                   // 结构化单页大纲 PageOutline[]（18 字段）
  ageGroup: text('age_group').notNull(),
  level: text('level'),  // GRL 分级: 'A'...'E'
  quiz: text('quiz'),    // JSON string: 阅读理解题
  theme: text('theme').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const books = pgTable('books', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  characterId: uuid('character_id').references(() => characters.id),
  storyId: uuid('story_id').references(() => stories.id),
  userId: text('user_id'),  // 创建者（家长面板按用户聚合）
  pageImageUrls: text('page_image_urls').array(),
  status: text('status').notNull().default('draft'),
  format: text('format'),
  level: text('level'),  // GRL 分级: 'A'...'E'（冗余，便于列表查询）
  aspect: text('aspect'),  // 画幅比例: 1:1 / 4:3 / 3:4 / 16:9 / a4
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Pro 动画导出任务表（animate-pro API 使用）
sql`
  CREATE TABLE IF NOT EXISTS pro_animation_jobs (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES bookbunny_users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',  -- pending / running / done / error
    total_pages INTEGER NOT NULL DEFAULT 0,
    completed_pages INTEGER NOT NULL DEFAULT 0,
    pages JSONB NOT NULL DEFAULT '[]'::jsonb,
    music_url TEXT,
    cover_url TEXT,
    final_video_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )
`.catch(() => {})
