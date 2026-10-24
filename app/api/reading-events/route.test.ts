import { describe, it, expect, beforeEach, vi } from 'vitest'

const { getSessionUserMock, recordMock, neonMock } = vi.hoisted(() => ({
  getSessionUserMock: vi.fn(),
  recordMock: vi.fn(),
  neonMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getSessionUser: getSessionUserMock }))
vi.mock('@/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/analytics')>()
  return { ...actual, recordReadingEvents: recordMock }
})
vi.mock('@neondatabase/serverless', () => ({ neon: neonMock }))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/reading-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0]
}

/** 让 `neon(url)` 返回一个记录查询结果的 tagged template */
function bookLookup(rows: unknown[]) {
  neonMock.mockReturnValue(async () => rows)
}

describe('POST /api/reading-events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSessionUserMock.mockResolvedValue({ id: 'user-1' })
    recordMock.mockResolvedValue(1)
    bookLookup([{ user_id: 'user-1', series_id: 'series-1', world_id: 'world-star-farm' }])
  })

  it('requires a bookId', async () => {
    const res = await POST(makeRequest({ events: [{ type: 'book_open' }] }))
    expect(res.status).toBe(400)
  })

  it('requires a signed-in family account', async () => {
    getSessionUserMock.mockResolvedValue(null)
    const res = await POST(makeRequest({ bookId: 'book-1', events: [{ type: 'book_open' }] }))
    expect(res.status).toBe(401)
    expect(recordMock).not.toHaveBeenCalled()
  })

  it('returns 404 for an unknown book', async () => {
    bookLookup([])
    const res = await POST(makeRequest({ bookId: 'book-1', events: [{ type: 'book_open' }] }))
    expect(res.status).toBe(404)
  })

  it('refuses to record events for another family’s book', async () => {
    bookLookup([{ user_id: 'someone-else', series_id: null, world_id: null }])
    const res = await POST(makeRequest({ bookId: 'book-1', events: [{ type: 'book_open' }] }))
    expect(res.status).toBe(403)
    expect(recordMock).not.toHaveBeenCalled()
  })

  it('rejects a payload with no whitelisted events', async () => {
    const res = await POST(
      makeRequest({
        bookId: 'book-1',
        events: [{ type: 'page_scroll' }, { type: 42 }, null],
      }),
    )
    expect(res.status).toBe(400)
    expect(recordMock).not.toHaveBeenCalled()
  })

  it('takes series and world from the database and sanitises every field', async () => {
    const res = await POST(
      makeRequest({
        bookId: 'book-1',
        // 客户端伪造的 seriesId / worldId 必须被忽略
        seriesId: 'forged-series',
        worldId: 'forged-world',
        events: [
          { type: 'page_view', page: 3 },
          { type: 'page_view', page: 0 },          // 页码越界 → 丢弃页码
          { type: 'page_view', page: 9999 },       // 页码越界 → 丢弃页码
          { type: 'quiz_submit', value: 3, count: 4 },   // 比例收敛到 1
          { type: 'readalong', value: -1 },        // 比例收敛到 0
          { type: 'replay', count: 5000 },         // 计数越界 → 丢弃
          { type: 'not_a_real_event' },            // 非白名单 → 整条丢弃
        ],
      }),
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ recorded: 1 })
    expect(recordMock).toHaveBeenCalledTimes(1)

    const input = recordMock.mock.calls[0][0]
    expect(input).toMatchObject({
      bookId: 'book-1',
      userId: 'user-1',
      seriesId: 'series-1',
      worldId: 'world-star-farm',
    })
    expect(input.events).toEqual([
      { type: 'page_view', page: 3, value: undefined, count: undefined },
      { type: 'page_view', page: undefined, value: undefined, count: undefined },
      { type: 'page_view', page: undefined, value: undefined, count: undefined },
      { type: 'quiz_submit', page: undefined, value: 1, count: 4 },
      { type: 'readalong', page: undefined, value: 0, count: undefined },
      { type: 'replay', page: undefined, value: undefined, count: undefined },
    ])
  })

  it('caps a single payload at 50 events', async () => {
    const events = Array.from({ length: 60 }, (_, i) => ({ type: 'page_view', page: i + 1 }))
    const res = await POST(makeRequest({ bookId: 'book-1', events }))
    expect(res.status).toBe(200)
    expect(recordMock.mock.calls[0][0].events).toHaveLength(50)
  })

  it('returns 500 without throwing when the write fails', async () => {
    recordMock.mockRejectedValue(new Error('db down'))
    const res = await POST(makeRequest({ bookId: 'book-1', events: [{ type: 'book_open' }] }))
    expect(res.status).toBe(500)
  })
})
