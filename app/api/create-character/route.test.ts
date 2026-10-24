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

function makeForm(cookie?: string): NextRequest {
  const form = new FormData()
  form.append('name', 'Luna')
  form.append('theme', 'A magical forest')
  form.append('ageGroup', '3-5')
  form.append('photoUsage', 'illustrated')

  return new NextRequest('http://localhost/api/create-character', {
    method: 'POST',
    headers: cookie ? { cookie } : undefined,
    body: form,
  })
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.mocked(generateCharacterCard).mockClear()
})

describe('POST /api/create-character — human verification gate', () => {
  it('rejects requests without a pass', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')

    const res = await POST(makeForm())
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('bot_check_required')
    expect(generateCharacterCard).not.toHaveBeenCalled()
  })

  it('accepts a valid pass cookie', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')

    const res = await POST(makeForm(`${HUMAN_COOKIE}=${issuePassValue()}`))
    expect(res.status).toBe(200)
    expect(generateCharacterCard).toHaveBeenCalledOnce()
  })
})
