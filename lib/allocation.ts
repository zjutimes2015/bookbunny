import { sql } from './neon'

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
  teacher: 40,
}

/** 年付档位的月度 allowance（价格是月付的 75%，额度同步下调） */
export const TIER_ALLOWANCE_ANNUAL: Record<string, number> = {
  creator: 6,
  studio: 16,
  teacher: 30,
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
 *
 * 13 页以上的长书（16 / 24 页档）生图张数翻倍，成本同样翻倍 → 扣 2 个单位。
 * A4 与长书同时命中时只扣 2（取最大值），不叠加，避免双重计价。
 */
export function bookCostUnits(aspect?: string | null, pages?: number | null): number {
  const wideFormat = aspect === 'a4' ? 2 : 1
  const longBook = pages && pages > 12 ? 2 : 1
  return Math.max(wideFormat, longBook)
}

/** 根据 tier 计算下一次 allowance 重置时间（下个月 1 号 00:00 UTC） */
export function nextResetAt(): Date {
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() + 1, 1)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/**
 * 额度滚存比例：未用完的 allowance 有 50% 结转到下一个周期。
 *
 * 这是对外承诺过的规则（定价页 / llms.txt 都写了 "50% of the unused
 * allowance rolling into the next cycle"），必须真正落地，否则属于虚假宣传。
 * 结转部分单独存一列，不与当月额度混在一个字段里——重置时才能算出
 * 「当月剩余 × 50%」这个正确的基数。
 */
export const ROLLOVER_RATIO = 0.5

/**
 * 计算下一周期的起始额度：本周期基础额度 + 上一周期剩余额度的 50%。
 *
 * @param tier 当前档位
 * @param cycle 计费周期
 * @param rollover 上一次结转进来的额度（已乘好比例的整数值）
 */
export function allowanceAfterReset(tier: string, cycle: 'month' | 'year', rollover: number): number {
  return (allowanceFor(tier, cycle) || 0) + Math.max(0, rollover)
}

/**
 * 确保 allowance_rollover 列存在（每个进程只跑一次）。
 *
 * 这一列是额度滚存的落地点，必须有。没有它，consumeBookAllocation 的
 * SELECT 会直接报错（column does not exist），所有创作请求 500。
 *
 * 为什么放在运行时而不是只放迁移脚本：lib/auth-db.ts 里的自动 ALTER 从未生效
 * （那个模块没有被任何路由 import），凡是靠「模块加载时自动建表/补列」保命的地方
 * 都不能信。本模块被 app/api/books 与 app/api/remix 直接 import，
 * 所以这里的自愈一定会执行。
 *
 * ALTER 之后会回读 information_schema 确认列真的在：
 *   - 并发 ALTER 可能撞车，吞掉异常会让后面的 SELECT 报一个毫无信息量的
 *     "column does not exist"，看不出是权限问题还是迁移没跑；
 *   - 回读失败就抛一条能指明下一步动作的错误（跑哪个脚本）。
 */
let ensureColumnPromise: Promise<void> | null = null
function ensureRolloverColumn(): Promise<void> {
  ensureColumnPromise ??= (async () => {
    await sql`
      ALTER TABLE bookbunny_users ADD COLUMN IF NOT EXISTS allowance_rollover INTEGER DEFAULT 0
    `.then(() => undefined).catch(() => undefined)

    const rows = (await sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'bookbunny_users' AND column_name = 'allowance_rollover'
      LIMIT 1
    `) as { '1': number }[]
    if (!rows || rows.length === 0) {
      throw new Error(
        'bookbunny_users.allowance_rollover is missing — run: node scripts/migrate-allowance-rollover.cjs',
      )
    }
  })().catch((err) => {
    // 失败后清空缓存，下次调用重试（可能是临时 DB 抖动）
    ensureColumnPromise = null
    throw err
  })
  return ensureColumnPromise
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
  // 先保证列存在：SELECT 里带了这一列，缺列会直接抛错
  await ensureRolloverColumn()

  const rows = (await sql`
    SELECT credits, subscription_tier, billing_cycle, monthly_allowance_remaining, allowance_reset_at, allowance_rollover
    FROM bookbunny_users WHERE id = ${userId}
  `) as {
    credits: number | null
    subscription_tier: string | null
    billing_cycle: string | null
    monthly_allowance_remaining: number | null
    allowance_reset_at: Date | null
    allowance_rollover: number | null
  }[]
  const row = rows[0]
  if (!row) return { ok: false, reason: 'user_not_found' }

  const tier = row.subscription_tier || 'free'
  const cycle: 'month' | 'year' = row.billing_cycle === 'year' ? 'year' : 'month'
  let allowance = row.monthly_allowance_remaining
  let resetAt = row.allowance_reset_at

  // allowance 到期：结转 50% 未用额度后重置（写绝对值，重复执行无副作用）
  if (allowance !== null && resetAt && new Date() >= resetAt) {
    const carried = Math.floor(Math.max(0, allowance) * ROLLOVER_RATIO)
    allowance = allowanceAfterReset(tier, cycle, carried)
    resetAt = nextResetAt()
    await sql`
      UPDATE bookbunny_users
      SET monthly_allowance_remaining = ${allowance},
          allowance_rollover = ${carried},
          allowance_reset_at = ${resetAt},
          updated_at = NOW()
      WHERE id = ${userId}
    `
  }

  // Free tier 用户首次创作前 allowance 可能是 null —— 先初始化一次
  if (allowance === null) {
    const initial = allowanceFor(tier, cycle) || 1
    await sql`
      UPDATE bookbunny_users
      SET monthly_allowance_remaining = ${initial},
          allowance_reset_at = ${nextResetAt()},
          updated_at = NOW()
      WHERE id = ${userId}
    `
    allowance = initial
  }

  // 原子扣减：credits 优先，其次月度 allowance
  const deducted = (await sql`
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
