import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params
    if (!bookId) {
      return NextResponse.json({ error: 'Missing book id' }, { status: 400 })
    }

    const result = await sql`
      SELECT
        b.id,
        b.title,
        b.level,
        b.aspect,
        b.page_image_urls,
        b.created_at,
        s.content AS pages,
        s.outline AS outline,
        s.age_group AS age_group,
        s.theme,
        s.quiz
      FROM books b
      LEFT JOIN stories s ON s.id = b.story_id
      WHERE b.id = ${bookId}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    const row = result[0]
    let quiz = null
    if (row.quiz) {
      try {
        quiz = typeof row.quiz === 'string' ? JSON.parse(row.quiz) : row.quiz
      } catch {
        quiz = null
      }
    }

    return NextResponse.json({
      id: row.id,
      title: row.title,
      pages: row.pages || [],
      outline: row.outline || null,
      ageGroup: row.age_group || '',
      theme: row.theme || '',
      level: row.level || null,
      aspect: row.aspect || null,
      pageImageUrls: row.page_image_urls || [],
      quiz,
      createdAt: row.created_at,
    })
  } catch (err) {
    console.error('Get book error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
