import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getSessionUser } from '@/lib/auth'
import { getBookInsights } from '@/lib/analytics'

/** 单集学情：只回给这集所属家庭 */
export async function GET(req: NextRequest) {
  try {
    const bookId = req.nextUrl.searchParams.get('bookId') || ''
    if (!bookId) return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })

    const user = await getSessionUser(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const rows = (await sql`
      SELECT user_id FROM books WHERE id = ${bookId} LIMIT 1
    `) as { user_id: string | null }[]

    if (rows.length === 0) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    if (rows[0].user_id !== user.id) {
      return NextResponse.json({ error: 'This book belongs to another family' }, { status: 403 })
    }

    return NextResponse.json(await getBookInsights(bookId))
  } catch (err) {
    console.error('Book insights error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
