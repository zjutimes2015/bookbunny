import { neon } from '@neondatabase/serverless'
import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { buildBookVocabulary, renderVocabularySheet, renderClassroomSheet } from '@/lib/grl/vocabulary'
import { analyzeStoryForGRL } from '@/lib/grl/analyzer'

/**
 * 教学资料导出（Teacher 档）。
 *
 * 交付三件东西：
 *   vocabulary  —— 这本书专属的词汇表（按 GRL 分组）
 *   worksheet   —— 课堂讲义（填空题 + 教师答案）
 *   report      —— GRL 可解释评分报告
 *
 * 纯文本输出，不含图片，所以不受 Vercel 4.5MB 请求体限制影响。
 */
export type TeachingExportType = 'vocabulary' | 'worksheet' | 'report'

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = (await req.json()) as {
      bookId?: string
      exportType?: TeachingExportType
    }
    const bookId = body.bookId
    const exportType: TeachingExportType = body.exportType || 'vocabulary'
    if (!bookId) {
      return Response.json({ error: 'Missing bookId' }, { status: 400 })
    }

    // 词汇表 / 讲义是付费能力（Creator+）；GRL 报告 Free 也能看
    const needsPaid = exportType === 'vocabulary' || exportType === 'worksheet'
    if (needsPaid && !user.isPaid) {
      return Response.json(
        { error: 'Teaching exports are available on paid plans' },
        { status: 403 },
      )
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const rows = await sql`
      SELECT b.id, b.title, b.level, b.user_id,
             s.content, s.outline
      FROM books b
      LEFT JOIN stories s ON s.id = b.story_id
      WHERE b.id = ${bookId}
      LIMIT 1
    `
    const row = rows[0]
    if (!row) {
      return Response.json({ error: 'Book not found' }, { status: 404 })
    }
    // 只能导出自己的书
    if (row.user_id && row.user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 正文来源优先级：stories.content → outline[].pageText
    const content: string[] = Array.isArray(row.content) ? row.content : []
    const outline = Array.isArray(row.outline)
      ? (row.outline as { pageNumber?: number; pageText?: string }[])
      : []
    const text = content.length
      ? content.join('\n')
      : outline.map(p => p.pageText ?? '').join('\n')

    if (!text.trim()) {
      return Response.json({ error: 'Book has no text content yet' }, { status: 400 })
    }

    const grl = (row.level || 'C') as string
    const bookTitle = (row.title || 'Untitled') as string

    if (exportType === 'report') {
      const report = analyzeStoryForGRL(text, grl)
      return Response.json({ report })
    }

    const vocab = buildBookVocabulary(text, grl)
    const content_ =
      exportType === 'worksheet'
        ? renderClassroomSheet(vocab, bookTitle)
        : renderVocabularySheet(vocab, bookTitle)

    const slug = bookTitle.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'book'
    const suffix = exportType === 'worksheet' ? 'worksheet' : 'vocabulary'

    return new Response(content_, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slug}-${suffix}.txt"`,
      },
    })
  } catch (err) {
    console.error('Teaching export error:', err)
    return Response.json({ error: 'Teaching export failed' }, { status: 500 })
  }
}
