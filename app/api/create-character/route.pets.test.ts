import { describe, it, expect, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/api/character', () => ({
  generateCharacterCard: vi.fn(async () => ({ card: {}, imageB64: '' })),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, count: 1, limit: 10 })),
}))

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(async () => null),
  getClientIp: vi.fn(() => '1.2.3.4'),
}))

vi.mock('@/lib/compliance/consent', () => ({
  hasConsent: vi.fn(async () => false),
}))

import { POST } from './route'
import { generateCharacterCard } from '@/lib/api/character'
import { HUMAN_COOKIE, issuePassValue } from '@/lib/turnstile'

/**
 * Builds a request whose parsed form body is stubbed.
 *
 * Why: in this jsdom test environment the global FormData (jsdom) is not the
 * FormData undici's Request understands, so a real multipart upload through
 * NextRequest cannot be constructed here — the same realm mismatch behind the
 * two pre-existing failures in route.test.ts. Body parsing is framework
 * behavior; what these tests pin down is the route's own logic (kind parsing,
 * consent gating, and the arguments passed to generateCharacterCard).
 */
function stubbedRequest(
  fields: Record<string, string>,
  withPhoto: boolean,
  cookie: string,
): NextRequest {
  const req = new NextRequest('http://localhost/api/create-character', {
    method: 'POST',
    headers: { cookie },
  })
  const photo = withPhoto
    ? {
        size: 16,
        type: 'image/png',
        arrayBuffer: async () => new TextEncoder().encode('fake-image-bytes').buffer,
      }
    : null
  const form = {
    get: (key: string): unknown => {
      if (key === 'photo') return photo
      return fields[key] ?? null
    },
  }
  Object.defineProperty(req, 'formData', { value: async () => form })
  return req
}

function passCookie(): string {
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')
  return `${HUMAN_COOKIE}=${issuePassValue()}`
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.mocked(generateCharacterCard).mockClear()
})

describe('POST /api/create-character — pet photos skip the consent gate', () => {
  it('accepts a pet photo with no signed-in user and no consent on file', async () => {
    const res = await POST(stubbedRequest(
      { name: 'Buddy', theme: 't', ageGroup: 'adult', photoUsage: 'illustrated', kind: 'pet', species: 'dog' },
      true,
      passCookie(),
    ))
    expect(res.status).toBe(200)
    expect(generateCharacterCard).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Buddy', kind: 'pet', species: 'dog' }),
    )
  })

  it('accepts a pet added by name only, with no photo at all', async () => {
    const res = await POST(stubbedRequest(
      { name: 'Mochi', theme: 't', ageGroup: 'adult', photoUsage: 'illustrated', kind: 'pet', species: 'cat' },
      false,
      passCookie(),
    ))
    expect(res.status).toBe(200)
    expect(generateCharacterCard).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'pet', species: 'cat' }),
    )
  })

  it('still blocks a child photo with no signed-in user (401)', async () => {
    const res = await POST(stubbedRequest(
      { name: 'Luna', theme: 't', ageGroup: '3-5', photoUsage: 'illustrated' },
      true,
      passCookie(),
    ))
    expect(res.status).toBe(401)
    expect(generateCharacterCard).not.toHaveBeenCalled()
  })

  it('still blocks an explicitly child-kind photo with no signed-in user', async () => {
    const res = await POST(stubbedRequest(
      { name: 'Luna', theme: 't', ageGroup: '3-5', photoUsage: 'illustrated', kind: 'child' },
      true,
      passCookie(),
    ))
    expect(res.status).toBe(401)
    expect(generateCharacterCard).not.toHaveBeenCalled()
  })

  it('treats an unknown kind value as a child photo (fail closed)', async () => {
    const res = await POST(stubbedRequest(
      { name: 'Luna', theme: 't', ageGroup: '3-5', photoUsage: 'illustrated', kind: 'dragon' },
      true,
      passCookie(),
    ))
    expect(res.status).toBe(401)
    expect(generateCharacterCard).not.toHaveBeenCalled()
  })
})
