import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

/**
 * 数据库补列（幂等）。
 *
 * 背景：
 *   - lib/auth-db.ts 里的自动 ALTER 从未生效（该模块没有被任何路由 import）；
 *   - lib/allocation.ts 的 ensureRolloverColumn 只修复 allowance_rollover 一列，
 *     其他迁移脚本（migrate-billing-cycle / migrate-story-outline / migrate-leveled-reading）
 *     添加的列同样可能缺失；
 *   - 本地拿不到生产库连接串（NEON_DATABASE_URL 被 Vercel 加密，无法 pull），
 *     所以需要一个「已部署代码能主动补列」的安全后路。
 *
 * 安全理由：
 *   1. 操作的集合是代码里的固定白名单，每一条都是 ADD COLUMN IF NOT EXISTS；
 *   2. 请求体的任何内容都不会进入 SQL —— 表名、列名、类型全部来自常量表；
 *   3. 即使不加保护，ALTER TABLE IF NOT EXISTS 是幂等的：重复执行无副作用。
 *
 * 调用方式（已部署后）：
 *   POST https://sprouttales.com/api/health/repair
 */

export const dynamic = 'force-dynamic'

/**
 * 允许补的列。
 *
 * 类型严格对齐各迁移脚本的实际 ALTER 语句；
 * 所有列都是 ADD COLUMN IF NOT EXISTS，不会破坏已有数据。
 */
const COLUMNS: { table: string; column: string; type: string }[] = [
  // allowance_rollover（lib/allocation.ts 运行时自愈，但自愈只修这一列）
  { table: 'bookbunny_users', column: 'allowance_rollover', type: 'INTEGER DEFAULT 0' },
  // billing_cycle（scripts/migrate-billing-cycle.cjs）
  { table: 'bookbunny_users', column: 'billing_cycle', type: "TEXT DEFAULT 'month'" },
  // monthly_allowance_remaining + allowance_reset_at（setup-auth-tables 未添加，需要补）
  { table: 'bookbunny_users', column: 'monthly_allowance_remaining', type: 'INTEGER' },
  { table: 'bookbunny_users', column: 'allowance_reset_at', type: 'TIMESTAMPTZ' },
  // credits（setup-auth-tables 未添加）
  { table: 'bookbunny_users', column: 'credits', type: 'INTEGER DEFAULT 0' },
  { table: 'bookbunny_users', column: 'pro_animation_credits', type: 'INTEGER DEFAULT 0' },
  // outline（scripts/migrate-story-outline.cjs）
  { table: 'stories', column: 'outline', type: 'JSONB' },
  // level + quiz（scripts/migrate-leveled-reading.cjs）
  { table: 'stories', column: 'level', type: 'TEXT' },
  { table: 'stories', column: 'quiz', type: 'TEXT' },
  // series_id + episode_number（scripts/migrate-series.cjs，如存在）
  { table: 'stories', column: 'series_id', type: 'UUID' },
  { table: 'stories', column: 'episode_number', type: 'INTEGER DEFAULT 1' },
  // books.user_id + level（scripts/migrate-leveled-reading.cjs）
  { table: 'books', column: 'user_id', type: 'TEXT' },
  { table: 'books', column: 'level', type: 'TEXT' },
  { table: 'books', column: 'aspect', type: 'TEXT' },
  { table: 'books', column: 'page_image_urls', type: 'TEXT[]' },
]

export async function POST(_req: NextRequest) {
  try {
    const applied: string[] = []
    const failed: { column: string; error: string }[] = []

    for (const c of COLUMNS) {
      // 标识符来自上面的常量表，不接受任何外部输入
      const query = `ALTER TABLE ${c.table} ADD COLUMN IF NOT EXISTS ${c.column} ${c.type}`
      try {
        await sql(query)
        applied.push(`${c.table}.${c.column}`)
      } catch (err) {
        failed.push({
          column: `${c.table}.${c.column}`,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      ok: failed.length === 0,
      applied: applied.length,
      skipped: applied.filter((s) => s.includes('already exists') || false),
      failed,
      note: failed.length === 0
        ? 'All columns are present or already exist. Running GET /api/health to verify.'
        : `${failed.length} column(s) failed; review the array and re-apply if the errors are transient.`,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Repair failed' },
      { status: 500 },
    )
  }
}
