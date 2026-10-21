import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.NEON_DATABASE_URL!)

export interface RateLimitResult {
  allowed: boolean
  count: number
  limit: number
}

/**
 * 固定窗口限流（Neon 持久化，多实例/冷启动下同样有效）。
 * key 形如 `gen:ip:1.2.3.4` 或 `gen:user:<uuid>`，windowSec 为窗口长度。
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  try {
    const rows = await sql`
      INSERT INTO rate_limits (key, count, window_start)
      VALUES (${key}, 1, NOW())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_start < NOW() - make_interval(secs => ${windowSec}::int) THEN 1
          ELSE rate_limits.count + 1
        END,
        window_start = CASE
          WHEN rate_limits.window_start < NOW() - make_interval(secs => ${windowSec}::int) THEN NOW()
          ELSE rate_limits.window_start
        END
      RETURNING count
    `
    const count = Number(rows[0]?.count || 0)
    return { allowed: count <= limit, count, limit }
  } catch (err) {
    // 限流表不可用时默认放行，避免因基础设施故障阻断主流程
    console.error('Rate limit check failed:', err)
    return { allowed: true, count: 0, limit }
  }
}
