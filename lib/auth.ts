import { NextRequest } from 'next/server'
import { neon } from '@neondatabase/serverless'

export interface SessionUser {
  id: string
  email: string
  tier: string
  isPaid: boolean
}

/**
 * 由 auth_token cookie 解析当前登录用户。
 * 无 token、过期或数据库异常一律返回 null（调用方自行决定是否放行）。
 */
export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get('auth_token')?.value
  if (!token) return null

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const rows = await sql`
      SELECT u.id, u.email, u.subscription_tier, u.is_paid
      FROM bookbunny_users u
      JOIN auth_sessions s ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
      LIMIT 1
    `
    const row = rows[0]
    if (!row) return null
    return {
      id: row.id as string,
      email: row.email as string,
      tier: (row.subscription_tier as string) || 'free',
      isPaid: Boolean(row.is_paid),
    }
  } catch {
    return null
  }
}

/** 客户端 IP（Vercel 走 x-forwarded-for，取第一个） */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
