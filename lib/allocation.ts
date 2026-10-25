import { neon } from '@neondatabase/serverless'

/**
 * 各订阅档位的月度书籍 allowance。
 *
 * 额度按「满额使用仍有 80% 毛利」反推。成本口径（2026-10 实测）：
 *   - FLUX.2 flex 1:1 = $0.05/张，4:3/16:9 = $0.05/张，A4(1024x1448) = $0.10/张
 *   - LLM 大纲 ≈ $0.006/本
 *   - 单本上限 12 页 → 1:1 约 $0.61/本，A4 约 $1.21/本
 *
 * 月付与年付分开：年付价格只有月付的 75%（$261/$29、$711/$79），
 * 额度必须同比下调，否则年付的毛利会被击穿到 80% 以下。
 */
export const TIER_ALLOWANCE: Record<string, number> = {
  free: 1,
  creator: 8,
  studio: 22,
}

/** 年付档位的月度 allowance（价格是月付的 75%，额度同步下调） */
export const TIER_ALLOWANCE_ANNUAL: Record<string, number> = {
  creator: 6,
  studio: 16,
}

/**
 * 取某档位在某计费周期下的月度 allowance。
 * cycle 为 'month' | 'year'，未指定按月付计。
 */
export function allowanceFor(tier: string, cycle: 'month' | 'year' = 'month'): number {
  if (cycle === 'year') return TIER_ALLOWANCE_ANNUAL[tier] ?? TIER_ALLOWANCE[tier] ?? 0
  return TIER_ALLOWANCE[tier] ?? 0
}

/**
 * 一本书要扣几个额度单位。
 *
 * FLUX 按输出像素计费，向上取整到整 MP：
 *   1:1 / 4:3 / 3:4 / 16:9 都在 1 MP 内 → $0.05/张
 *   A4(1024×1448) = 1.41 MP → 取整 2 MP → $0.10/张（翻倍）
 * 所以 A4 画幅扣 2 个单位，保证任何档位满额使用时都有 80% 以上毛利。
 */
export function bookCostUnits(aspect?: string | null): number {
  return aspect === 'a4' ? 2 : 1
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
 *
 * 顺序：credits 优先（永不过期的一次性额度），然后扣月度 allowance。
 *
 * units：一本书要扣几个额度单位（A4 画幅 = 2，其余 = 1，见 bookCostUnits）。
 *
 * 扣减用单条带 WHERE 条件的 UPDATE 完成：
 *   - Postgres 的 UPDATE 里右侧表达式读到的都是更新前的行值，
 *     所以 CASE WHEN credits >= units 能正确判断该从哪个池子扣；
 *   - 条件 (credits >= units OR allowance >= units) 保证额度不足时不会扣成负数；
 *   - 并发请求下只有一个能命中，不会互相覆盖。
 */
export async function consumeBookAllocation(
  userId: string,
  units = 1,
): Promise<{ ok: boolean; reason?: string }> {
  const rows = (await sql()`
    SELECT credits, subscription_tier, billing_cycle, monthly_allowance_remaining, allowance_reset_at
    FROM bookbunny_users WHERE id = ${userId}
  `) as {
    credits: number | null
    subscription_tier: string | null
    billing_cycle: string | null
    monthly_allowance_remaining: number | null
    allowance_reset_at: Date | null
  }[]
  const row = rows[0]
  if (!row) return { ok: false, reason: 'user_not_found' }

  const tier = row.subscription_tier || 'free'
  const cycle: 'month' | 'year' = row.billing_cycle === 'year' ? 'year' : 'month'
  let allowance = row.monthly_allowance_remaining
  let resetAt = row.allowance_reset_at

  // allowance 到期：按当前档位与计费周期重置（写绝对值，重复执行无副作用）
  if (allowance !== null && resetAt && new Date() >= resetAt) {
    allowance = allowanceFor(tier, cycle)
    resetAt = nextResetAt()
    await sql()`
      UPDATE bookbunny_users
      SET monthly_allowance_remaining = ${allowance},
          allowance_reset_at = ${resetAt},
          updated_at = NOW()
      WHERE id = ${userId}
    `
  }

  // Free tier 用户首次创作前 allowance 可能是 null —— 先初始化一次
  if (allowance === null) {
    const initial = allowanceFor(tier, cycle) || 1
    await sql()`
      UPDATE bookbunny_users
      SET monthly_allowance_remaining = ${initial},
          allowance_reset_at = ${nextResetAt()},
          updated_at = NOW()
      WHERE id = ${userId}
    `
    allowance = initial
  }

  // 原子扣减：credits 优先，其次月度 allowance
  const deducted = (await sql()`
    UPDATE bookbunny_users
    SET credits = credits - CASE WHEN credits >= ${units} THEN ${units} ELSE 0 END,
        monthly_allowance_remaining = monthly_allowance_remaining
          - CASE WHEN credits >= ${units} THEN 0 ELSE ${units} END,
        updated_at = NOW()
    WHERE id = ${userId}
      AND (credits >= ${units} OR monthly_allowance_remaining >= ${units})
    RETURNING credits, monthly_allowance_remaining
  `) as { credits: number; monthly_allowance_remaining: number }[]

  if (deducted.length === 0) {
    return { ok: false, reason: 'no_credits_or_allowance' }
  }
  return { ok: true }
}
