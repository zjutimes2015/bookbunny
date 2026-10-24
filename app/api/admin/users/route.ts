import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getAdminSession } from '@/lib/admin'

/**
 * GET /api/admin/users
 * 分页+搜索用户列表（仅 admin）
 */
export async function GET(request: Request) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? 20)))
  const search = (searchParams.get('search') ?? '').trim()
  const tier = searchParams.get('tier') ?? ''

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    let where = ''
    const params: any[] = []
    if (search) {
      where += ` AND (u.name ILIKE ${params.length + 1} OR u.email ILIKE ${params.length + 1})`
      params.push(`%${search}%`)
    }
    if (tier) {
      where += ` AND u.subscription_tier = ${params.length + 1}`
      params.push(tier)
    }

    // 总数
    const countRow = await sql`
      SELECT COUNT(*) as cnt FROM bookbunny_users u WHERE 1=1 ${where as any}
    `
    const total = Number(countRow[0]?.cnt ?? 0)

    // 分页查询
    const offset = (page - 1) * pageSize
    const rows = await sql`
      SELECT
        u.id, u.name, u.email, u.image,
        u.is_paid, u.subscription_tier,
        u.credits, u.monthly_allowance_remaining,
        u.created_at,
        (SELECT COUNT(*) FROM books b WHERE b.user_id = u.id) as book_count
      FROM bookbunny_users u
      WHERE 1=1 ${where as any}
      ORDER BY u.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `

    // 每个用户最近的活动（可选，简化只返回 book_count）
    return NextResponse.json({
      users: (rows as any[]).map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        image: r.image,
        isPaid: r.is_paid,
        subscriptionTier: r.subscription_tier,
        credits: r.credits,
        monthlyAllowanceRemaining: r.monthly_allowance_remaining,
        bookCount: Number(r.book_count ?? 0),
        createdAt: r.created_at,
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (err) {
    console.error('admin users error:', err)
    return NextResponse.json({ error: 'Users fetch failed' }, { status: 500 })
  }
}
