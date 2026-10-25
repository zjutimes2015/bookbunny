import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const { getSessionUserMock, neonMock } = vi.hoisted(() => ({
  getSessionUserMock: vi.fn(),
  neonMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getSessionUser: getSessionUserMock }))
vi.mock('@neondatabase/serverless', () => ({ neon: neonMock }))
vi.mock('@/lib/payments/waffo', () => ({
  isWaffoConfigured: () => false,
  getPlan: (key: string) =>
    key === 'creator_monthly'
      ? { productId: 'prod_x', name: 'Creator', tier: 'creator', price: 29, currency: 'USD', cycle: 'month', description: '' }
      : null,
  planGrant: () => 0,
  PRO_CREDITS_PER_BOOK: 3,
}))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/payments/waffo-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0]
}

describe('POST /api/payments/waffo-checkout', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.clearAllMocks()
    getSessionUserMock.mockResolvedValue({ id: 'user-1', email: 'parent@example.com' })
    neonMock.mockReturnValue(vi.fn())
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  it('rejects an unknown plan', async () => {
    const res = await POST(makeRequest({ plan: 'nope' }))
    expect(res.status).toBe(400)
  })

  it('requires a signed-in account', async () => {
    getSessionUserMock.mockResolvedValue(null)
    const res = await POST(makeRequest({ plan: 'creator_monthly' }))
    expect(res.status).toBe(401)
  })

  it('fails closed in production when Waffo keys are missing', async () => {
    process.env.NODE_ENV = 'production'
    const res = await POST(makeRequest({ plan: 'creator_monthly' }))
    expect(res.status).toBe(503)
    // No simulated payment row and no free upgrade.
    expect(neonMock).not.toHaveBeenCalled()
  })
})
