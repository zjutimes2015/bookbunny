import { describe, it, expect } from 'vitest'
import { maxPagesFor } from './tier-limits'

describe('maxPagesFor', () => {
  it('caps guests and free accounts at 8 pages', () => {
    expect(maxPagesFor(undefined, false)).toBe(8)
    expect(maxPagesFor('free', false)).toBe(8)
  })

  it('allows 12 pages on every paid tier', () => {
    expect(maxPagesFor('creator', true)).toBe(12)
    expect(maxPagesFor('studio', true)).toBe(12)
    expect(maxPagesFor('commercial', true)).toBe(12)
  })

  it('does not let an unknown tier buy extra pages', () => {
    // 未登记的档位（含降级/异常值）一律按最低档处理
    expect(maxPagesFor('starter', true)).toBe(8)
    expect(maxPagesFor('pro', true)).toBe(8)
  })

  it('keeps the cap tied to the tier even when isPaid is false', () => {
    // 付费档位已由 webhook 写入，isPaid 滞后时仍按档位口径给页数
    expect(maxPagesFor('creator', false)).toBe(12)
  })
})
