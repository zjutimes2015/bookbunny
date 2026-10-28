import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Mock the neon sql tagged-template function.
 * We intercept every `sql\`...\`` call and return a pre-programmed response
 * based on the order of calls, since the route's query sequence is deterministic.
 */
type QueryResult = Record<string, unknown>[]

const { mockSql, responseQueue, callLog } = vi.hoisted(() => {
  const responseQueue: QueryResult[] = []
  const callLog: string[] = []
  const mockSql = vi.fn((strings: TemplateStringsArray, ..._values: unknown[]) => {
    const query = strings.join('?')
    callLog.push(query)
    // DDL 自愈语句不消耗预置响应队列（它们没有对应的数据行）
    if (/^\s*ALTER TABLE/i.test(query)) return Promise.resolve([])
    const next = responseQueue.shift()
    return Promise.resolve(next ?? [])
  })
  return { mockSql, responseQueue, callLog }
})

vi.mock('@neondatabase/serverless', () => ({
  neon: () => mockSql as unknown as ReturnType<typeof import('@neondatabase/serverless').neon>,
}))

import { POST } from './route'
import type { NextRequest } from 'next/server'

function makeRequest(body: unknown, token = 'valid-token'): NextRequest {
  const req = new Request('http://localhost/api/books', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as unknown as NextRequest
  // 用最小 mock 替代 NextRequest.cookies（get 返回 { value } 而不是字符串）
  Object.defineProperty(req, 'cookies', {
    value: {
      get: (name: string) => (token && name === 'auth_token' ? { value: token } : undefined),
    },
    configurable: true,
  })
  return req
}

describe('POST /api/books — credits & allowance deduction', () => {
  beforeEach(() => {
    responseQueue.length = 0
    callLog.length = 0
    vi.clearAllMocks()
  })

  describe('input validation', () => {
    it('returns 400 when title is missing', async () => {
      const res = await POST(makeRequest({ outline: [{ pageText: 'hello', pageFunction: 'body' }] }))
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Missing required fields')
    })

    it('returns 400 when both outline and pages are missing', async () => {
      const res = await POST(makeRequest({ title: 'My Book' }))
      expect(res.status).toBe(400)
    })

    it('accepts pages array as fallback when outline is absent', async () => {
      responseQueue.push(
        [{ id: 'user-1', credits: 5, subscription_tier: 'free', is_paid: false, monthly_allowance_remaining: 1, allowance_reset_at: new Date(Date.now() + 86400000) }],
        [{ id: 'story-1' }],
        [{ id: 'book-1' }],
        [{ credits: 5, subscription_tier: 'free', monthly_allowance_remaining: 1, allowance_reset_at: new Date(Date.now() + 86400000) }],
        // atomic deduction UPDATE response
        [{ credits: 4, monthly_allowance_remaining: 1 }],
      )
      const res = await POST(makeRequest({ title: 'My Book', pages: ['Page one text'] }))
      expect(res.status).toBe(200)
    })
  })

  describe('user resolution', () => {
    it('returns 200 and saves book for a logged-in user', async () => {
      responseQueue.push(
        // getUserId
        [{ id: 'user-1', credits: 0, subscription_tier: 'free', is_paid: false, monthly_allowance_remaining: 1, allowance_reset_at: new Date(Date.now() + 86400000) }],
        // insert story
        [{ id: 'story-1' }],
        // insert book
        [{ id: 'book-1' }],
        // consumeBookAllocation select
        [{ credits: 0, subscription_tier: 'free', monthly_allowance_remaining: 1, allowance_reset_at: new Date(Date.now() + 86400000) }],
        // atomic deduction UPDATE response
        [{ credits: 0, monthly_allowance_remaining: 0 }],
      )
      const res = await POST(makeRequest({ title: 'T', outline: [{ pageText: 'hello', pageFunction: 'body' }] }))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.bookId).toBe('book-1')
      expect(json.storyId).toBe('story-1')
    })

    it('saves book for a guest (no auth_token)', async () => {
      responseQueue.push(
        // insert story
        [{ id: 'story-1' }],
        // insert book (user_id null)
        [{ id: 'book-1' }],
      )
      const res = await POST(makeRequest({ title: 'T', outline: [{ pageText: 'hello' }] }, ''))
      expect(res.status).toBe(200)
      // guest does NOT trigger consumeBookAllocation
      expect(callLog.some(q => q.includes('UPDATE bookbunny_users SET credits'))).toBe(false)
    })
  })

  describe('credits deduction', () => {
    it('deducts 1 credit when user has credits', async () => {
      responseQueue.push(
        [{ id: 'u1', credits: 5, subscription_tier: 'free', is_paid: false, monthly_allowance_remaining: 0, allowance_reset_at: new Date(Date.now() + 86400000) }],
        [{ id: 'story-1' }],
        [{ id: 'book-1' }],
        // consume select: credits=5
        [{ credits: 5, subscription_tier: 'free', monthly_allowance_remaining: 0, allowance_reset_at: new Date(Date.now() + 86400000) }],
        // atomic deduction UPDATE response
        [{ credits: 4, monthly_allowance_remaining: 0 }],
      )
      await POST(makeRequest({ title: 'T', outline: [{ pageText: 'x' }] }))

      // 单条原子 UPDATE 同时处理两个额度池：credits 够就从 credits 扣
      const creditUpdate = callLog.find(q => q.includes('SET credits = credits - CASE WHEN credits >= ?'))
      expect(creditUpdate).toBeDefined()
      // allowance 不应该被扣
      expect(callLog.some(q => q.includes('monthly_allowance_remaining - 1'))).toBe(false)
    })

    it('prefers credits over monthly allowance', async () => {
      responseQueue.push(
        [{ id: 'u1', credits: 1, subscription_tier: 'starter', is_paid: true, monthly_allowance_remaining: 10, allowance_reset_at: new Date(Date.now() + 86400000) }],
        [{ id: 'story-1' }],
        [{ id: 'book-1' }],
        [{ credits: 1, subscription_tier: 'starter', monthly_allowance_remaining: 10, allowance_reset_at: new Date(Date.now() + 86400000) }],
        [{ credits: 0, monthly_allowance_remaining: 10 }],
      )
      await POST(makeRequest({ title: 'T', outline: [{ pageText: 'x' }] }))

      expect(callLog.some(q => q.includes('SET credits = credits - CASE WHEN credits >= ?'))).toBe(true)
      expect(callLog.some(q => q.includes('monthly_allowance_remaining - 1'))).toBe(false)
    })
  })

  describe('monthly allowance deduction', () => {
    it('deducts allowance when credits are 0 but allowance remains', async () => {
      responseQueue.push(
        [{ id: 'u1', credits: 0, subscription_tier: 'creator', is_paid: true, monthly_allowance_remaining: 30, allowance_reset_at: new Date(Date.now() + 86400000) }],
        [{ id: 'story-1' }],
        [{ id: 'book-1' }],
        [{ credits: 0, subscription_tier: 'creator', monthly_allowance_remaining: 30, allowance_reset_at: new Date(Date.now() + 86400000) }],
        [{ credits: 0, monthly_allowance_remaining: 29 }],
      )
      await POST(makeRequest({ title: 'T', outline: [{ pageText: 'x' }] }))

      // credits 不足时，allowance 分支扣 1 个单位
      expect(callLog.some(q => q.includes('monthly_allowance_remaining = monthly_allowance_remaining') && q.includes('CASE WHEN credits >= ? THEN 0 ELSE ? END'))).toBe(true)
    })
  })

  describe('allowance rollover (monthly reset)', () => {
    it('resets allowance when reset_at has passed', async () => {
      const pastReset = new Date(Date.now() - 1000)
      responseQueue.push(
        [{ id: 'u1', credits: 0, subscription_tier: 'creator', is_paid: true, monthly_allowance_remaining: 0, allowance_reset_at: pastReset }],
        [{ id: 'story-1' }],
        [{ id: 'book-1' }],
        // consume select: allowance=0, reset in past -> should trigger reset
        [{ credits: 0, subscription_tier: 'creator', monthly_allowance_remaining: 0, allowance_reset_at: pastReset }],
        // reset UPDATE response
        [{ credits: 0 }],
        // atomic deduction UPDATE response (after reset, allowance=8 > 0)
        [{ credits: 0, monthly_allowance_remaining: 7 }],
      )
      await POST(makeRequest({ title: 'T', outline: [{ pageText: 'x' }] }))

      // Should have called UPDATE to reset allowance to the creator-tier amount
      const resetUpdate = callLog.find(q => q.includes('SET monthly_allowance_remaining = ?'))
      expect(resetUpdate).toBeDefined()
    })
  })

  describe('first-time allowance initialization', () => {
    it('initializes allowance to free-tier amount when null', async () => {
      responseQueue.push(
        [{ id: 'u1', credits: 0, subscription_tier: 'free', is_paid: false, monthly_allowance_remaining: null, allowance_reset_at: null }],
        [{ id: 'story-1' }],
        [{ id: 'book-1' }],
        // consume select: allowance null
        [{ credits: 0, subscription_tier: 'free', monthly_allowance_remaining: null, allowance_reset_at: null }],
        // init UPDATE response
        [{ credits: 0 }],
        // atomic deduction UPDATE response
        [{ credits: 0, monthly_allowance_remaining: 0 }],
      )
      const res = await POST(makeRequest({ title: 'T', outline: [{ pageText: 'x' }] }))

      expect(res.status).toBe(200)
      // Should have initialized allowance (free tier = 1)
      const initUpdate = callLog.find(q => q.includes('SET monthly_allowance_remaining = ?'))
      expect(initUpdate).toBeDefined()
    })
  })

  describe('A4 aspect costs double', () => {
    it('deducts 2 allowance units for an A4 book', async () => {
      responseQueue.push(
        [{ id: 'u1', credits: 0, subscription_tier: 'creator', is_paid: true, monthly_allowance_remaining: 8, allowance_reset_at: new Date(Date.now() + 86400000) }],
        [{ id: 'story-1' }],
        [{ id: 'book-1' }],
        [{ credits: 0, subscription_tier: 'creator', monthly_allowance_remaining: 8, allowance_reset_at: new Date(Date.now() + 86400000) }],
        [{ credits: 0, monthly_allowance_remaining: 6 }],
      )
      const res = await POST(
        makeRequest({ title: 'T', aspect: 'a4', outline: [{ pageText: 'x' }] }),
      )
      expect(res.status).toBe(200)

      // A4 生图按 2 MP 计费，扣 2 个单位
      const deduction = callLog.find(q => q.includes('SET credits = credits - CASE WHEN credits >= ?'))
      expect(deduction).toBeDefined()
    })
  })

  describe('no allocation left', () => {
    it('returns 402 when both credits and allowance are exhausted', async () => {
      responseQueue.push(
        [{ id: 'u1', credits: 0, subscription_tier: 'free', is_paid: false, monthly_allowance_remaining: 0, allowance_reset_at: new Date(Date.now() + 86400000) }],
        [{ id: 'story-1' }],
        [{ id: 'book-1' }],
        // consume select: credits=0, allowance=0 (not null, so no init)
        [{ credits: 0, subscription_tier: 'free', monthly_allowance_remaining: 0, allowance_reset_at: new Date(Date.now() + 86400000) }],
      )
      const res = await POST(makeRequest({ title: 'T', outline: [{ pageText: 'x' }] }))
      expect(res.status).toBe(402)
      const json = await res.json()
      expect(json.code).toBe('no_allocation')
    })
  })

  describe('database error handling', () => {
    it('returns 500 when story insert fails', async () => {
      responseQueue.push(
        [{ id: 'u1', credits: 0, subscription_tier: 'free', is_paid: false, monthly_allowance_remaining: 1, allowance_reset_at: new Date(Date.now() + 86400000) }],
        // story insert returns no rows -> throws
        [],
      )
      const res = await POST(makeRequest({ title: 'T', outline: [{ pageText: 'x' }] }))
      expect(res.status).toBe(500)
    })
  })
})
