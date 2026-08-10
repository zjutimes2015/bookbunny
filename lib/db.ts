import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core'

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
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const stories = pgTable('stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').array().notNull(),
  ageGroup: text('age_group').notNull(),
  theme: text('theme').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const books = pgTable('books', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  characterId: uuid('character_id').references(() => characters.id),
  storyId: uuid('story_id').references(() => stories.id),
  pageImageUrls: text('page_image_urls').array(),
  status: text('status').notNull().default('draft'),
  format: text('format'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
