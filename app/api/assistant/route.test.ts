import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(async () => null),
}))

import { POST } from './route'

function makeRequest(body: unknown): NextRequest {
  const req = new Request('http://localhost/api/assistant', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
  Object.defineProperty(req, 'cookies', {
    value: { get: () => undefined },
    configurable: true,
  })
  return req
}

describe('POST /api/assistant', () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = ''
  })

  it('rejects a missing buddy', async () => {
    const res = await POST(makeRequest({ persona: 'bunny', message: 'hello' }))
    expect(res.status).toBe(400)
  })

  it('asks for a name before spending anything', async () => {
    const res = await POST(makeRequest({ persona: 'lila', message: 'Please make a book' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.proposal).toBeNull()
    expect(body.reply).toMatch(/name/i)
    expect(body.persona).toBe('lila')
  })

  it('returns a confirmation and does not create a book', async () => {
    const res = await POST(makeRequest({
      persona: 'kai',
      message: 'Make an 8-page GRL C book about dinosaurs for Mia, age 6.',
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.proposal).toMatchObject({
      childName: 'Mia',
      theme: 'dinosaurs',
      pages: 8,
      level: 'C',
    })
    expect(body.reply).toMatch(/Make this book/)
    expect(body.signedIn).toBe(false)
  })
})
