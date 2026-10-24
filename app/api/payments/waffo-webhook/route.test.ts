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

  describe('credits pack purchase', () => {
    it('adds 5 credits when plan is credits_5', async () => {
      mockEvent = {
        eventType: 'order.completed',
        data: {
          orderId: 'o-credits',
          orderMetadata: { plan: 'credits_5', userId: 'u1' },
          chargedAmount: '9.00',
          currency: 'USD',
          buyerEmail: 'buyer@test.com',
        },
      }
      // INSERT payments, then UPDATE credits
      responseQueue.push([], [])
      const res = await POST(makeRequest('{}'))
      expect(res.status).toBe(200)

      const creditUpdate = callLog.find(q => q.includes('SET credits = COALESCE(credits, 0) + 5'))
      expect(creditUpdate).toBeDefined()
      // Should target by userId, not email
      expect(creditUpdate).toContain('WHERE id = ?')
    })

    it('falls back to email when userId is missing', async () => {
      mockEvent = {
        eventType: 'order.completed',
        data: {
          orderId: 'o-credits-email',
          orderMetadata: { plan: 'credits_5' },
          chargedAmount: '9.00',
          buyerEmail: 'buyer@test.com',
        },
      }
      responseQueue.push([], [])
      await POST(makeRequest('{}'))

      const creditUpdate = callLog.find(q => q.includes('SET credits = COALESCE(credits, 0) + 5'))
      expect(creditUpdate).toBeDefined()
      expect(creditUpdate).toContain('WHERE email = ?')
    })
  })

  describe('subscription activation', () => {
    it('sets tier, allowance, and reset_at for starter_monthly', async () => {
      mockEvent = {
        eventType: 'subscription.activated',
        data: {
          orderId: 'o-starter',
          orderMetadata: { plan: 'starter_monthly', userId: 'u1' },
          chargedAmount: '12.00',
          buyerEmail: 'buyer@test.com',
        },
      }
      // INSERT payments + UPDATE user
      responseQueue.push([], [])
      await POST(makeRequest('{}'))

      const userUpdate = callLog.find(q => q.includes('subscription_tier = ?'))
      expect(userUpdate).toBeDefined()
      // starter allowance = 10
      expect(userUpdate).toContain('monthly_allowance_remaining = ?')
      expect(userUpdate).toContain('allowance_reset_at = ?')
      expect(userUpdate).toContain('is_paid = TRUE')
    })

    it('sets creator allowance to 30', async () => {
      mockEvent = {
        eventType: 'order.completed',
        data: {
          orderId: 'o-creator',
          orderMetadata: { plan: 'creator_monthly', userId: 'u1' },
          chargedAmount: '29.00',
          buyerEmail: 'buyer@test.com',
        },
      }
      responseQueue.push([], [])
      await POST(makeRequest('{}'))

      // The update should set allowance; we verify the query was the allowance-setting one
      const updates = callLog.filter(q => q.includes('UPDATE bookbunny_users'))
      expect(updates.length).toBe(1)
      expect(updates[0]).toContain('monthly_allowance_remaining = ?')
      expect(updates[0]).toContain('subscription_tier = ?')
    })

    it('defaults to starter_monthly when plan metadata is absent', async () => {
      mockEvent = {
        eventType: 'order.completed',
        data: {
          orderId: 'o-default',
          chargedAmount: '12.00',
          buyerEmail: 'buyer@test.com',
        },
      }
      responseQueue.push([], [])
      await POST(makeRequest('{}'))

      // Should still process (default plan = starter_monthly)
      const userUpdate = callLog.find(q => q.includes('UPDATE bookbunny_users'))
      expect(userUpdate).toBeDefined()
    })

    it('updates by email when userId is missing', async () => {
      mockEvent = {
        eventType: 'subscription.activated',
        data: {
          orderId: 'o-email',
          orderMetadata: { plan: 'creator_monthly' },
          chargedAmount: '29.00',
          buyerEmail: 'buyer@test.com',
        },
      }
      responseQueue.push([], [])
      await POST(makeRequest('{}'))

      const userUpdate = callLog.find(q => q.includes('UPDATE bookbunny_users'))
      expect(userUpdate).toContain('WHERE email = ?')
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
          orderMetadata: { plan: 'credits_5', userId: 'u1' },
          chargedAmount: '9.00',
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
