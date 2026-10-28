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
    pro_animation_credits INTEGER DEFAULT 0,
    pro_grant_next_at TIMESTAMPTZ,
    monthly_allowance_remaining INTEGER,
    allowance_reset_at TIMESTAMPTZ,
    billing_cycle TEXT DEFAULT 'month'
  )
`.catch(() => {})

// 存量库补列（Pro 动画面包是独立商品，额度池与普通 credits 分离）
sql`ALTER TABLE bookbunny_users ADD COLUMN IF NOT EXISTS pro_animation_credits INTEGER DEFAULT 0`.catch(() => {})
// 下次应发放 Pro 额度的时点（Pro 已改为一次性购买，保留列以兼容存量数据）
sql`ALTER TABLE bookbunny_users ADD COLUMN IF NOT EXISTS pro_grant_next_at TIMESTAMPTZ`.catch(() => {})
// 计费周期：年付价格是月付的 75%，月度 allowance 必须按此区分（见 lib/allocation.ts）
sql`ALTER TABLE bookbunny_users ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'month'`.catch(() => {})
// 额度滚存：未用完的 allowance 有 50% 结转到下一周期（对外承诺过的规则）
sql`ALTER TABLE bookbunny_users ADD COLUMN IF NOT EXISTS allowance_rollover INTEGER DEFAULT 0`.catch(() => {})

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
  proAnimationCredits: integer('pro_animation_credits').default(0),
  proGrantNextAt: timestamp('pro_grant_next_at', { withTimezone: true }),
  monthlyAllowanceRemaining: integer('monthly_allowance_remaining'),
  allowanceResetAt: timestamp('allowance_reset_at', { withTimezone: true }),
  allowanceRollover: integer('allowance_rollover').default(0),
  billingCycle: text('billing_cycle').default('month'),
})
