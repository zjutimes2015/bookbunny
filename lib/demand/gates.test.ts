import { describe, it, expect } from 'vitest'
import {
  isKdpTier,
  isDemandEnabled,
  demandMonthlyBudgetUsd,
  DEMAND_SCORE_DAILY_LIMIT,
  DEMAND_SUGGESTIONS_DAILY_LIMIT,
  DEFAULT_DEMAND_MONTHLY_BUDGET_USD,
  DEMAND_CACHE_TTL_DAYS,
} from './gates'

describe('isKdpTier (canKdp caliber)', () => {
  it('admits creator / studio / teacher / commercial', () => {
    for (const tier of ['creator', 'studio', 'teacher', 'commercial']) {
      expect(isKdpTier(tier)).toBe(true)
    }
  })
  it('refuses free and all other tiers', () => {
    for (const tier of ['free', 'starter', 'pro', 'credits', 'pro-anim', '', null, undefined]) {
      expect(isKdpTier(tier)).toBe(false)
    }
  })
})

describe('isDemandEnabled', () => {
  it('opens only on explicit true', () => {
    expect(isDemandEnabled('true')).toBe(true)
    expect(isDemandEnabled(undefined)).toBe(false)
    expect(isDemandEnabled('')).toBe(false)
    expect(isDemandEnabled('false')).toBe(false)
    expect(isDemandEnabled('1')).toBe(false)
    expect(isDemandEnabled('True')).toBe(false)
  })
})

describe('demandMonthlyBudgetUsd', () => {
  it('parses a numeric budget', () => {
    expect(demandMonthlyBudgetUsd('100')).toBe(100)
    expect(demandMonthlyBudgetUsd('25.5')).toBe(25.5)
  })
  it('falls back to $50 for missing/invalid/non-positive values', () => {
    expect(demandMonthlyBudgetUsd(undefined)).toBe(50)
    expect(demandMonthlyBudgetUsd('')).toBe(50)
    expect(demandMonthlyBudgetUsd('abc')).toBe(50)
    expect(demandMonthlyBudgetUsd('0')).toBe(50)
    expect(demandMonthlyBudgetUsd('-10')).toBe(50)
    expect(DEFAULT_DEMAND_MONTHLY_BUDGET_USD).toBe(50)
  })
})

describe('guard constants (D3/D8)', () => {
  it('holds the approved limits', () => {
    expect(DEMAND_SCORE_DAILY_LIMIT).toBe(10)
    expect(DEMAND_SUGGESTIONS_DAILY_LIMIT).toBe(5)
    expect(DEMAND_CACHE_TTL_DAYS).toBe(30)
  })
})
