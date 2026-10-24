import { describe, it, expect, beforeEach, vi } from 'vitest'

type QueryResult = Record<string, unknown>[]

const { mockSql, responseQueue, mockGetSessionUser, mockGetClientIp } = vi.hoisted(() => {
  const responseQueue: QueryResult[] = []
  const mockSql = vi.fn((_strings: TemplateStringsArray, ..._values: unknown[]) =>
    Promise.resolve(responseQueue.shift() ?? []),
  )
  return {
    mockSql,
    responseQueue,
    mockGetSessionUser: vi.fn(),
    mockGetClientIp: vi.fn(() => '203.0.113.7'),
  }
})

vi.mock('@neondatabase/serverless', () => ({
  neon: () => mockSql,
}))

vi.mock('@/lib/auth', () => ({
  getSessionUser: mockGetSessionUser,
  getClientIp: mockGetClientIp,
}))

import { POST as joinPost } from './join/route'
import { GET as meGet } from './me/route'
import { POST as trackPost } from './track/route'
import { POST as payoutPost } from './payout/route'
import type { NextRequest } from 'next/server'

function makeRequest(url: string, body?: unknown): NextRequest {
  return new Request(url, {
    method: body === undefined ? 'GET' : 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'user-agent': 'vitest' },
  }) as unknown as NextRequest
}

const user = {
  id: 'u1',
  email: 'parent@example.com',
  tier: 'free',
  isPaid: false,
  credits: 0,
  allowanceRemaining: null,
  allowanceResetAt: null,
}

const affiliateRow = {
  id: 'aff1',
  user_id: 'u1',
  code: 'ABC12345',
  tier: 'tier1',
  first_rate: 30,
  recurring_rate: 15,
  payout_email: 'parent@example.com',
  payout_method: 'paypal',
  status: 'active',
  created_at: '2026-10-24T00:00:00.000Z',
  updated_at: '2026-10-24T00:00:00.000Z',
}

beforeEach(() => {
  responseQueue.length = 0
  vi.clearAllMocks()
})

describe('POST /api/affiliate/join', () => {
  it('rejects anonymous callers', async () => {
    mockGetSessionUser.mockResolvedValue(null)
    const res = await joinPost(makeRequest('http://localhost/api/affiliate/join', {}))
    expect(res.status).toBe(401)
  })

  it('rejects an invalid payout email', async () => {
    mockGetSessionUser.mockResolvedValue(user)
    const res = await joinPost(
      makeRequest('http://localhost/api/affiliate/join', { payoutEmail: 'not-an-email' }),
    )
    expect(res.status).toBe(400)
  })

  it('creates an affiliate with tier-1 rates', async () => {
    mockGetSessionUser.mockResolvedValue(user)
    responseQueue.push([], [affiliateRow])
    const res = await joinPost(
      makeRequest('http://localhost/api/affiliate/join', { payoutEmail: 'parent@example.com' }),
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.created).toBe(true)
    expect(json.affiliate.code).toBe('ABC12345')
  })

  it('is idempotent for existing affiliates', async () => {
    mockGetSessionUser.mockResolvedValue(user)
    responseQueue.push([affiliateRow])
    const res = await joinPost(
      makeRequest('http://localhost/api/affiliate/join', { payoutEmail: 'parent@example.com' }),
    )
    expect(res.status).toBe(200)
    expect((await res.json()).created).toBe(false)
  })
})

describe('GET /api/affiliate/me', () => {
  it('requires a session', async () => {
    mockGetSessionUser.mockResolvedValue(null)
    const res = await meGet(makeRequest('http://localhost/api/affiliate/me'))
    expect(res.status).toBe(401)
  })

  it('returns affiliate: null for non-members', async () => {
    mockGetSessionUser.mockResolvedValue(user)
    responseQueue.push([])
    const res = await meGet(makeRequest('http://localhost/api/affiliate/me'))
    expect(res.status).toBe(200)
    expect((await res.json()).affiliate).toBeNull()
  })

  it('returns stats, referrals and commissions', async () => {
    mockGetSessionUser.mockResolvedValue(user)
    responseQueue.push(
      [affiliateRow], // getAffiliateForUser
      [], // approveMatureCommissions
      [{ cnt: 42 }], // clicks
      [{ cnt: 7 }], // clicks30
      [{ cnt: 1 }], // signup count
      [{ cnt: 1 }], // conversion count
      [
        {
          id: 'ref1',
          status: 'converted',
          created_at: '2026-10-20T00:00:00.000Z',
          converted_at: '2026-10-21T00:00:00.000Z',
          email: 'jane@example.com',
        },
      ],
      [
        {
          id: 'com1',
          kind: 'first',
          gross_cents: 1200,
          rate: 30,
          amount_cents: 360,
          status: 'approved',
          created_at: '2026-10-21T00:00:00.000Z',
        },
      ],
      [],
      [
        { status: 'approved', total: 360, cnt: 1 },
        { status: 'pending', total: 180, cnt: 1 },
      ],
    )

    const res = await meGet(makeRequest('http://localhost/api/affiliate/me'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.affiliate.code).toBe('ABC12345')
    expect(json.stats.clicks).toBe(42)
    expect(json.stats.signups).toBe(1)
    expect(json.stats.conversions).toBe(1)
    expect(json.stats.payableCents).toBe(360)
    expect(json.stats.earnings.lifetimeCents).toBe(540)
    expect(json.referrals[0].email).toBe('j***e@example.com')
    expect(json.commissions[0].amountCents).toBe(360)
  })
})

describe('POST /api/affiliate/track', () => {
  it('rejects malformed codes before querying', async () => {
    const res = await trackPost(makeRequest('http://localhost/api/affiliate/track', { code: '!' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 for unknown codes', async () => {
    responseQueue.push([])
    const res = await trackPost(
      makeRequest('http://localhost/api/affiliate/track', { code: 'NOPE1234' }),
    )
    expect(res.status).toBe(404)
  })

  it('records a click once per IP per day', async () => {
    responseQueue.push([affiliateRow], [{ 1: 1 }])
    const res = await trackPost(
      makeRequest('http://localhost/api/affiliate/track', { code: 'abc12345' }),
    )
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })
})

describe('POST /api/affiliate/payout', () => {
  it('rejects withdrawals below the minimum', async () => {
    mockGetSessionUser.mockResolvedValue(user)
    responseQueue.push([affiliateRow], [{ total: 1200, cnt: 1 }])
    const res = await payoutPost(makeRequest('http://localhost/api/affiliate/payout', {}))
    expect(res.status).toBe(400)
    expect((await res.json()).payableCents).toBe(1200)
  })

  it('creates a payout for the approved balance', async () => {
    mockGetSessionUser.mockResolvedValue(user)
    responseQueue.push(
      [affiliateRow],
      [{ total: 8600, cnt: 3 }],
      [], // no payout in review
      [
        {
          id: 'payout1',
          amount_cents: 8600,
          method: 'paypal',
          reference: 'parent@example.com',
          status: 'requested',
          created_at: '2026-10-24T00:00:00.000Z',
        },
      ],
      [],
    )
    const res = await payoutPost(makeRequest('http://localhost/api/affiliate/payout', {}))
    expect(res.status).toBe(201)
    expect((await res.json()).requestedCents).toBe(8600)
  })
})
