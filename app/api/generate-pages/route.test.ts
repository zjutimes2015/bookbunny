import { describe, it, expect, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, count: 1, limit: 10 })),
}))

// next/server 的 after() 在请求作用域外会抛错，测试里替换为空实现
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return { ...actual, after: () => {} }
})

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(async () => null),
  getClientIp: vi.fn(() => '1.2.3.4'),
}))

// 只验证到人机校验这一步；DB 写入与生成逻辑不在本测试范围内
vi.mock('@neondatabase/serverless', () => ({
  neon: () => vi.fn(async () => []),
}))

import { POST } from './route'
import { HUMAN_COOKIE, issuePassValue } from '@/lib/turnstile'

const body = {
  outline: [{ pageNumber: 1, pageFunction: 'body', pageText: 'Hello' }],
}

function makeRequest(payload: Record<string, unknown>, cookie?: string): NextRequest {
  return new NextRequest('http://localhost/api/generate-pages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(payload),
  })
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/generate-pages — human verification gate', () => {
  it('rejects requests without a pass', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')

    const res = await POST(makeRequest(body))
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('bot_check_required')
  })

  it('rejects requests with a forged pass', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')

    const res = await POST(makeRequest(body, `${HUMAN_COOKIE}=9999999999.forged`))
    expect(res.status).toBe(403)
  })

  it('accepts a valid pass and queues a generation job', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')

    const res = await POST(makeRequest(body, `${HUMAN_COOKIE}=${issuePassValue()}`))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.genId).toMatch(/^gen_/)
    expect(json.total).toBe(1)
  })

  it('validates the outline before the human check', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')

    const res = await POST(makeRequest({ outline: [] }))
    expect(res.status).toBe(400)
  })
})
