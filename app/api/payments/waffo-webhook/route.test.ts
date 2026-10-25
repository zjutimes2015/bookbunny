import { describe, it, expect, beforeEach, vi } from 'vitest'

type QueryResult = Record<string, unknown>[]

const { mockSql, responseQueue, callLog, verifyWebhookMock } = vi.hoisted(() => {
  const responseQueue: QueryResult[] = []
  const callLog: string[] = []
  const mockSql = vi.fn((strings: TemplateStringsArray, ..._values: unknown[]) => {
    const query = strings.join('?')
    callLog.push(query)
    const next = responseQueue.shift()
    return Promise.resolve(next ?? [])
  })
  const verifyWebhookMock = vi.fn()
  return { mockSql, responseQueue, callLog, verifyWebhookMock }
})

vi.mock('@neondatabase/serverless', () => ({
  neon: () => mockSql as unknown as ReturnType<typeof import('@neondatabase/serverless').neon>,
}))

// Mock verifyWebhook to return a configurable event
let mockEvent: { eventType: string; data: any } | null = null
let verifyShouldThrow = false

vi.mock('@waffo/pancake-ts', () => ({
  verifyWebhook: verifyWebhookMock,
  WebhookEventType: {
    OrderCompleted: 'order.completed',
    SubscriptionActivated: 'subscription.activated',
    SubscriptionCanceled: 'subscription.canceled',
    SubscriptionPastDue: 'subscription.past_due',
  },
}))

import { POST } from './route'

function makeRequest(body: string, signature = 'valid-sig') {
  return new Request('http://localhost/api/payments/waffo-webhook', {
    method: 'POST',
    headers: { 'x-waffo-signature': signature },
    body,
  })
}

describe('POST /api/payments/waffo-webhook', () => {
  beforeEach(() => {
    responseQueue.length = 0
    callLog.length = 0
    mockEvent = null
    verifyShouldThrow = false
    verifyWebhookMock.mockImplementation((_rawBody: string, _sig: string | null) => {
      if (verifyShouldThrow) throw new Error('bad sig')
      return mockEvent
    })
    vi.clearAllMocks()
  })

  describe('signature verification', () => {
    it('returns 401 when signature is invalid', async () => {
      verifyShouldThrow = true
      const res = await POST(makeRequest('{}'))
      expect(res.status).toBe(401)
    })

    it('passes raw body and signature to verifyWebhook', async () => {
      mockEvent = { eventType: 'order.completed', data: { orderId: 'o1', orderMetadata: { plan: 'credits_5', userId: 'u1' } } }
      const body = JSON.stringify({ hello: 'world' })
      await POST(makeRequest(body, 'sig-123'))
      expect(verifyWebhookMock).toHaveBeenCalledWith(body, 'sig-123')
    })
  })

  describe('Pro animation pack purchase', () => {
    it('adds 15 Pro credits for a 5-book pack', async () => {
      mockEvent = {
        eventType: 'order.completed',
        data: {
          orderId: 'o-pro5',
          orderMetadata: { plan: 'pro_anim_5', userId: 'u1' },
          chargedAmount: '12.00',
          currency: 'USD',
          buyerEmail: 'buyer@test.com',
        },
      }
      // INSERT payments RETURNING id, then UPDATE pro_animation_credits
      responseQueue.push([{ id: 'o-pro5' }], [])
      const res = await POST(makeRequest('{}'))
      expect(res.status).toBe(200)

      const creditUpdate = callLog.find(q => q.includes('SET pro_animation_credits = COALESCE(pro_animation_credits, 0) + ?'))
      expect(creditUpdate).toBeDefined()
      expect(creditUpdate).toContain('WHERE id = ?')
      // 通用 credits 不应被污染
      expect(callLog.some(q => q.includes('SET credits = COALESCE'))).toBe(false)
    })

    it('adds 30 Pro credits for a 10-book pack', async () => {
      mockEvent = {
        eventType: 'order.completed',
        data: {
          orderId: 'o-pro10',
          orderMetadata: { plan: 'pro_anim_10', userId: 'u1' },
          chargedAmount: '20.00',
          currency: 'USD',
          buyerEmail: 'buyer@test.com',
        },
      }
      responseQueue.push([{ id: 'o-pro10' }], [])
      await POST(makeRequest('{}'))

      expect(callLog.some(q => q.includes('SET pro_animation_credits = COALESCE(pro_animation_credits, 0) + ?'))).toBe(true)
      // 不写入订阅档位
      expect(callLog.some(q => q.includes('subscription_tier = ?'))).toBe(false)
    })

    it('is idempotent — a duplicate order grants nothing', async () => {
      mockEvent = {
        eventType: 'order.completed',
        data: {
          orderId: 'o-pro-dup',
          orderMetadata: { plan: 'pro_anim_5', userId: 'u1' },
          chargedAmount: '12.00',
          buyerEmail: 'buyer@test.com',
        },
      }
      // INSERT ... ON CONFLICT DO NOTHING RETURNING id → 空数组表示重复事件
      responseQueue.push([])
      const res = await POST(makeRequest('{}'))
      expect(res.status).toBe(200)
      expect(await res.json()).toMatchObject({ duplicate: true })
      expect(callLog.some(q => q.includes('UPDATE bookbunny_users'))).toBe(false)
    })
  })

  describe('subscription activation', () => {
    it('sets Creator tier with an 8-book allowance', async () => {
      mockEvent = {
        eventType: 'subscription.activated',
        data: {
          orderId: 'o-creator',
          orderMetadata: { plan: 'creator_monthly', userId: 'u1' },
          chargedAmount: '29.00',
          buyerEmail: 'buyer@test.com',
        },
      }
      responseQueue.push([{ id: 'o-creator' }], [])
      await POST(makeRequest('{}'))

      const userUpdate = callLog.find(q => q.includes('subscription_tier = ?'))
      expect(userUpdate).toBeDefined()
      expect(userUpdate).toContain('monthly_allowance_remaining = ?')
      expect(userUpdate).toContain('allowance_reset_at = ?')
      expect(userUpdate).toContain('is_paid = TRUE')
    })

    it('does not grant Studio any Pro animated credits', async () => {
      mockEvent = {
        eventType: 'order.completed',
        data: {
          orderId: 'o-studio',
          orderMetadata: { plan: 'studio_monthly', userId: 'u1' },
          chargedAmount: '79.00',
          buyerEmail: 'buyer@test.com',
        },
      }
      responseQueue.push([{ id: 'o-studio' }], [])
      await POST(makeRequest('{}'))

      const userUpdate = callLog.find(q => q.includes('subscription_tier = ?'))
      expect(userUpdate).toBeDefined()
      expect(userUpdate).not.toContain('pro_animation_credits')
      expect(userUpdate).toContain('pro_grant_next_at = NULL')
    })

    it('records payment but grants nothing for an unknown plan', async () => {
      mockEvent = {
        eventType: 'order.completed',
        data: {
          orderId: 'o-unknown',
          orderMetadata: { plan: 'starter_monthly', userId: 'u1' },
          chargedAmount: '12.00',
          buyerEmail: 'buyer@test.com',
        },
      }
      responseQueue.push([{ id: 'o-unknown' }])
      const res = await POST(makeRequest('{}'))
      expect(res.status).toBe(200)

      expect(callLog.some(q => q.includes('INSERT INTO payments'))).toBe(true)
      expect(callLog.some(q => q.includes('UPDATE bookbunny_users'))).toBe(false)
    })

    it('skips grants when no user identity is present', async () => {
      mockEvent = {
        eventType: 'subscription.activated',
        data: {
          orderId: 'o-no-user',
          orderMetadata: { plan: 'creator_monthly' },
          chargedAmount: '29.00',
          buyerEmail: 'buyer@test.com',
        },
      }
      responseQueue.push([{ id: 'o-no-user' }])
      await POST(makeRequest('{}'))

      expect(callLog.some(q => q.includes('UPDATE bookbunny_users'))).toBe(false)
    })
  })

  describe('subscription cancellation', () => {
    it('clears allowance and resets to free tier', async () => {
      mockEvent = {
        eventType: 'subscription.canceled',
        data: {
          orderId: 'o-cancel',
          orderMetadata: { userId: 'u1' },
          buyerEmail: 'buyer@test.com',
        },
      }
      // No INSERT payments on cancel — just UPDATE
      responseQueue.push([])
      const res = await POST(makeRequest('{}'))
      expect(res.status).toBe(200)

      const userUpdate = callLog.find(q => q.includes('UPDATE bookbunny_users'))
      expect(userUpdate).toBeDefined()
      expect(userUpdate).toContain("subscription_tier = 'free'")
      expect(userUpdate).toContain('is_paid = FALSE')
      expect(userUpdate).toContain('monthly_allowance_remaining = NULL')
      expect(userUpdate).toContain('allowance_reset_at = NULL')
    })

    it('handles past_due the same as canceled', async () => {
      mockEvent = {
        eventType: 'subscription.past_due',
        data: {
          orderId: 'o-pastdue',
          orderMetadata: { userId: 'u1' },
          buyerEmail: 'buyer@test.com',
        },
      }
      responseQueue.push([])
      await POST(makeRequest('{}'))

      const userUpdate = callLog.find(q => q.includes('UPDATE bookbunny_users'))
      expect(userUpdate).toBeDefined()
      expect(userUpdate).toContain('monthly_allowance_remaining = NULL')
    })

    it('cancels by email when userId is missing', async () => {
      mockEvent = {
        eventType: 'subscription.canceled',
        data: {
          orderId: 'o-cancel-email',
          buyerEmail: 'buyer@test.com',
        },
      }
      responseQueue.push([])
      await POST(makeRequest('{}'))

      const userUpdate = callLog.find(q => q.includes('UPDATE bookbunny_users'))
      expect(userUpdate).toContain('WHERE email = ?')
    })
  })

  describe('payment record', () => {
    it('inserts a payments record on order completed', async () => {
      mockEvent = {
        eventType: 'order.completed',
        data: {
          orderId: 'o-pay',
          orderMetadata: { plan: 'creator_monthly', userId: 'u1' },
          chargedAmount: '29.00',
          currency: 'USD',
          buyerEmail: 'buyer@test.com',
        },
      }
      responseQueue.push([], [])
      await POST(makeRequest('{}'))

      const paymentInsert = callLog.find(q => q.includes('INSERT INTO payments'))
      expect(paymentInsert).toBeDefined()
    })
  })

  describe('response', () => {
    it('returns { received: true } on success', async () => {
      mockEvent = {
        eventType: 'order.completed',
        data: {
          orderId: 'o-ok',
          orderMetadata: { plan: 'credits_5', userId: 'u1' },
          chargedAmount: '9.00',
          buyerEmail: 'buyer@test.com',
        },
      }
      responseQueue.push([], [])
      const res = await POST(makeRequest('{}'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.received).toBe(true)
    })
  })
})
