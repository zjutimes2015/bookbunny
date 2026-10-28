import { describe, it, expect } from 'vitest'
import {
  TIER_ALLOWANCE,
  TIER_ALLOWANCE_ANNUAL,
  allowanceFor,
  allowanceAfterReset,
  bookCostUnits,
  nextResetAt,
  ROLLOVER_RATIO,
} from './allocation'

describe('allowanceFor', () => {
  it('returns the monthly allowance for each paid tier', () => {
    expect(allowanceFor('free')).toBe(1)
    expect(allowanceFor('creator')).toBe(8)
    expect(allowanceFor('studio')).toBe(22)
    expect(allowanceFor('teacher')).toBe(40)
  })

  it('scales the annual allowance down to match the 75% annual price', () => {
    // 年付价格是月付的 75%，额度必须同比下调，否则年付毛利被击穿
    expect(allowanceFor('creator', 'year')).toBe(6)
    expect(allowanceFor('studio', 'year')).toBe(16)
    expect(allowanceFor('teacher', 'year')).toBe(30)
  })

  it('returns zero for an unknown tier', () => {
    expect(allowanceFor('nope')).toBe(0)
  })
})

describe('bookCostUnits', () => {
  it('charges one unit for a standard book', () => {
    expect(bookCostUnits('1:1', 8)).toBe(1)
    expect(bookCostUnits('1:1', 12)).toBe(1)
  })

  it('charges two units for a long book', () => {
    expect(bookCostUnits('1:1', 16)).toBe(2)
    expect(bookCostUnits('1:1', 24)).toBe(2)
  })

  it('charges two units for A4', () => {
    // A4(1024x1448) = 1.41 MP，按整 MP 取整后是 2 MP
    expect(bookCostUnits('a4', 8)).toBe(2)
    expect(bookCostUnits('a4', 12)).toBe(2)
  })

  it('does not stack the A4 premium on the long-book premium', () => {
    // A4 + 24 页仍然是 2 个单位，不是 4 个
    expect(bookCostUnits('a4', 24)).toBe(2)
  })

  it('charges one unit when the aspect is unknown', () => {
    expect(bookCostUnits(null, 8)).toBe(1)
    expect(bookCostUnits(undefined, 8)).toBe(1)
  })
})

describe('rollover', () => {
  it('carries 50% of the unused allowance into the next cycle', () => {
    // Creator 8 本用掉 3 本，剩 5 本 → 结转 2 本（向下取整）
    const carried = Math.floor(5 * ROLLOVER_RATIO)
    expect(carried).toBe(2)
    expect(allowanceAfterReset('creator', 'month', carried)).toBe(10)
  })

  it('carries nothing when the allowance was fully used', () => {
    expect(allowanceAfterReset('creator', 'month', 0)).toBe(8)
  })

  it('never carries more than the base allowance', () => {
    // 上一周期额度异常偏高时，结转不能超过基础额度本身
    const carried = Math.floor(100 * ROLLOVER_RATIO)
    expect(allowanceAfterReset('creator', 'month', carried)).toBe(8 + 50)
  })

  it('ignores a negative rollover', () => {
    expect(allowanceAfterReset('studio', 'month', -5)).toBe(22)
  })

  it('applies the rollover to the annual cycle too', () => {
    expect(allowanceAfterReset('creator', 'year', 3)).toBe(9)
  })

  it('keeps the annual allowance below the monthly one for every paid tier', () => {
    for (const tier of Object.keys(TIER_ALLOWANCE)) {
      if (tier === 'free') continue
      expect(TIER_ALLOWANCE_ANNUAL[tier]).toBeLessThan(TIER_ALLOWANCE[tier])
    }
  })
})

describe('nextResetAt', () => {
  it('lands on the first day of the next month at UTC midnight', () => {
    const d = nextResetAt()
    expect(d.getUTCDate()).toBe(1)
    expect(d.getUTCHours()).toBe(0)
    expect(d.getUTCMinutes()).toBe(0)
    expect(d.getTime()).toBeGreaterThan(Date.now())
  })
})
