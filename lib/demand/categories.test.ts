import { describe, it, expect } from 'vitest'
import { CATEGORY_MAP, categoriesForTheme } from './categories'
import { TRACKED_THEMES } from './themes'

describe('CATEGORY_MAP (R2, hand-checked BISAC rows)', () => {
  it('maps exactly 3 categories per covered theme', () => {
    for (const [slug, triple] of Object.entries(CATEGORY_MAP)) {
      expect(triple, slug).toHaveLength(3)
      for (const c of triple) {
        expect(c.path.startsWith('Juvenile Fiction / ')).toBe(true)
        expect(c.bisac).toMatch(/^JUV\d{6}$/)
      }
    }
  })

  it('covers 6 of the 7 tracked themes', () => {
    const covered = Object.keys(CATEGORY_MAP).sort()
    expect(covered).toEqual(
      TRACKED_THEMES.map((t) => t.slug)
        .filter((s) => s !== 'ai-picture-book-generator')
        .sort(),
    )
  })

  it('has no duplicate paths within a theme', () => {
    for (const triple of Object.values(CATEGORY_MAP)) {
      const paths = triple.map((c) => c.path)
      expect(new Set(paths).size).toBe(3)
    }
  })
})

describe('categoriesForTheme', () => {
  it('returns the triple for a tracked theme, by text or slug words', () => {
    const byText = categoriesForTheme('A dinosaur bedtime story')!
    expect(byText).toHaveLength(3)
    expect(byText[0].path).toBe('Juvenile Fiction / Animals / Dinosaurs & Prehistoric Creatures')
    expect(byText[0].bisac).toBe('JUV002060')
    expect(categoriesForTheme('dinosaur bedtime story')).toEqual(byText)
  })

  it('returns null for the unmapped tool page (fallback line, never invented)', () => {
    expect(categoriesForTheme('A picture book adventure')).toBeNull()
    expect(categoriesForTheme('ai picture book generator')).toBeNull()
  })

  it('returns null for untracked free text and empty input', () => {
    expect(categoriesForTheme('A magical forest adventure')).toBeNull()
    expect(categoriesForTheme('')).toBeNull()
    expect(categoriesForTheme(null)).toBeNull()
  })
})
