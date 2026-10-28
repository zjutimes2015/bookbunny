import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSql, applied, failed, callLog } = vi.hoisted(() => ({
  mockSql: vi.fn(),
  applied: [] as string[],
  failed: [] as { column: string; error: string }[],
  callLog: [] as string[],
}))

vi.mock('@/lib/neon', () => ({ sql: mockSql }))

import { POST } from './route'
import type { NextRequest } from 'next/server'

describe('POST /api/health/repair', () => {
  beforeEach(() => {
    mockSql.mockReset()
    mockSql.mockResolvedValue({ command: 'ALTER', rowCount: 0 })
    applied.length = 0
    failed.length = 0
    callLog.length = 0
  })

  mockSql.mockImplementation((query: string) => {
    callLog.push(query)
    // Detect whether the mock was called with a plain string (repair path) or template (other code paths).
    if (typeof query === 'string') {
      applied.push(query)
    }
    return Promise.resolve({ command: 'ALTER', rowCount: 0 })
  })

  function makeRequest(): NextRequest {
    return new Request('http://localhost/api/health/repair', { method: 'POST' }) as unknown as NextRequest
  }

  it('returns ok when every ALTER succeeds', async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.applied).toBeGreaterThan(0)
    expect(body.failed).toEqual([])
  })

  it('never interpolates request body into SQL', async () => {
    const body = JSON.stringify({ table: 'users', drop: 'true' })
    const req = new Request('http://localhost/api/health/repair', {
      method: 'POST',
      body,
    }) as unknown as NextRequest
    await POST(req)
    const queries = callLog.filter((q) => typeof q === 'string')
    for (const q of queries) {
      expect(q).not.toContain('drop')
      expect(q).not.toContain('users')
      // Every query must be a plain ALTER TABLE from the constant whitelist
      expect(/^ALTER TABLE (bookbunny_users|stories|books) ADD COLUMN IF NOT EXISTS \w+ /i.test(q)).toBe(true)
    }
  })

  it('records errors without crashing the whole response', async () => {
    let callCount = 0
    mockSql.mockImplementation((query: string) => {
      callCount++
      callLog.push(query)
      // Simulate a failure on the 3rd call
      if (callCount === 3) {
        return Promise.reject(new Error('column "xyz" already exists'))
      }
      return Promise.resolve({ command: 'ALTER', rowCount: 0 })
    })

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.failed.length).toBe(1)
    expect(body.failed[0].error).toContain('column "xyz" already exists')
  })

  it('always runs ALTER TABLE IF NOT EXISTS — never drops or modifies data', async () => {
    await POST(makeRequest())
    const queries = callLog.filter((q) => typeof q === 'string')
    const drops = queries.filter((q) => /\bDROP\b/i.test(q))
    const inserts = queries.filter((q) => /\bINSERT\b/i.test(q))
    const deletes = queries.filter((q) => /\bDELETE\b/i.test(q))
    expect(drops).toHaveLength(0)
    expect(inserts).toHaveLength(0)
    expect(deletes).toHaveLength(0)
    for (const q of queries) {
      expect(q).toMatch(/^ALTER TABLE /i)
    }
  })
})
