import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getAdminSession } from '@/lib/admin'

/**
 * GET /api/admin/users/[id]
 * 单个用户详情（仅 admin）
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    const user = await sql`
      SELECT id, name, email, image, is_paid, subscription_tier,
             credits, monthly_allowance_remaining, allowance_reset_at,
             created_at, updated_at
      FROM bookbunny_users WHERE id = ${id}
      LIMIT 1
    `
    if (!user[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const books = await sql`
      SELECT id, title, status, level, format, aspect, created_at
      FROM books WHERE user_id = ${id} ORDER BY created_at DESC LIMIT 20
    `

    const consents = await sql`
      SELECT id, child_name, child_age, parent_email, verified, created_at
      FROM parental_consents WHERE user_id = ${id} ORDER BY created_at DESC
    `

    const payments = await sql`
      SELECT id, plan, amount, currency, status, created_at
      FROM payments WHERE user_id = ${id} ORDER BY created_at DESC LIMIT 10
    `

    return NextResponse.json({
      user: user[0],
      books: books as any[],
      consents: consents as any[],
      payments: (payments as any[]).map((p: any) => ({
        ...p,
        amountDollars: Number(p.amount) / 100,
      })),
    })
  } catch (err) {
    console.error('admin user detail error:', err)
    return NextResponse.json({ error: 'Detail fetch failed' }, { status: 500 })
  }
}
