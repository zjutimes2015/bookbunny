import { describe, it, expect } from 'vitest'
import { cleanKeywords, isBrandKeyword, LISTING_KEYWORD_LIMIT } from './keywords'

describe('cleanKeywords', () => {
  it('dedupes case-insensitively, first spelling wins', () => {
    expect(cleanKeywords(['Dinosaur Book', 'dinosaur  book', 'DINOSAUR BOOK'])).toEqual(['Dinosaur Book'])
  })
  it('drops empties, whitespace-only, and non-strings', () => {
    expect(cleanKeywords(['', '   ', null, 42, undefined, 'bedtime story'])).toEqual(['bedtime story'])
  })
  it('trims and collapses inner whitespace', () => {
    expect(cleanKeywords(['  dinosaur   bedtime   story  '])).toEqual(['dinosaur bedtime story'])
  })
  it('truncates to 7, preserving API order', () => {
    const nine = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8', 'k9']
    expect(cleanKeywords(nine)).toEqual(['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7'])
    expect(LISTING_KEYWORD_LIMIT).toBe(7)
  })
  it('never pads: fewer clean keywords stay fewer', () => {
    expect(cleanKeywords(['only one'])).toEqual(['only one'])
  })
  it('drops brand terms', () => {
    expect(cleanKeywords(['dinosaur book', 'disney dinosaur book', 'lego dinosaurs', 'bedtime story'])).toEqual([
      'dinosaur book',
      'bedtime story',
    ])
  })
  it('drops overlong junk', () => {
    expect(cleanKeywords(['x'.repeat(101), 'fine keyword'])).toEqual(['fine keyword'])
  })
})

describe('isBrandKeyword', () => {
  it('matches normalized brand terms inside a phrase', () => {
    expect(isBrandKeyword('Peppa Pig bedtime story')).toBe(true)
    expect(isBrandKeyword('Dr. Seuss style book')).toBe(true)
    expect(isBrandKeyword('Fisher-Price animals')).toBe(true)
  })
  it('does not flag ordinary phrases', () => {
    expect(isBrandKeyword('dinosaur bedtime story')).toBe(false)
    expect(isBrandKeyword('')).toBe(false)
  })
})
