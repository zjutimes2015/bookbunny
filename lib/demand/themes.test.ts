import { describe, it, expect } from 'vitest'
import {
  TRACKED_THEMES,
  themeForSlug,
  trackedThemeForText,
  isTrackedTheme,
  seedKeywordsForTheme,
} from './themes'

const EXPECTED_SLUGS = [
  'ai-picture-book-generator',
  'bedtime-story-starring-my-child',
  'dinosaur-bedtime-story',
  'english-reading-for-beginners',
  'personalized-christmas-book',
  'personalized-birthday-book',
  'personalized-childrens-books',
  'afraid-of-the-dark-bedtime-story',
  'potty-training-book',
  'new-baby-sibling-book',
  'first-day-of-school-book',
  'grandparents-picture-book',
  'doctor-dentist-visit-book',
  'books-like-my-family',
]

describe('TRACKED_THEMES (R6 map)', () => {
  it('covers all 14 landing-page slugs', () => {
    expect(TRACKED_THEMES.map((t) => t.slug).sort()).toEqual([...EXPECTED_SLUGS].sort())
  })
  it('gives every theme a non-empty prefill text and 3–5 seed phrases', () => {
    for (const t of TRACKED_THEMES) {
      expect(t.themeText.trim().length).toBeGreaterThan(0)
      expect(t.seeds.length).toBeGreaterThanOrEqual(3)
      expect(t.seeds.length).toBeLessThanOrEqual(5)
      for (const seed of t.seeds) expect(seed.trim().length).toBeGreaterThan(0)
    }
  })
  it('holds no measurement data — seeds are query strings only', () => {
    // The map must not smuggle in volumes/scores: only slug/text/seeds keys.
    for (const t of TRACKED_THEMES) {
      expect(Object.keys(t).sort()).toEqual(['seeds', 'slug', 'themeText'])
    }
  })
})

describe('themeForSlug (R6 hit / miss / empty)', () => {
  it('hits: known slug returns its theme text', () => {
    expect(themeForSlug('dinosaur-bedtime-story')).toBe('A dinosaur bedtime story')
    expect(themeForSlug('personalized-christmas-book')).toBe('A personalized Christmas book')
    expect(themeForSlug('afraid-of-the-dark-bedtime-story')).toBe('A bedtime story for a child afraid of the dark')
    expect(themeForSlug('potty-training-book')).toBe('A potty training story')
    expect(themeForSlug('books-like-my-family')).toBe('A bedtime story about a family like mine')
  })
  it('is case- and whitespace-tolerant', () => {
    expect(themeForSlug('  Dinosaur-Bedtime-Story ')).toBe('A dinosaur bedtime story')
  })
  it('misses: unknown slug returns null (caller ignores it)', () => {
    expect(themeForSlug('space-pirates')).toBeNull()
    expect(themeForSlug('dinosaur')).toBeNull()
  })
  it('empty param returns null', () => {
    expect(themeForSlug('')).toBeNull()
    expect(themeForSlug(null)).toBeNull()
    expect(themeForSlug(undefined)).toBeNull()
  })
})

describe('trackedThemeForText', () => {
  it('matches the prefilled theme text (normalization-tolerant)', () => {
    expect(trackedThemeForText('A dinosaur bedtime story')?.slug).toBe('dinosaur-bedtime-story')
    expect(trackedThemeForText('a  DINOSAUR bedtime story!')?.slug).toBe('dinosaur-bedtime-story')
  })
  it('matches slug words typed as free text', () => {
    expect(trackedThemeForText('dinosaur bedtime story')?.slug).toBe('dinosaur-bedtime-story')
  })
  it('returns null for untracked free text', () => {
    expect(trackedThemeForText('A magical forest adventure')).toBeNull()
    expect(trackedThemeForText('')).toBeNull()
  })
  it('isTrackedTheme mirrors the match', () => {
    expect(isTrackedTheme('A personalized Christmas book')).toBe(true)
    expect(isTrackedTheme('A shy dragon learns to share')).toBe(false)
  })
})

describe('seedKeywordsForTheme', () => {
  it('returns curated seeds for tracked themes', () => {
    expect(seedKeywordsForTheme('A dinosaur bedtime story')).toContain('dinosaur bedtime story')
  })
  it('queries free text as-is, inventing no extra phrases', () => {
    expect(seedKeywordsForTheme('A magical forest adventure')).toEqual(['A magical forest adventure'])
  })
  it('returns no seeds for blank input', () => {
    expect(seedKeywordsForTheme('  ')).toEqual([])
  })
})
