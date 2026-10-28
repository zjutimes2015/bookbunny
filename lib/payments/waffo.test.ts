import { describe, it, expect, afterEach } from 'vitest'
import {
  WAFFO_PLANS,
  isPlanPurchasable,
  planTier,
  planGrant,
  planCycle,
  getPlan,
} from './waffo'

/** 改写某个 productId 环境变量，测完还原 */
function withProductId(key: string, value: string | undefined, fn: () => void) {
  const envKey = `WAFFO_${key.toUpperCase()}_PRODUCT_ID`
  const original = process.env[envKey]
  if (value === undefined) delete process.env[envKey]
  else process.env[envKey] = value
  try {
    fn()
  } finally {
    if (original === undefined) delete process.env[envKey]
    else process.env[envKey] = original
  }
}

describe('WAFFO_PLANS', () => {
  it('covers every tier including teacher', () => {
    const tiers = Object.values(WAFFO_PLANS).map((p) => p.tier)
    expect(tiers).toContain('creator')
    expect(tiers).toContain('studio')
    expect(tiers).toContain('teacher')
    expect(tiers).toContain('pro-anim')
  })

  it('prices the teacher tier at 99/month and 891/year', () => {
    expect(WAFFO_PLANS.teacher_monthly.price).toBe(99)
    expect(WAFFO_PLANS.teacher_annual.price).toBe(891)
  })

  it('gives every paid tier a positive price', () => {
    for (const plan of Object.values(WAFFO_PLANS)) {
      expect(plan.price).toBeGreaterThan(0)
    }
  })
})

describe('planTier', () => {
  it('maps a plan key to its tier', () => {
    expect(planTier('teacher_monthly')).toBe('teacher')
    expect(planTier('creator_annual')).toBe('creator')
  })

  it('returns null for an unknown plan', () => {
    expect(planTier('nope')).toBeNull()
  })
})

describe('planCycle', () => {
  it('reads the billing cycle off the plan', () => {
    expect(planCycle('creator_monthly')).toBe('month')
    expect(planCycle('creator_annual')).toBe('year')
  })
})

describe('planGrant', () => {
  it('returns the grant for one-time packs', () => {
    expect(planGrant('pro_anim_5')).toBe(5)
    expect(planGrant('pro_anim_10')).toBe(10)
  })

  it('returns zero for subscriptions', () => {
    expect(planGrant('teacher_monthly')).toBe(0)
  })
})

describe('getPlan', () => {
  it('returns null for an unknown plan', () => {
    expect(getPlan('nope')).toBeNull()
  })
})

describe('isPlanPurchasable', () => {
  afterEach(() => {
    delete process.env.WAFFO_CREATOR_MONTHLY_PRODUCT_ID
    delete process.env.WAFFO_TEACHER_MONTHLY_PRODUCT_ID
  })

  it('is false when the product id is missing', () => {
    withProductId('creator_monthly', undefined, () => {
      expect(isPlanPurchasable('creator_monthly')).toBe(false)
    })
  })

  it('is true once the product id is configured', () => {
    withProductId('creator_monthly', 'prod_123', () => {
      expect(isPlanPurchasable('creator_monthly')).toBe(true)
    })
  })

  it('gates the teacher tier on its own product id', () => {
    withProductId('teacher_monthly', undefined, () => {
      expect(isPlanPurchasable('teacher_monthly')).toBe(false)
    })
    withProductId('teacher_monthly', 'prod_teacher', () => {
      expect(isPlanPurchasable('teacher_monthly')).toBe(true)
    })
  })

  it('is false for an unknown plan', () => {
    expect(isPlanPurchasable('nope')).toBe(false)
  })
})
