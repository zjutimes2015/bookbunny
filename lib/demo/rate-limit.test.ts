import { describe, it, expect } from 'vitest'
import { checkDemoQuota, DEMO_WINDOW_MS } from './rate-limit'

describe('checkDemoQuota — 1 demo per IP+device per rolling 24h', () => {
  it('allows the first generation and records the window end', () => {
    const store = new Map<string, number>()
    const res = checkDemoQuota(store, 'demo:1.2.3.4:abc', 1_000_000)
    expect(res.allowed).toBe(true)
    expect(res.resetAt).toBe(1_000_000 + DEMO_WINDOW_MS)
    expect(store.size).toBe(1)
  })

  it('rejects a second generation inside the window', () => {
    const store = new Map<string, number>()
    checkDemoQuota(store, 'demo:1.2.3.4:abc', 1_000_000)
    const res = checkDemoQuota(store, 'demo:1.2.3.4:abc', 1_000_000 + 60_000)
    expect(res.allowed).toBe(false)
    expect(res.resetAt).toBe(1_000_000 + DEMO_WINDOW_MS)
  })

  it('allows a different key (different device on the same IP)', () => {
    const store = new Map<string, number>()
    checkDemoQuota(store, 'demo:1.2.3.4:device-a', 1_000_000)
    expect(checkDemoQuota(store, 'demo:1.2.3.4:device-b', 1_000_000 + 1).allowed).toBe(true)
  })

  it('allows again once the window has fully elapsed', () => {
    const store = new Map<string, number>()
    checkDemoQuota(store, 'demo:1.2.3.4:abc', 1_000_000)
    expect(checkDemoQuota(store, 'demo:1.2.3.4:abc', 1_000_000 + DEMO_WINDOW_MS - 1).allowed).toBe(
      false,
    )
    expect(checkDemoQuota(store, 'demo:1.2.3.4:abc', 1_000_000 + DEMO_WINDOW_MS).allowed).toBe(true)
  })

  it('prunes expired entries instead of growing forever', () => {
    const store = new Map<string, number>([['old', 0]])
    checkDemoQuota(store, 'new', DEMO_WINDOW_MS + 1)
    expect(store.has('old')).toBe(false)
    expect(store.has('new')).toBe(true)
  })
})
