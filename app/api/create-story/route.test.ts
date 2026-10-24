import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/api/story', () => ({
  generateStory: vi.fn(async () => ({ title: 'T', outline: [] })),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, count: 1, limit: 10 })),
}))

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(async () => null),
  getClientIp: vi.fn(() => '1.2.3.4'),
}))

import { POST } from './route'
import { generateStory } from '@/lib/api/story'
import { HUMAN_COOKIE, issuePassValue } from '@/lib/turnstile'

const baseBody = {
  theme: 'A magical forest',
  ageGroup: '3-5',
  characterName: 'Luna',
  pages: 8,
}

function makeRequest(body: Record<string, unknown>, cookie?: string): NextRequest {
  return new NextRequest('http://localhost/api/create-story', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.mocked(generateStory).mockClear()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/create-story — human verification gate', () => {
  it('rejects a request with neither pass cookie nor token', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')

    const res = await POST(makeRequest(baseBody))
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.code).toBe('bot_check_required')
    expect(generateStory).not.toHaveBeenCalled()
  })

  it('rejects a forged pass cookie', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')

    const res = await POST(makeRequest(baseBody, `${HUMAN_COOKIE}=9999999999.deadbeef`))
    expect(res.status).toBe(403)
    expect(generateStory).not.toHaveBeenCalled()
  })

  it('accepts a valid pass cookie and calls the model', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')

    const res = await POST(makeRequest(baseBody, `${HUMAN_COOKIE}=${issuePassValue()}`))
    expect(res.status).toBe(200)
    expect(generateStory).toHaveBeenCalledOnce()
  })

  it('exchanges an inline token for a pass cookie', async () => {
    // 未配置 secret 时，非生产环境放行 Cloudflare 测试 token
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    vi.stubEnv('NODE_ENV', 'test')

    const res = await POST(makeRequest({ ...baseBody, turnstileToken: '1x00000000000000000000AA' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie') || '').toContain(`${HUMAN_COOKIE}=`)
  })

  it('still validates required fields before the human check', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')

    const res = await POST(makeRequest({ theme: 'x' }))
    expect(res.status).toBe(400)
  })
})
