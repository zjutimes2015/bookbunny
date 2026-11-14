import { describe, it, expect } from 'vitest'
import { CATEGORY_MAP, categoriesForTheme } from './categories'

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

  it('covers the 6 hand-verified themes (new SEO themes pending BISAC checks)', () => {
    // The 7 theme pages added 2026-11-14 are deliberately NOT in
    // CATEGORY_MAP: no BISAC triple has been hand-verified for them, and
    // categories.ts forbids invented paths. They fall back to the "no
    // suggestions yet" line via categoriesForTheme() returning null.
    // This test pins the verified set exactly; extend it only with
    // verified triples, never to match TRACKED_THEMES blindly.
    const covered = Object.keys(CATEGORY_MAP).sort()
    expect(covered).toEqual(
      [
        'bedtime-story-starring-my-child',
        'dinosaur-bedtime-story',
        'english-reading-for-beginners',
        'personalized-birthday-book',
        'personalized-childrens-books',
        'personalized-christmas-book',
      ].sort(),
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

  it('returns null for the 7 new SEO themes until BISAC triples are verified', () => {
    expect(categoriesForTheme('A potty training story')).toBeNull()
    expect(categoriesForTheme('A bedtime story about a family like mine')).toBeNull()
    expect(categoriesForTheme('A first day of school story')).toBeNull()
  })

  it('returns null for untracked free text and empty input', () => {
    expect(categoriesForTheme('A magical forest adventure')).toBeNull()
    expect(categoriesForTheme('')).toBeNull()
    expect(categoriesForTheme(null)).toBeNull()
  })
})
