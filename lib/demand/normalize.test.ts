import { describe, it, expect } from 'vitest'
import { normalizeThemeKey, normalizeSlug } from './normalize'

describe('normalizeThemeKey', () => {
  it('lowercases, trims, collapses whitespace, strips punctuation', () => {
    expect(normalizeThemeKey('  Dinosaur   Bedtime Story! ')).toBe('dinosaur bedtime story')
    expect(normalizeThemeKey("A Child's Christmas")).toBe('a child s christmas')
    expect(normalizeThemeKey('dragons & unicorns?')).toBe('dragons unicorns')
  })
  it('maps equivalent spellings to the same key', () => {
    expect(normalizeThemeKey('Dinosaur Bedtime Story!')).toBe(normalizeThemeKey('dinosaur  bedtime story'))
  })
  it('returns empty for empty input', () => {
    expect(normalizeThemeKey('')).toBe('')
    expect(normalizeThemeKey(null)).toBe('')
    expect(normalizeThemeKey(undefined)).toBe('')
    expect(normalizeThemeKey('!!!')).toBe('')
  })
})

describe('normalizeSlug', () => {
  it('turns dashes/underscores into spaces', () => {
    expect(normalizeSlug('dinosaur-bedtime-story')).toBe('dinosaur bedtime story')
    expect(normalizeSlug('personalized_childrens-books')).toBe('personalized childrens books')
  })
  it('returns empty for empty input', () => {
    expect(normalizeSlug('')).toBe('')
    expect(normalizeSlug(null)).toBe('')
  })
})
