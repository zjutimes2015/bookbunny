import { describe, it, expect } from 'vitest'
import { resolvePageCount } from './story'
import { pickLevel } from '@/lib/reading-levels'

describe('resolvePageCount', () => {
  const levelC = pickLevel('C')

  it('keeps the plan allowance when the caller passes a page count', () => {
    // Free plan caps at 8 pages, even though level C targets 14
    expect(resolvePageCount(8, levelC)).toBe(8)
    expect(resolvePageCount(20, levelC)).toBe(20)
    expect(resolvePageCount(24, levelC)).toBe(24)
  })

  it('falls back to the level target only when no page count is given', () => {
    expect(levelC).not.toBeNull()
    expect(resolvePageCount(undefined, levelC)).toBe(levelC!.pageCount)
  })

  it('falls back to 20 when neither a plan cap nor a level is available', () => {
    expect(resolvePageCount(undefined, null)).toBe(20)
  })
})
