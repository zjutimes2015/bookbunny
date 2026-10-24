import { describe, it, expect, beforeEach, vi } from 'vitest'

type QueryResult = Record<string, unknown>[]

const { mockSql, responseQueue, callLog, baseImpl } = vi.hoisted(() => {
  const responseQueue: QueryResult[] = []
  const callLog: string[] = []
  const baseImpl = (strings: TemplateStringsArray, ..._values: unknown[]) => {
    callLog.push(strings.join('?'))
    return Promise.resolve(responseQueue.shift() ?? [])
  }
  const mockSql = vi.fn(baseImpl)
  return { mockSql, responseQueue, callLog, baseImpl }
})

vi.mock('@neondatabase/serverless', () => ({
  neon: () => mockSql as unknown as ReturnType<typeof import('@neondatabase/serverless').neon>,
}))

import { GET } from './route'

function makeRequest(token?: string) {
  const url = new URL('http://localhost/api/cron/pro-grants')
  if (token) url.searchParams.set('token', token)
  return new Request(url)
}

function makeBearerRequest(token: string) {
  return new Request('http://localhost/api/cron/pro-grants', {
    headers: { authorization: `Bearer ${token}` },
  })
}

describe('GET /api/cron/pro-grants', () => {
  beforeEach(() => {
    responseQueue.length = 0
    callLog.length = 0
    vi.clearAllMocks()
    mockSql.mockImplementation(baseImpl)
    process.env.CRON_SECRET = 'secret-123'
  })

  describe('auth', () => {
    it('returns 401 without a token', async () => {
      const res = await GET(makeRequest())
      expect(res.status).toBe(401)
      expect(callLog).toHaveLength(0)
    })

    it('returns 401 with a wrong token', async () => {
      const res = await GET(makeRequest('nope'))
      expect(res.status).toBe(401)
      expect(callLog).toHaveLength(0)
    })

    it('returns 500 when CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET
      const res = await GET(makeRequest())
      expect(res.status).toBe(500)
      expect(callLog).toHaveLength(0)
    })

    it('accepts Authorization: Bearer <CRON_SECRET> from Vercel Cron', async () => {
      responseQueue.push([])
      const res = await GET(makeBearerRequest('secret-123'))
      expect(res.status).toBe(200)
    })

    it('rejects a wrong bearer token', async () => {
      const res = await GET(makeBearerRequest('nope'))
      expect(res.status).toBe(401)
    })
  })

  describe('granting', () => {
    it('reports zero work when nobody is due', async () => {
      responseQueue.push([])
      const res = await GET(makeRequest('secret-123'))
      expect(res.status).toBe(200)
      expect(await res.json()).toMatchObject({ success: true, due: 0, granted: 0 })
      expect(callLog.some(q => q.includes('UPDATE bookbunny_users'))).toBe(false)
    })

    it('grants 30 Pro credits and advances the next grant date', async () => {
      responseQueue.push([{ id: 'u1' }], [{ id: 'u1' }])
      const res = await GET(makeRequest('secret-123'))
      expect(res.status).toBe(200)
      expect(await res.json()).toMatchObject({ due: 1, granted: 1, creditsEach: 30 })

      const update = callLog.find(q => q.includes('UPDATE bookbunny_users'))
      expect(update).toBeDefined()
      expect(update).toContain('pro_animation_credits = COALESCE(pro_animation_credits, 0) + ?')
      expect(update).toContain("pro_grant_next_at = pro_grant_next_at + INTERVAL '1 month'")
      // 通用 credits 不应被污染
      expect(callLog.some(q => q.includes('SET credits = COALESCE'))).toBe(false)
    })

    it('only scans Studio subscribers with a due grant date', async () => {
      responseQueue.push([])
      await GET(makeRequest('secret-123'))
      const select = callLog.find(q => q.includes('SELECT id FROM bookbunny_users'))
      expect(select).toBeDefined()
      expect(select).toContain("subscription_tier = 'studio'")
      expect(select).toContain('pro_grant_next_at IS NOT NULL')
      expect(select).toContain('pro_grant_next_at <= NOW()')
    })

    it('counts only rows actually claimed (race with another instance)', async () => {
      // 查询命中 2 人，但只有 1 人的 UPDATE 真正生效
      responseQueue.push([{ id: 'u1' }, { id: 'u2' }], [{ id: 'u1' }], [])
      const res = await GET(makeRequest('secret-123'))
      expect(await res.json()).toMatchObject({ due: 2, granted: 1 })
      expect(callLog.filter(q => q.includes('UPDATE bookbunny_users'))).toHaveLength(2)
    })

    it('is idempotent on re-run once the date has moved forward', async () => {
      responseQueue.push([], [])
      const res = await GET(makeRequest('secret-123'))
      expect(await res.json()).toMatchObject({ due: 0, granted: 0 })
    })
  })

  it('returns 500 when the query fails', async () => {
    mockSql.mockImplementationOnce(() => Promise.reject(new Error('db down')))
    const res = await GET(makeRequest('secret-123'))
    expect(res.status).toBe(500)
  })
})
