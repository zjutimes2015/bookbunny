import { NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

/**
 * 数据库自检端点。
 *
 * 只回读 schema，不回读任何用户数据，也不返回任何连接串。
 * 部署后用来确认「列齐了没有」——新加的字段如果忘了跑迁移脚本，
 * 创作接口会 500，而日志里的 "column does not exist" 很难看出该跑哪个脚本。
 */
export const dynamic = 'force-dynamic'

/** 应用依赖的关键列；缺任何一列都会让对应功能 500 */
const REQUIRED_COLUMNS: { table: string; column: string; script: string }[] = [
  {
    table: 'bookbunny_users',
    column: 'allowance_rollover',
    script: 'node scripts/migrate-allowance-rollover.cjs',
  },
  {
    table: 'bookbunny_users',
    column: 'billing_cycle',
    script: 'node scripts/migrate-billing-cycle.cjs',
  },
  {
    table: 'bookbunny_users',
    column: 'monthly_allowance_remaining',
    script: 'node scripts/setup-auth-tables.cjs',
  },
  {
    table: 'stories',
    column: 'outline',
    script: 'node scripts/migrate-story-outline.cjs',
  },
  {
    table: 'stories',
    column: 'level',
    script: 'node scripts/migrate-leveled-reading.cjs',
  },
]

export async function GET() {
  try {
    const rows = (await sql`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE (table_name = 'bookbunny_users' AND column_name IN (
              'allowance_rollover', 'billing_cycle', 'monthly_allowance_remaining',
              'allowance_reset_at', 'credits', 'pro_animation_credits'
            ))
         OR (table_name = 'stories' AND column_name IN ('outline', 'level', 'quiz', 'series_id'))
         OR (table_name = 'books' AND column_name IN ('user_id', 'level', 'aspect', 'page_image_urls'))
    `) as { table_name: string; column_name: string }[]

    const present = new Set(rows.map((r) => `${r.table_name}.${r.column_name}`))
    const missing = REQUIRED_COLUMNS.filter(
      (c) => !present.has(`${c.table}.${c.column}`),
    ).map((c) => ({ ...c, fix: `node scripts/${c.script.split(' ').pop()}` }))

    return NextResponse.json(
      {
        ok: missing.length === 0,
        columnsChecked: REQUIRED_COLUMNS.length,
        columnsPresent: REQUIRED_COLUMNS.length - missing.length,
        missing,
      },
      { status: missing.length === 0 ? 200 : 503 },
    )
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Database check failed' },
      { status: 503 },
    )
  }
}
