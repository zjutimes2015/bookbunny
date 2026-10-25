import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const { getSessionUserMock, neonMock } = vi.hoisted(() => ({
  getSessionUserMock: vi.fn(),
  neonMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getSessionUser: getSessionUserMock }))
vi.mock('@neondatabase/serverless', () => ({ neon: neonMock }))
vi.mock('@/lib/payments/waffo', () => ({
  isWaffoConfigured: () => false,
  PRO_DELIVERY_READY: false,
  getPlan: (key: string) => {
    if (key === 'creator_monthly') {
      return { productId: 'prod_x', name: 'Creator', tier: 'creator', price: 29, currency: 'USD', cycle: 'month', description: '' }
    }
    if (key === 'pro_anim_5') {
      return { productId: 'prod_p', name: 'Pro Animation Pack · 5', tier: 'pro-anim', price: 12, currency: 'USD', cycle: 'once', description: '', grant: 5 }
    }
    return null
  },
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
  const env = process.env as Record<string, string | undefined>
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.clearAllMocks()
    getSessionUserMock.mockResolvedValue({ id: 'user-1', email: 'parent@example.com' })
    neonMock.mockReturnValue(vi.fn())
  })

  afterEach(() => {
    env.NODE_ENV = originalEnv
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

  it('refuses to sell a Pro pack while video delivery is not live', async () => {
    const res = await POST(makeRequest({ plan: 'pro_anim_5' }))
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ code: 'coming_soon' })
    expect(neonMock).not.toHaveBeenCalled()
  })

  it('fails closed in production when Waffo keys are missing', async () => {
    env.NODE_ENV = 'production'
    const res = await POST(makeRequest({ plan: 'creator_monthly' }))
    expect(res.status).toBe(503)
    // No simulated payment row and no free upgrade.
    expect(neonMock).not.toHaveBeenCalled()
  })
})
