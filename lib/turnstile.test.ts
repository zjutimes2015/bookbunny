import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  attachPassCookie,
  isTurnstileConfigured,
  issuePassValue,
  verifyPassValue,
  verifyTurnstileToken,
} from './turnstile'
import { NextResponse } from 'next/server'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('turnstile pass cookie', () => {
  it('issues a verifiable pass when a secret is configured', () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')
    const value = issuePassValue()
    expect(value).toMatch(/^\d+\.[0-9a-f]{64}$/)
    expect(verifyPassValue(value)).toBe(true)
  })

  it('rejects a tampered signature', () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')
    const value = issuePassValue()
    const [exp, sig] = value.split('.')
    const tampered = `${exp}.${sig.replace(/^./, sig[0] === 'a' ? 'b' : 'a')}`
    expect(verifyPassValue(tampered)).toBe(false)
  })

  it('rejects an expired pass', () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000
    const value = issuePassValue(threeHoursAgo)
    expect(verifyPassValue(value)).toBe(false)
  })

  it('cannot issue passes in production without a secret (fail-closed)', () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    vi.stubEnv('NODE_ENV', 'production')
    expect(issuePassValue()).toBe('')
    expect(verifyPassValue('123.abc')).toBe(false)
    expect(isTurnstileConfigured()).toBe(false)
  })

  it('issues a dev-only pass outside production when no secret is configured', () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    vi.stubEnv('NODE_ENV', 'test')
    // 本地开发仍需跑通完整流程，因此使用固定的 DEV 密钥签发
    expect(verifyPassValue(issuePassValue())).toBe(true)
    expect(isTurnstileConfigured()).toBe(false)
  })

  it('rejects malformed values', () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')
    expect(verifyPassValue(undefined)).toBe(false)
    expect(verifyPassValue('')).toBe(false)
    expect(verifyPassValue('not-a-pass')).toBe(false)
    expect(verifyPassValue('123')).toBe(false)
  })

  it('sets an httpOnly cookie on the response', () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')
    const res = attachPassCookie(NextResponse.json({ ok: true }))
    const cookie = res.headers.get('set-cookie') || ''
    expect(cookie).toContain('bb_human=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Path=/')
  })
})

describe('verifyTurnstileToken', () => {
  it('accepts Cloudflare test tokens outside production when no secret is set', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    vi.stubEnv('NODE_ENV', 'test')
    expect(await verifyTurnstileToken('1x00000000000000000000AA')).toBe(true)
    expect(await verifyTurnstileToken('2x00000000000000000000AA')).toBe(true)
  })

  it('rejects arbitrary tokens outside production when no secret is set', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    vi.stubEnv('NODE_ENV', 'test')
    expect(await verifyTurnstileToken('not-a-test-token')).toBe(false)
    expect(await verifyTurnstileToken('')).toBe(false)
  })

  it('rejects everything in production when no secret is set', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    vi.stubEnv('NODE_ENV', 'production')
    expect(await verifyTurnstileToken('1x00000000000000000000AA')).toBe(false)
  })

  it('calls siteverify and honours the result', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')

    const bodies: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const body = String((init as RequestInit).body)
      bodies.push(body)
      const ok = body.includes('response=token-1')
      return { json: async () => ({ success: ok }) } as Response
    })

    expect(await verifyTurnstileToken('token-1', '1.2.3.4')).toBe(true)
    expect(bodies[0]).toContain('secret=test-secret')
    expect(bodies[0]).toContain('response=token-1')
    expect(bodies[0]).toContain('remoteip=1.2.3.4')

    expect(await verifyTurnstileToken('token-2')).toBe(false)
  })

  it('returns false when the network call throws', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network down'))
    expect(await verifyTurnstileToken('token')).toBe(false)
  })
})
