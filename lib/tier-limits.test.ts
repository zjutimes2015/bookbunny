import { describe, it, expect } from 'vitest'
import { maxPagesFor, pageCostUnits } from './tier-limits'

describe('maxPagesFor', () => {
  it('caps guests and free accounts at 8 pages', () => {
    expect(maxPagesFor(undefined, false)).toBe(8)
    expect(maxPagesFor('free', false)).toBe(8)
  })

  it('allows 16 pages on Creator and 24 on Studio and Teacher', () => {
    expect(maxPagesFor('creator', true)).toBe(16)
    expect(maxPagesFor('studio', true)).toBe(24)
    expect(maxPagesFor('teacher', true)).toBe(24)
    expect(maxPagesFor('commercial', true)).toBe(16)
  })

  it('does not let an unknown tier buy extra pages', () => {
    // 未登记的档位（含降级/异常值）一律按最低档处理
    expect(maxPagesFor('starter', true)).toBe(8)
    expect(maxPagesFor('pro', true)).toBe(8)
  })

  it('keeps the cap tied to the tier even when isPaid is false', () => {
    // 付费档位已由 webhook 写入，isPaid 滞后时仍按档位口径给页数
    expect(maxPagesFor('creator', false)).toBe(16)
  })
})

describe('pageCostUnits', () => {
  it('charges one unit for books of 12 pages or fewer', () => {
    expect(pageCostUnits(8)).toBe(1)
    expect(pageCostUnits(12)).toBe(1)
  })

  it('charges two units for books over 12 pages', () => {
    // 16 / 24 页档的生图张数翻倍，成本同样翻倍
    expect(pageCostUnits(16)).toBe(2)
    expect(pageCostUnits(24)).toBe(2)
  })

  it('charges one unit when the page count is unknown', () => {
    expect(pageCostUnits(8)).toBe(1)
    expect(pageCostUnits(0)).toBe(1)
  })
})
