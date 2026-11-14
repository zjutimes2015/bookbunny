import { describe, it, expect } from 'vitest'
import {
  computeDemandScore,
  demandTier,
  volumeFromVolumes,
  competitionTier,
  DEMAND_SCORE_VERSION,
} from './score'

describe('demand-score-v1', () => {
  it('is versioned', () => {
    expect(DEMAND_SCORE_VERSION).toBe('demand-score-v1')
  })

  describe('volumeFromVolumes', () => {
    it('takes the max seed volume', () => {
      expect(volumeFromVolumes([10, 500, 42])).toBe(500)
    })
    it('returns null for an empty set', () => {
      expect(volumeFromVolumes([])).toBeNull()
    })
    it('returns null when every volume is missing', () => {
      expect(volumeFromVolumes([null, undefined])).toBeNull()
    })
    it('returns 0 when all volumes are zero', () => {
      expect(volumeFromVolumes([0, 0])).toBe(0)
    })
    it('ignores negative and non-finite values', () => {
      expect(volumeFromVolumes([-5, Number.NaN, 7])).toBe(7)
      expect(volumeFromVolumes([-5, Number.NaN])).toBeNull()
    })
  })

  describe('computeDemandScore', () => {
    it('scores the reference maximum as exactly 100', () => {
      expect(computeDemandScore(10000, 10000)).toBe(100)
    })
    it('returns null for zero volume (no score, never 0)', () => {
      expect(computeDemandScore(0, 10000)).toBeNull()
    })
    it('returns null for missing volume or missing maximum', () => {
      expect(computeDemandScore(null, 10000)).toBeNull()
      expect(computeDemandScore(100, null)).toBeNull()
      expect(computeDemandScore(100, 0)).toBeNull()
      expect(computeDemandScore(undefined, undefined)).toBeNull()
    })
    it('is log-normalized and monotonic', () => {
      const low = computeDemandScore(10, 10000)!
      const mid = computeDemandScore(100, 10000)!
      const high = computeDemandScore(1000, 10000)!
      expect(low).toBeLessThan(mid)
      expect(mid).toBeLessThan(high)
      expect(high).toBeLessThan(100)
      // Log scale: 10x volume adds a constant-ish step, not a 10x score.
      expect(high - mid).toBeLessThan(mid * 2)
    })
    it('clamps a volume above the reference maximum to 100', () => {
      expect(computeDemandScore(20000, 10000)).toBe(100)
    })
    it('stays within 0..100 for extreme inputs', () => {
      expect(computeDemandScore(1, 1e9)).toBeGreaterThanOrEqual(0)
      expect(computeDemandScore(1e9, 1e9)).toBe(100)
    })
  })

  describe('demandTier', () => {
    it('cuts at 67 / 34', () => {
      expect(demandTier(100)).toBe('High')
      expect(demandTier(67)).toBe('High')
      expect(demandTier(66)).toBe('Medium')
      expect(demandTier(34)).toBe('Medium')
      expect(demandTier(33)).toBe('Low')
      expect(demandTier(0)).toBe('Low')
    })
  })

  describe('competitionTier', () => {
    it('returns null without data (tag hidden)', () => {
      expect(competitionTier(null)).toBeNull()
      expect(competitionTier(undefined)).toBeNull()
      expect(competitionTier(Number.NaN)).toBeNull()
    })
    it('cuts a 0..1 mean at the same 67/34 points', () => {
      expect(competitionTier(0.9)).toBe('High')
      expect(competitionTier(0.67)).toBe('High')
      expect(competitionTier(0.5)).toBe('Medium')
      expect(competitionTier(0.34)).toBe('Medium')
      expect(competitionTier(0.1)).toBe('Low')
    })
  })
})
