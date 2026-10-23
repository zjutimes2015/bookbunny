import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { pgTable, text, boolean, timestamp, integer, pgSchema } from 'drizzle-orm/pg-core'

const sql = neon(process.env.NEON_DATABASE_URL!)
export const db = drizzle(sql)

// Auto-create users table on first import
sql`
  CREATE TABLE IF NOT EXISTS bookbunny_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    image TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    subscription_tier TEXT DEFAULT 'free',
    google_id TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    credits INTEGER DEFAULT 0,
    monthly_allowance_remaining INTEGER,
    allowance_reset_at TIMESTAMPTZ
  )
`.catch(() => {})

export const users = pgTable('bookbunny_users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  image: text('image'),
  isPaid: boolean('is_paid').default(false),
  subscriptionTier: text('subscription_tier').default('free'),
  googleId: text('google_id').unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  credits: integer('credits').default(0),
  monthlyAllowanceRemaining: integer('monthly_allowance_remaining'),
  allowanceResetAt: timestamp('allowance_reset_at', { withTimezone: true }),
})
