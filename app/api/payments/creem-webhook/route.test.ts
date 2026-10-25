import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import crypto from 'node:crypto'

const { recordMock, neonMock } = vi.hoisted(() => ({
  recordMock: vi.fn(),
  neonMock: vi.fn(),
}))

vi.mock('@/lib/compliance/consent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/compliance/consent')>()
  return { ...actual, recordConsent: recordMock }
})
vi.mock('@neondatabase/serverless', () => ({ neon: neonMock }))
vi.mock('@/lib/payments/creem', () => ({
  VPC_VERIFICATION: { productId: 'prod_vpc', priceCents: 50, name: 'Parental Consent Verification' },
}))

import { POST } from './route'

const SECRET = 'test-webhook-secret'

function sign(body: string) {
  return crypto.createHmac('sha256', SECRET).update(body).digest('hex')
}

function makeRequest(body: unknown, signature?: string) {
  return new Request('http://localhost/api/payments/creem-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(signature ? { 'creem-signature': signature } : {}),
    },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0]
}

function vpcEvent(metadata: Record<string, unknown> = { purpose: 'vpc', userId: 'parent-1', method: 'card-charge' }) {
  return {
    eventType: 'checkout.completed',
    object: { id: 'ch_1', order: { id: 'ord_1', amount: 50 }, checkout: { metadata } },
  }
}

describe('POST /api/payments/creem-webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CREEM_WEBHOOK_SECRET = SECRET
    recordMock.mockResolvedValue({ id: 'consent-1' })
    neonMock.mockReturnValue(vi.fn())
  })

  afterEach(() => {
    delete process.env.CREEM_WEBHOOK_SECRET
  })

  it('fails closed when no webhook secret is configured', async () => {
    delete process.env.CREEM_WEBHOOK_SECRET
    const body = JSON.stringify(vpcEvent())
    const res = await POST(makeRequest(vpcEvent(), sign(body)))
    expect(res.status).toBe(503)
    expect(recordMock).not.toHaveBeenCalled()
  })

  it('rejects a request with no signature', async () => {
    const res = await POST(makeRequest(vpcEvent()))
    expect(res.status).toBe(401)
    expect(recordMock).not.toHaveBeenCalled()
  })

  it('rejects a forged signature', async () => {
    const res = await POST(makeRequest(vpcEvent(), 'deadbeef'))
    expect(res.status).toBe(401)
    expect(recordMock).not.toHaveBeenCalled()
  })

  it('records parental consent for a signed VPC charge', async () => {
    const event = vpcEvent()
    const res = await POST(makeRequest(event, sign(JSON.stringify(event))))
    expect(res.status).toBe(200)
    expect(recordMock).toHaveBeenCalledTimes(1)
    expect(recordMock.mock.calls[0][0]).toMatchObject({
      userId: 'parent-1',
      vpcMethod: 'card-charge',
      vpcReference: 'ord_1',
    })
  })

  it('never grants a plan, even for a validly signed checkout event', async () => {
    const event = vpcEvent({ userId: 'parent-1', plan: 'creator' })
    const res = await POST(makeRequest(event, sign(JSON.stringify(event))))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ignored: true })
    expect(recordMock).not.toHaveBeenCalled()
    expect(neonMock).not.toHaveBeenCalled()
  })
})
