import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

// 与 /api/auth/me 同一套 cookie 认证
async function getUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('auth_token')?.value
  if (!token) return null
  try {
    const result = await sql`
      SELECT u.id
      FROM bookbunny_users u
      JOIN auth_sessions s ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
      LIMIT 1
    `
    return result[0]?.id || null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 1. 该书单（含 level/quiz 状态）
    const books = await sql`
      SELECT b.id, b.title, b.level, b.created_at,
             s.content AS pages, s.quiz
      FROM books b
      LEFT JOIN stories s ON s.id = b.story_id
      WHERE b.user_id = ${userId}
      ORDER BY b.created_at DESC
      LIMIT 100
    `

    // 2. Level 分布聚合（SQL 端算好，避免前端循环）
    const dist = await sql`
      SELECT COALESCE(level, 'none') AS level, COUNT(*)::int AS cnt
      FROM books
      WHERE user_id = ${userId}
      GROUP BY level
    `
    const levelDistribution: Record<string, number> = {}
    let booksRead = 0
    for (const d of dist) {
      levelDistribution[d.level] = d.cnt
      if (d.level !== 'none') booksRead += d.cnt
    }

    // 3. 建议下一本：从现有已读书的最高 level 推导（A→B→C→D→E）
    const LEVEL_ORDER = ['A', 'B', 'C', 'D', 'E']
    const currentMax = books
      .map(b => b.level)
      .filter((l): l is string => !!l && LEVEL_ORDER.includes(l))
      .sort((a, b) => LEVEL_ORDER.indexOf(b) - LEVEL_ORDER.indexOf(a))[0]
    const currentIdx = currentMax ? LEVEL_ORDER.indexOf(currentMax) : -1
    const nextLevel = currentIdx >= 0 && currentIdx < LEVEL_ORDER.length - 1
      ? LEVEL_ORDER[currentIdx + 1]
      : currentIdx === LEVEL_ORDER.length - 1
        ? currentMax // 已到最高级，建议复习
        : 'A' // 还没读过带分级的书

    const booksList = books.map(b => ({
      id: b.id,
      title: b.title,
      level: b.level || null,
      hasQuiz: !!b.quiz,
      pageCount: Array.isArray(b.pages) ? b.pages.length : 0,
      createdAt: b.created_at,
    }))

    return NextResponse.json({
      booksRead,
      levelDistribution,
      nextLevel,
      books: booksList,
    })
  } catch (err) {
    console.error('Reading progress error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
