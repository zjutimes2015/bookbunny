import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { outlineToPages, type PageOutline } from '@/lib/types/book'

const sql = neon(process.env.NEON_DATABASE_URL!)

interface SaveBookBody {
  title: string
  pages?: string[]
  outline?: PageOutline[]
  ageGroup: string
  theme: string
  level?: string | null
  quiz?: unknown | null
  aspect?: string | null
}

// 从 cookie 解析当前用户 + 其 credits / allowance 状态
async function getUserId(req: NextRequest): Promise<{
  id: string | null
  credits: number
  tier: string
  isPaid: boolean
  allowanceRemaining: number | null
  allowanceResetAt: Date | null
} | null> {
  const token = req.cookies.get('auth_token')?.value
  if (!token) return null
  try {
    const rows = await sql`
      SELECT u.id, u.credits, u.subscription_tier, u.is_paid,
             u.monthly_allowance_remaining, u.allowance_reset_at
      FROM bookbunny_users u
      JOIN auth_sessions s ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
      LIMIT 1
    `
    const row = rows[0]
    if (!row) return null
    return {
      id: row.id as string,
      credits: (row.credits as number) ?? 0,
      tier: (row.subscription_tier as string) || 'free',
      isPaid: Boolean(row.is_paid),
      allowanceRemaining: row.monthly_allowance_remaining as number | null,
      allowanceResetAt: row.allowance_reset_at as Date | null,
    }
  } catch {
    return null
  }
}

/** 各订阅档位的月度书籍 allowance */
const TIER_ALLOWANCE: Record<string, number> = {
  free: 3,
  creator: 30,
  studio: 100,
}

/** 根据 tier 计算下一次 allowance 重置时间（下个月同日 00:00 UTC） */
function nextResetAt(): Date {
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() + 1, 1)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/**
 * 扣减 credits / 月度 allowance。
 * 顺序：credits 优先（永不过期的一次性额度），然后扣月度 allowance。
 * 如果两者都不够，返回 { ok: false }。
 */
async function consumeBookAllocation(userId: string): Promise<{ ok: boolean; reason?: string }> {
  // 先查出最新状态
  const rows = await sql`
    SELECT credits, subscription_tier, monthly_allowance_remaining, allowance_reset_at
    FROM bookbunny_users WHERE id = ${userId}
  `
  const row = rows[0]
  if (!row) return { ok: false, reason: 'user_not_found' }

  const credits = (row.credits as number) ?? 0
  const tier = (row.subscription_tier as string) || 'free'
  let allowance = row.monthly_allowance_remaining as number | null
  let resetAt = row.allowance_reset_at as Date | null

  // 检查 allowance 是否到期需要重置
  if (allowance !== null && resetAt && new Date() >= resetAt) {
    allowance = TIER_ALLOWANCE[tier] ?? 0
    resetAt = nextResetAt()
    await sql`
      UPDATE bookbunny_users
      SET monthly_allowance_remaining = ${allowance},
          allowance_reset_at = ${resetAt},
          updated_at = NOW()
      WHERE id = ${userId}
    `
  }

  // 1. 优先扣 credits（一次性、永不过期）
  if (credits > 0) {
    await sql`
      UPDATE bookbunny_users SET credits = credits - 1, updated_at = NOW() WHERE id = ${userId}
    `
    return { ok: true }
  }

  // 2. 再扣月度 allowance
  if (allowance !== null && allowance > 0) {
    await sql`
      UPDATE bookbunny_users
      SET monthly_allowance_remaining = monthly_allowance_remaining - 1,
          updated_at = NOW()
      WHERE id = ${userId}
    `
    return { ok: true }
  }

  // Free tier 用户首次创作前 allowance 可能是 null —— 给它初始化一次
  if (allowance === null) {
    const initial = TIER_ALLOWANCE[tier] ?? 1
    await sql`
      UPDATE bookbunny_users
      SET monthly_allowance_remaining = ${initial},
          allowance_reset_at = ${nextResetAt()},
          updated_at = NOW()
      WHERE id = ${userId}
    `
    return consumeBookAllocation(userId) // 重试扣减
  }

  return { ok: false, reason: 'no_credits_or_allowance' }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SaveBookBody

    const hasOutline = Array.isArray(body.outline) && body.outline.length > 0
    const hasPages = Array.isArray(body.pages) && body.pages.length > 0

    if (!body.title || (!hasOutline && !hasPages)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // content = 页面文字投影（优先从 outline 提取，回退到旧的 pages）
    const content = hasOutline ? outlineToPages(body.outline!) : (body.pages as string[])
    const outlineJson = hasOutline ? JSON.stringify(body.outline) : null

    const user = await getUserId(req)

    // 1. 保存 story（含 outline jsonb + level + quiz JSON）
    const quizJson = body.quiz ? JSON.stringify(body.quiz) : null
    const storyResult = await sql`
      INSERT INTO stories (title, content, outline, age_group, theme, level, quiz)
      VALUES (${body.title}, ${content}, ${outlineJson}::jsonb, ${body.ageGroup}, ${body.theme}, ${body.level || null}, ${quizJson})
      RETURNING id
    `
    const storyId = storyResult[0]?.id
    if (!storyId) throw new Error('Failed to insert story')

    // 2. 保存 book（关联 story + 用户，冗余 level 便于列表查询）
    const bookResult = await sql`
      INSERT INTO books (title, story_id, user_id, status, format, level, aspect)
      VALUES (${body.title}, ${storyId}, ${user?.id ?? null}, 'ready', 'ebook', ${body.level || null}, ${body.aspect || null})
      RETURNING id
    `
    const bookId = bookResult[0]?.id
    if (!bookId) throw new Error('Failed to insert book')

    // 3. 扣减 credits / 月度 allowance（游客 user.id 为 null 时跳过，免费游客不扣费）
    if (user?.id) {
      const alloc = await consumeBookAllocation(user.id)
      if (!alloc.ok) {
        // book 已经保存了，但 allocation 扣减失败。我们已经初始化过 free tier 的 allowance，
        // 所以走到这里说明 credits=0 且 allowance=0。返回 402 让前端引导用户升级。
        return NextResponse.json(
          { error: 'No credits or allowance left. Upgrade or buy credits to make more books.', code: 'no_allocation' },
          { status: 402 },
        )
      }
    }

    return NextResponse.json({ bookId, storyId })
  } catch (err) {
    console.error('Save book error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
