import { describe, it, expect } from 'vitest'
import {
  VPC_CREDIT_CENTS,
  applyCreditToAmount,
  consumeVpcCredit,
  getPendingVpcCredit,
  grantVpcCredit,
  stampFirstOrder,
  type VpcCreditSql,
} from './vpc-credit'

/**
 * In-memory fake for the Neon tagged-template client. It emulates the
 * Postgres semantics the ledger relies on: ON CONFLICT (source_order_id)
 * DO NOTHING, WHERE-filtered UPDATEs, RETURNING *, and the partial unique
 * index on (user_id) WHERE status = 'granted' (a second pending insert for
 * the same user throws a 23505-style error). It does NOT emulate real
 * Postgres concurrency timing — the race test below only interleaves the two
 * grants at JS await boundaries. A real-Postgres concurrency check remains
 * open; the DDL index itself is covered by review of
 * scripts/migrate-vpc-credit.cjs, not by this fake.
 */
function createFakeDb() {
  const credits: Record<string, unknown>[] = []
  const queries: string[] = []

  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('?').replace(/\s+/g, ' ').trim()
    queries.push(text)

    if (text.startsWith('SELECT * FROM vpc_credits')) {
      if (text.includes('source_order_id')) {
        return credits.filter((c) => c.source_order_id === values[0])
      }
      // Pending-credit lookup: user_id + status = 'granted'.
      return credits.filter((c) => c.user_id === values[0] && c.status === 'granted')
    }

    if (text.startsWith('INSERT INTO vpc_credits')) {
      const [id, userId, amountCents, sourceOrderId] = values
      // ON CONFLICT (source_order_id) DO NOTHING
      if (credits.some((c) => c.source_order_id === sourceOrderId)) return []
      // Partial unique index: at most one 'granted' row per user. A true
      // check-then-insert race surfaces here as a 23505, exactly as in
      // Postgres — grantVpcCredit does not catch it, so it propagates.
      if (credits.some((c) => c.user_id === userId && c.status === 'granted')) {
        const err = new Error(
          'duplicate key value violates unique constraint "vpc_credits_pending_uidx"',
        ) as Error & { code: string }
        err.code = '23505'
        throw err
      }
      const row: Record<string, unknown> = {
        id,
        user_id: userId,
        amount_cents: amountCents,
        status: 'granted',
        source_order_id: sourceOrderId,
        first_order_id: null,
        first_order_at: null,
        consumed_order_id: null,
        consumed_at: null,
        granted_at: '2026-11-13T00:00:00.000Z',
      }
      credits.push(row)
      return [row]
    }

    if (text.startsWith('UPDATE vpc_credits SET first_order_id')) {
      const [orderId, userId] = values
      const row = credits.find(
        (c) => c.user_id === userId && c.status === 'granted' && c.first_order_id === null,
      )
      if (!row) return []
      row.first_order_id = orderId
      row.first_order_at = '2026-11-13T01:00:00.000Z'
      return [row]
    }

    if (text.startsWith('UPDATE vpc_credits SET status')) {
      const [orderId, userId] = values
      const row = credits.find((c) => c.user_id === userId && c.status === 'granted')
      if (!row) return []
      row.status = 'consumed'
      row.consumed_order_id = orderId
      row.consumed_at = '2026-11-13T02:00:00.000Z'
      return [row]
    }

    throw new Error(`unexpected query in fake: ${text}`)
  }) as VpcCreditSql

  return { sql, credits, queries }
}

describe('grantVpcCredit', () => {
  it('grants a $1.00 credit when the VPC charge settles', async () => {
    const { sql, credits } = createFakeDb()
    const result = await grantVpcCredit(sql, {
      userId: 'u1',
      sourceOrderId: 'ord_vpc_1',
      amountCents: 100,
    })

    expect(result.granted).toBe(true)
    expect(result.reason).toBe('granted')
    expect(result.credit).toMatchObject({
      userId: 'u1',
      amountCents: VPC_CREDIT_CENTS,
      status: 'granted',
      sourceOrderId: 'ord_vpc_1',
      firstOrderId: null,
      consumedOrderId: null,
    })
    expect(credits).toHaveLength(1)
    expect(VPC_CREDIT_CENTS).toBe(100)
  })

  it('grants nothing when the settled amount is zero (no fee was paid)', async () => {
    const { sql, credits, queries } = createFakeDb()
    const result = await grantVpcCredit(sql, {
      userId: 'u1',
      sourceOrderId: 'ord_vpc_0',
      amountCents: 0,
    })

    expect(result).toMatchObject({ granted: false, credit: null, reason: 'non-positive-amount' })
    expect(credits).toHaveLength(0)
    expect(queries.some((q) => q.startsWith('INSERT INTO vpc_credits'))).toBe(false)
  })

  it('caps the credit at $1.00 even if the settled amount is higher', async () => {
    const { sql } = createFakeDb()
    const result = await grantVpcCredit(sql, {
      userId: 'u1',
      sourceOrderId: 'ord_vpc_big',
      amountCents: 250,
    })
    expect(result.credit?.amountCents).toBe(100)
  })

  it('credits only the fee actually paid when it is below $1.00', async () => {
    const { sql } = createFakeDb()
    const result = await grantVpcCredit(sql, {
      userId: 'u1',
      sourceOrderId: 'ord_vpc_half',
      amountCents: 50,
    })
    expect(result.credit?.amountCents).toBe(50)
  })

  it('does not double-grant on a duplicate delivery of the same VPC order', async () => {
    const { sql, credits } = createFakeDb()
    const input = { userId: 'u1', sourceOrderId: 'ord_vpc_dup', amountCents: 100 }
    await grantVpcCredit(sql, input)
    const second = await grantVpcCredit(sql, input)

    expect(second.granted).toBe(false)
    expect(credits).toHaveLength(1)
  })

  it('returns the existing row instead of a second credit when the same order re-grants after consumption', async () => {
    const { sql, credits } = createFakeDb()
    const input = { userId: 'u1', sourceOrderId: 'ord_vpc_replay', amountCents: 100 }
    await grantVpcCredit(sql, input)
    await consumeVpcCredit(sql, { userId: 'u1', orderId: 'ord_book_1' })

    const replay = await grantVpcCredit(sql, input)
    expect(replay).toMatchObject({ granted: false, reason: 'duplicate-order' })
    expect(replay.credit?.sourceOrderId).toBe('ord_vpc_replay')
    expect(credits).toHaveLength(1)
  })

  it('does not stack a second credit when the user re-verifies while one is pending', async () => {
    const { sql, credits } = createFakeDb()
    await grantVpcCredit(sql, { userId: 'u1', sourceOrderId: 'ord_vpc_a', amountCents: 100 })
    const second = await grantVpcCredit(sql, {
      userId: 'u1',
      sourceOrderId: 'ord_vpc_b',
      amountCents: 100,
    })

    expect(second).toMatchObject({ granted: false, reason: 'already-granted' })
    expect(second.credit?.sourceOrderId).toBe('ord_vpc_a')
    expect(credits).toHaveLength(1)
  })

  it('rejects a grant with no user or order identity', async () => {
    const { sql } = createFakeDb()
    await expect(
      grantVpcCredit(sql, { userId: '', sourceOrderId: 'ord_x', amountCents: 100 }),
    ).rejects.toThrow('requires userId and sourceOrderId')
    await expect(
      grantVpcCredit(sql, { userId: 'u1', sourceOrderId: '', amountCents: 100 }),
    ).rejects.toThrow('requires userId and sourceOrderId')
  })

  it('grants nothing for a non-USD settled charge (USD-only ledger)', async () => {
    const { sql, credits, queries } = createFakeDb()
    const result = await grantVpcCredit(sql, {
      userId: 'u1',
      sourceOrderId: 'ord_vpc_eur',
      amountCents: 100,
      currency: 'EUR',
    })

    expect(result).toMatchObject({ granted: false, credit: null, reason: 'unsupported-currency' })
    expect(credits).toHaveLength(0)
    expect(queries.some((q) => q.startsWith('INSERT INTO vpc_credits'))).toBe(false)
  })

  it('grants normally when the event omits the currency (defaults to USD)', async () => {
    const { sql } = createFakeDb()
    const result = await grantVpcCredit(sql, {
      userId: 'u1',
      sourceOrderId: 'ord_vpc_nocurr',
      amountCents: 100,
    })
    expect(result.granted).toBe(true)
    expect(result.reason).toBe('granted')
  })

  it('treats a lowercase currency code as USD (case-insensitive comparison)', async () => {
    const { sql } = createFakeDb()
    const result = await grantVpcCredit(sql, {
      userId: 'u1',
      sourceOrderId: 'ord_vpc_lowerusd',
      amountCents: 100,
      currency: 'usd',
    })
    expect(result.granted).toBe(true)
    expect(result.reason).toBe('granted')
  })

  it('grants nothing for a NaN settled amount (treated as zero, never inserted)', async () => {
    const { sql, credits, queries } = createFakeDb()
    const result = await grantVpcCredit(sql, {
      userId: 'u1',
      sourceOrderId: 'ord_vpc_nan',
      amountCents: Number.NaN,
    })

    expect(result).toMatchObject({ granted: false, credit: null, reason: 'non-positive-amount' })
    expect(credits).toHaveLength(0)
    expect(queries.some((q) => q.startsWith('INSERT INTO vpc_credits'))).toBe(false)
  })

  it('mints exactly one credit when two different VPC orders for one user race', async () => {
    const { sql, credits } = createFakeDb()
    const results = await Promise.allSettled([
      grantVpcCredit(sql, { userId: 'u1', sourceOrderId: 'ord_vpc_race_a', amountCents: 100 }),
      grantVpcCredit(sql, { userId: 'u1', sourceOrderId: 'ord_vpc_race_b', amountCents: 100 }),
    ])

    const granted = results.filter(
      (r) => r.status === 'fulfilled' && r.value.granted,
    )
    const rejected = results.filter((r) => r.status === 'rejected')
    expect(granted).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({ code: '23505' })
    expect(credits).toHaveLength(1)
  })
})

describe('stampFirstOrder (first-order detection)', () => {
  it('stamps the first paid order after the grant onto the pending credit', async () => {
    const { sql } = createFakeDb()
    await grantVpcCredit(sql, { userId: 'u1', sourceOrderId: 'ord_vpc_1', amountCents: 100 })

    const stamped = await stampFirstOrder(sql, { userId: 'u1', orderId: 'ord_book_1' })
    expect(stamped).toMatchObject({
      status: 'granted', // stamping is not consumption
      firstOrderId: 'ord_book_1',
      consumedOrderId: null,
    })
    expect(stamped?.firstOrderAt).toBeTruthy()
  })

  it('lets exactly one order win the stamp; later orders find nothing to stamp', async () => {
    const { sql } = createFakeDb()
    await grantVpcCredit(sql, { userId: 'u1', sourceOrderId: 'ord_vpc_1', amountCents: 100 })
    await stampFirstOrder(sql, { userId: 'u1', orderId: 'ord_book_1' })

    const second = await stampFirstOrder(sql, { userId: 'u1', orderId: 'ord_book_2' })
    expect(second).toBeNull()
  })

  it('stamps nothing when the user holds no pending credit', async () => {
    const { sql } = createFakeDb()
    expect(await stampFirstOrder(sql, { userId: 'u1', orderId: 'ord_book_1' })).toBeNull()
  })

  it('stamps nothing for a missing user or order identity', async () => {
    const { sql } = createFakeDb()
    expect(await stampFirstOrder(sql, { userId: '', orderId: 'ord_book_1' })).toBeNull()
    expect(await stampFirstOrder(sql, { userId: 'u1', orderId: '' })).toBeNull()
  })
})

describe('applyCreditToAmount', () => {
  it('reduces a normal charge by the full credit', () => {
    expect(applyCreditToAmount(2900, 100)).toEqual({
      chargedCents: 2800,
      appliedCents: 100,
      creditRemainingCents: 0,
    })
  })

  it('never produces a negative charge when the credit exceeds the amount', () => {
    expect(applyCreditToAmount(50, 100)).toEqual({
      chargedCents: 0,
      appliedCents: 50,
      creditRemainingCents: 50,
    })
  })

  it('charges zero for a zero amount and leaves the credit untouched', () => {
    expect(applyCreditToAmount(0, 100)).toEqual({
      chargedCents: 0,
      appliedCents: 0,
      creditRemainingCents: 100,
    })
  })

  it('clamps negative inputs to zero', () => {
    expect(applyCreditToAmount(-500, -100)).toEqual({
      chargedCents: 0,
      appliedCents: 0,
      creditRemainingCents: 0,
    })
  })

  it('treats NaN inputs as zero (never propagates NaN)', () => {
    expect(applyCreditToAmount(Number.NaN, 100)).toEqual({
      chargedCents: 0,
      appliedCents: 0,
      creditRemainingCents: 100,
    })
    expect(applyCreditToAmount(2900, Number.NaN)).toEqual({
      chargedCents: 2900,
      appliedCents: 0,
      creditRemainingCents: 0,
    })
  })
})

describe('consumeVpcCredit', () => {
  it('consumes the pending credit exactly once', async () => {
    const { sql } = createFakeDb()
    await grantVpcCredit(sql, { userId: 'u1', sourceOrderId: 'ord_vpc_1', amountCents: 100 })

    const consumed = await consumeVpcCredit(sql, { userId: 'u1', orderId: 'ord_book_1' })
    expect(consumed).toMatchObject({
      status: 'consumed',
      consumedOrderId: 'ord_book_1',
    })
    expect(consumed?.consumedAt).toBeTruthy()

    // Double-apply is impossible: the second call finds no 'granted' row.
    expect(await consumeVpcCredit(sql, { userId: 'u1', orderId: 'ord_book_2' })).toBeNull()
    expect(await getPendingVpcCredit(sql, 'u1')).toBeNull()
  })

  it('consumes nothing when the user holds no pending credit', async () => {
    const { sql } = createFakeDb()
    expect(await consumeVpcCredit(sql, { userId: 'u1', orderId: 'ord_book_1' })).toBeNull()
  })
})

describe('getPendingVpcCredit', () => {
  it('returns the pending credit, and null once it is consumed', async () => {
    const { sql } = createFakeDb()
    expect(await getPendingVpcCredit(sql, 'u1')).toBeNull()

    await grantVpcCredit(sql, { userId: 'u1', sourceOrderId: 'ord_vpc_1', amountCents: 100 })
    expect(await getPendingVpcCredit(sql, 'u1')).toMatchObject({ sourceOrderId: 'ord_vpc_1' })

    await consumeVpcCredit(sql, { userId: 'u1', orderId: 'ord_book_1' })
    expect(await getPendingVpcCredit(sql, 'u1')).toBeNull()
  })

  it('returns null for a missing user identity', async () => {
    const { sql } = createFakeDb()
    expect(await getPendingVpcCredit(sql, '')).toBeNull()
  })
})
