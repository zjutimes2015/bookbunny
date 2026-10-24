import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getSessionUser } from '@/lib/auth'
import {
  clampRatio,
  isReadingEventType,
  recordReadingEvents,
  type ReadingEventInput,
} from '@/lib/analytics'

const MAX_EVENTS = 50

/** 事件体只收白名单字段，页面/比例/计数全部做边界收敛 */
function sanitize(raw: unknown): ReadingEventInput | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  if (!isReadingEventType(e.type)) return null

  const page = Number(e.page)
  const count = Number(e.count)
  return {
    type: e.type,
    page: Number.isFinite(page) && page >= 1 && page <= 500 ? Math.floor(page) : undefined,
    value: clampRatio(e.value) ?? undefined,
    count: Number.isFinite(count) && count >= 0 && count <= 1000 ? Math.floor(count) : undefined,
  }
}

/**
 * 阅读事件回流：只接受这集所属家庭的写入。
 * series_id / world_id 由服务端从库里取，客户端传什么都不采信。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const bookId = typeof body?.bookId === 'string' ? body.bookId : ''
    const rawEvents: unknown[] = Array.isArray(body?.events)
      ? (body.events as unknown[]).slice(0, MAX_EVENTS)
      : []

    if (!bookId) {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })
    }

    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const events = rawEvents.map(sanitize).filter((e): e is ReadingEventInput => e !== null)
    if (events.length === 0) {
      return NextResponse.json({ error: 'No valid events' }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const rows = (await sql`
      SELECT b.user_id, s.series_id, ser.world_id
      FROM books b
      LEFT JOIN stories s ON s.id = b.story_id
      LEFT JOIN series ser ON ser.id = s.series_id
      WHERE b.id = ${bookId}
      LIMIT 1
    `) as { user_id: string | null; series_id: string | null; world_id: string | null }[]

    const book = rows[0]
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    if (book.user_id !== user.id) {
      return NextResponse.json({ error: 'This book belongs to another family' }, { status: 403 })
    }

    const recorded = await recordReadingEvents({
      bookId,
      userId: user.id,
      seriesId: book.series_id,
      worldId: book.world_id,
      events,
    })

    return NextResponse.json({ recorded })
  } catch (err) {
    console.error('Reading events error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
