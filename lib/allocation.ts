import { neon } from '@neondatabase/serverless'

/** 各订阅档位的月度书籍 allowance */
export const TIER_ALLOWANCE: Record<string, number> = {
  free: 3,
  creator: 30,
  studio: 100,
}

/** 根据 tier 计算下一次 allowance 重置时间（下个月 1 号 00:00 UTC） */
export function nextResetAt(): Date {
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() + 1, 1)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

let client: ReturnType<typeof neon> | null = null
function sql() {
  return (client ??= neon(process.env.NEON_DATABASE_URL!))
}

/**
 * 扣减 credits / 月度 allowance。
 * 顺序：credits 优先（永不过期的一次性额度），然后扣月度 allowance。
 * 如果两者都不够，返回 { ok: false }。
 */
export async function consumeBookAllocation(
  userId: string,
): Promise<{ ok: boolean; reason?: string }> {
  // 先查出最新状态
  const rows = (await sql()`
    SELECT credits, subscription_tier, monthly_allowance_remaining, allowance_reset_at
    FROM bookbunny_users WHERE id = ${userId}
  `) as {
    credits: number | null
    subscription_tier: string | null
    monthly_allowance_remaining: number | null
    allowance_reset_at: Date | null
  }[]
  const row = rows[0]
  if (!row) return { ok: false, reason: 'user_not_found' }

  const credits = row.credits ?? 0
  const tier = row.subscription_tier || 'free'
  let allowance = row.monthly_allowance_remaining
  let resetAt = row.allowance_reset_at

  // 检查 allowance 是否到期需要重置
  if (allowance !== null && resetAt && new Date() >= resetAt) {
    allowance = TIER_ALLOWANCE[tier] ?? 0
    resetAt = nextResetAt()
    await sql()`
      UPDATE bookbunny_users
      SET monthly_allowance_remaining = ${allowance},
          allowance_reset_at = ${resetAt},
          updated_at = NOW()
      WHERE id = ${userId}
    `
  }

  // 1. 优先扣 credits（一次性、永不过期）
  if (credits > 0) {
    await sql()`
      UPDATE bookbunny_users SET credits = credits - 1, updated_at = NOW() WHERE id = ${userId}
    `
    return { ok: true }
  }

  // 2. 再扣月度 allowance
  if (allowance !== null && allowance > 0) {
    await sql()`
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
    await sql()`
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
