import { cookies } from 'next/headers'
import { neon } from '@neondatabase/serverless'

/**
 * 后台管理白名单。
 *
 * 只认环境变量 ADMIN_EMAILS（逗号分隔），不引入额外的角色表：
 * 后台是运维入口，不是产品功能，白名单足够且改动面最小。
 * 未配置 ADMIN_EMAILS 时一律拒绝（fail-closed）。
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return adminEmails().includes(normalized)
}

export interface AdminSession {
  id: string
  email: string
}

/**
 * 读取当前登录态并校验是否在管理员白名单内。
 * 无 cookie、会话过期、邮箱不在白名单、数据库异常 → 一律返回 null。
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  if (adminEmails().length === 0) return null

  const token = (await cookies()).get('auth_token')?.value
  if (!token) return null

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const rows = await sql`
      SELECT u.id, u.email
      FROM bookbunny_users u
      JOIN auth_sessions s ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
      LIMIT 1
    `
    const row = rows[0]
    if (!row) return null
    if (!isAdminEmail(row.email as string)) return null
    return { id: String(row.id), email: String(row.email) }
  } catch {
    return null
  }
}
