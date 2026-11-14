import { describe, it, expect } from 'vitest'
import {
  BOOK_TYPE_OPTIONS,
  PET_BOOK_AGE_GROUP,
  isUngradedBookType,
  needsConsentGate,
  photoNeedsConsent,
} from './book'

describe('book type helpers', () => {
  it('offers child first (the default), then child-pet, then pet', () => {
    expect(BOOK_TYPE_OPTIONS.map(o => o.id)).toEqual(['child', 'child-pet', 'pet'])
    expect(BOOK_TYPE_OPTIONS[0].label).toBe('Child story')
  })

  it('uses adult as the pet-book age-group placeholder', () => {
    expect(PET_BOOK_AGE_GROUP).toBe('adult')
  })

  it('shows the parental consent gate for every book type that can include a child photo', () => {
    expect(needsConsentGate('child')).toBe(true)
    expect(needsConsentGate('child-pet')).toBe(true)
    expect(needsConsentGate('pet')).toBe(false)
  })

  it('requires consent for child photos only', () => {
    expect(photoNeedsConsent('child')).toBe(true)
    expect(photoNeedsConsent('pet')).toBe(false)
  })

  it('runs ungraded mode for pet-only books only', () => {
    expect(isUngradedBookType('pet')).toBe(true)
    expect(isUngradedBookType('child')).toBe(false)
    expect(isUngradedBookType('child-pet')).toBe(false)
  })
})
