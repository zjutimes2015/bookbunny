import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getSessionUser } from '@/lib/auth'
import { getSeries } from '@/lib/series'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
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
        b.user_id AS book_user_id,
        s.content AS pages,
        s.outline AS outline,
        s.age_group AS age_group,
        s.theme,
        s.quiz,
        s.series_id,
        s.episode_number
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

    // 主角档案只回给这本书所属家庭的账户：世界观/作者/其它家庭都读不到
    const user = await getSessionUser(req)
    const isOwner = !!user && !!row.book_user_id && user.id === row.book_user_id
    const series = isOwner && row.series_id ? await getSeries(row.series_id as string) : null
    const owned = isOwner && series?.userId === user?.id ? series : null

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
      isOwner,
      // 「再来一集」只在本人、且有保存过主角档案的书上出现
      canContinue: owned !== null,
      seriesId: owned?.id ?? null,
      episodeNumber: (row.episode_number as number | null) ?? 1,
      seriesTitle: owned?.title ?? null,
      worldName: owned?.worldSnapshot?.name ?? null,
      protagonistName: owned?.protagonistName ?? null,
      protagonistImageUrl: owned?.protagonistImageUrl ?? null,
      consistencyLine: owned?.protagonistConsistencyLine ?? null,
      style: owned?.style ?? null,
    })
  } catch (err) {
    console.error('Get book error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
