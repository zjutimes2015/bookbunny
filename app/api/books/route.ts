import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.NEON_DATABASE_URL!)

interface SaveBookBody {
  title: string
  pages: string[]
  ageGroup: string
  theme: string
  level?: string | null
  quiz?: unknown | null
}

// 从 cookie 解析当前用户（与 /api/auth/me 同一套逻辑）
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SaveBookBody

    if (!body.title || !Array.isArray(body.pages) || body.pages.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userId = await getUserId(req)

    // 1. 保存 story（含 level + quiz JSON）
    const quizJson = body.quiz ? JSON.stringify(body.quiz) : null
    const storyResult = await sql`
      INSERT INTO stories (title, content, age_group, theme, level, quiz)
      VALUES (${body.title}, ${body.pages}, ${body.ageGroup}, ${body.theme}, ${body.level || null}, ${quizJson})
      RETURNING id
    `
    const storyId = storyResult[0]?.id
    if (!storyId) throw new Error('Failed to insert story')

    // 2. 保存 book（关联 story + 用户，冗余 level 便于列表查询）
    const bookResult = await sql`
      INSERT INTO books (title, story_id, user_id, status, format, level)
      VALUES (${body.title}, ${storyId}, ${userId}, 'ready', 'ebook', ${body.level || null})
      RETURNING id
    `
    const bookId = bookResult[0]?.id
    if (!bookId) throw new Error('Failed to insert book')

    return NextResponse.json({ bookId, storyId })
  } catch (err) {
    console.error('Save book error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
