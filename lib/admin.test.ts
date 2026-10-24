import { describe, it, expect, afterEach, vi } from 'vitest'
import { adminEmails, getAdminSession, isAdminEmail } from './admin'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('adminEmails', () => {
  it('returns an empty list when ADMIN_EMAILS is not set', () => {
    vi.stubEnv('ADMIN_EMAILS', '')
    expect(adminEmails()).toEqual([])
  })

  it('splits, trims and lowercases the whitelist', () => {
    vi.stubEnv('ADMIN_EMAILS', ' Boss@Example.com , ops@example.com ,, ')
    expect(adminEmails()).toEqual(['boss@example.com', 'ops@example.com'])
  })
})

describe('isAdminEmail', () => {
  it('matches case-insensitively', () => {
    vi.stubEnv('ADMIN_EMAILS', 'boss@example.com')
    expect(isAdminEmail('BOSS@example.com')).toBe(true)
    expect(isAdminEmail('  boss@example.com  ')).toBe(true)
  })

  it('rejects emails outside the whitelist', () => {
    vi.stubEnv('ADMIN_EMAILS', 'boss@example.com')
    expect(isAdminEmail('someone@example.com')).toBe(false)
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
    expect(isAdminEmail('')).toBe(false)
  })

  it('rejects everyone when the whitelist is empty (fail-closed)', () => {
    vi.stubEnv('ADMIN_EMAILS', '')
    expect(isAdminEmail('boss@example.com')).toBe(false)
  })
})

describe('getAdminSession', () => {
  it('returns null without touching cookies when no whitelist is configured', async () => {
    vi.stubEnv('ADMIN_EMAILS', '')
    // 未配置白名单时应直接拒绝，不进入 session 查询
    await expect(getAdminSession()).resolves.toBeNull()
  })
})
