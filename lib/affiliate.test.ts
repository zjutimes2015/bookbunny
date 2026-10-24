import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  AFFILIATE_TIERS,
  buildReferralLink,
  computeCommissionCents,
  generateReferralCode,
  isAffiliateTier,
  isValidCode,
  isValidEmail,
  maskEmail,
  normalizeCode,
  resolveRates,
  attributeReferral,
  recordCommissionForPayment,
} from './affiliate'

type QueryResult = Record<string, unknown>[]

function makeSql(queue: QueryResult[]) {
  const calls: string[] = []
  const sql = vi.fn((strings: TemplateStringsArray, ..._values: unknown[]) => {
    calls.push(strings.join('?'))
    return Promise.resolve(queue.shift() ?? [])
  })
  return { sql: sql as unknown as (s: TemplateStringsArray, ...v: unknown[]) => Promise<any[]>, calls }
}

describe('affiliate — pure helpers', () => {
  it('normalizes codes to uppercase alphanumerics', () => {
    expect(normalizeCode(' ab-12_cd ')).toBe('AB12CD')
    expect(normalizeCode(null)).toBe('')
  })

  it('validates code length and charset', () => {
    expect(isValidCode('ABCD1234')).toBe(true)
    expect(isValidCode('ABC')).toBe(false)
    expect(isValidCode('ABCD-1234')).toBe(false)
    expect(isValidCode('A'.repeat(17))).toBe(false)
  })

  it('generates an 8-character code from an unambiguous alphabet', () => {
    const code = generateReferralCode()
    expect(code).toHaveLength(8)
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/)
  })

  it('builds a referral link without duplicating slashes', () => {
    expect(buildReferralLink('https://sprouttales.com/', 'ABC123')).toBe(
      'https://sprouttales.com/?ref=ABC123',
    )
    expect(buildReferralLink('https://sprouttales.com', 'ABC123', '/pricing')).toBe(
      'https://sprouttales.com/pricing?ref=ABC123',
    )
  })

  it('computes rounded commission amounts', () => {
    expect(computeCommissionCents(1200, 30)).toBe(360)
    expect(computeCommissionCents(2900, 15)).toBe(435)
    expect(computeCommissionCents(999, 30)).toBe(300)
    expect(computeCommissionCents(0, 30)).toBe(0)
    expect(computeCommissionCents(1000, 0)).toBe(0)
    expect(computeCommissionCents(-100, 30)).toBe(0)
  })

  it('masks referral emails for privacy', () => {
    expect(maskEmail('jane.doe@example.com')).toBe('j***e@example.com')
    expect(maskEmail('ab@example.com')).toBe('a***@example.com')
    expect(maskEmail(null)).toBe('—')
  })

  it('falls back to tier defaults when stored rates are missing', () => {
    expect(resolveRates({ tier: 'tier2', first_rate: 0, recurring_rate: 0 })).toEqual({
      firstRate: AFFILIATE_TIERS.tier2.firstRate,
      recurringRate: AFFILIATE_TIERS.tier2.recurringRate,
    })
    expect(resolveRates({ tier: 'tier1', first_rate: 35, recurring_rate: 18 })).toEqual({
      firstRate: 35,
      recurringRate: 18,
    })
  })

  it('guards tier and email validation', () => {
    expect(isAffiliateTier('tier1')).toBe(true)
    expect(isAffiliateTier('tier9')).toBe(false)
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('a@b')).toBe(false)
  })
})

describe('affiliate — attributeReferral', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects malformed codes without touching the database', async () => {
    const { sql, calls } = makeSql([])
    await expect(attributeReferral(sql, { userId: 'u1', code: '??' })).resolves.toBe(false)
    expect(calls).toHaveLength(0)
  })

  it('rejects self-referral', async () => {
    const { sql } = makeSql([
      [{ id: 'aff1', user_id: 'u1', code: 'ABC123', status: 'active', tier: 'tier1' }],
    ])
    await expect(attributeReferral(sql, { userId: 'u1', code: 'ABC123' })).resolves.toBe(false)
  })

  it('ignores suspended affiliates', async () => {
    const { sql } = makeSql([
      [{ id: 'aff1', user_id: 'u2', code: 'ABC123', status: 'suspended', tier: 'tier1' }],
    ])
    await expect(attributeReferral(sql, { userId: 'u1', code: 'ABC123' })).resolves.toBe(false)
  })

  it('returns false when the referral already exists', async () => {
    const { sql } = makeSql([
      [{ id: 'aff1', user_id: 'u2', code: 'ABC123', status: 'active', tier: 'tier1' }],
      [], // ON CONFLICT DO NOTHING -> no row returned
    ])
    await expect(attributeReferral(sql, { userId: 'u1', code: 'abc123' })).resolves.toBe(false)
  })

  it('creates a referral for a new signup', async () => {
    const { sql } = makeSql([
      [{ id: 'aff1', user_id: 'u2', code: 'ABC123', status: 'active', tier: 'tier1' }],
      [{ id: 'ref1' }],
    ])
    await expect(attributeReferral(sql, { userId: 'u1', code: 'abc123' })).resolves.toBe(true)
  })
})

describe('affiliate — recordCommissionForPayment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does nothing without a positive amount', async () => {
    const { sql, calls } = makeSql([])
    await expect(
      recordCommissionForPayment(sql, { userId: 'u1', paymentId: 'p1', grossCents: 0 }),
    ).resolves.toBe(0)
    expect(calls).toHaveLength(0)
  })

  it('pays the first-payment rate and marks the referral converted', async () => {
    const { sql, calls } = makeSql([
      [
        {
          id: 'ref1',
          affiliate_id: 'aff1',
          affiliate_user_id: 'u2',
          status: 'active',
          tier: 'tier1',
          first_rate: 30,
          recurring_rate: 15,
        },
      ],
      [], // no prior first commission
      [{ id: 'com1' }],
      [],
    ])
    await expect(
      recordCommissionForPayment(sql, { userId: 'u1', paymentId: 'p1', grossCents: 1200 }),
    ).resolves.toBe(360)
    expect(calls.some((q) => q.includes('UPDATE referrals'))).toBe(true)
  })

  it('pays the recurring rate on later payments', async () => {
    const { sql } = makeSql([
      [
        {
          id: 'ref1',
          affiliate_id: 'aff1',
          affiliate_user_id: 'u2',
          status: 'active',
          tier: 'tier1',
          first_rate: 30,
          recurring_rate: 15,
        },
      ],
      [{ 1: 1 }], // prior first commission exists
      [{ id: 'com2' }],
      [],
    ])
    await expect(
      recordCommissionForPayment(sql, { userId: 'u1', paymentId: 'p2', grossCents: 1200 }),
    ).resolves.toBe(180)
  })

  it('is idempotent per payment id', async () => {
    const { sql } = makeSql([
      [
        {
          id: 'ref1',
          affiliate_id: 'aff1',
          affiliate_user_id: 'u2',
          status: 'active',
          tier: 'tier1',
          first_rate: 30,
          recurring_rate: 15,
        },
      ],
      [],
      [], // ON CONFLICT DO NOTHING -> insert returned nothing
    ])
    await expect(
      recordCommissionForPayment(sql, { userId: 'u1', paymentId: 'p1', grossCents: 1200 }),
    ).resolves.toBe(0)
  })

  it('resolves the user id from email when metadata is missing', async () => {
    const { sql } = makeSql([
      [{ id: 'u1' }],
      [
        {
          id: 'ref1',
          affiliate_id: 'aff1',
          affiliate_user_id: 'u2',
          status: 'active',
          tier: 'tier1',
          first_rate: 30,
          recurring_rate: 15,
        },
      ],
      [],
      [{ id: 'com1' }],
      [],
    ])
    await expect(
      recordCommissionForPayment(sql, {
        email: 'buyer@example.com',
        paymentId: 'p3',
        grossCents: 900,
      }),
    ).resolves.toBe(270)
  })

  it('skips users without an affiliate referral', async () => {
    const { sql } = makeSql([[]])
    await expect(
      recordCommissionForPayment(sql, { userId: 'u9', paymentId: 'p4', grossCents: 1200 }),
    ).resolves.toBe(0)
  })
})
