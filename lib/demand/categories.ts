/**
 * KDP category map (R2, SPEC §4.2): tracked theme -> exactly 3 categories.
 *
 * Every row was hand-checked against the public BISAC Juvenile Fiction (JUV)
 * list on 2026-11-14 (LibraryThing BISAC mirror, corroborated by publisher
 * catalogues carrying the same codes). KDP book setup selects BISAC
 * categories, so paths below are BISAC paths with their codes kept alongside
 * for audit. Paths that could not be verified are NOT in this table:
 * unmapped themes fall back to the "No category suggestions for this theme
 * yet" line instead of an invented category.
 *
 * Deliberately unmapped: `ai-picture-book-generator` — a tool page, not a
 * story theme, so no honest category triple exists for it.
 *
 * Client-safe: no secrets, no Node APIs.
 */

import { trackedThemeForText } from './themes'

export interface KdpCategory {
  /** Full BISAC path, as shown to the author and copied to the clipboard. */
  path: string
  /** BISAC code, kept for audit; not rendered in the UI. */
  bisac: string
}

type CategoryTriple = [KdpCategory, KdpCategory, KdpCategory]

export const CATEGORY_MAP: Record<string, CategoryTriple> = {
  'dinosaur-bedtime-story': [
    { path: 'Juvenile Fiction / Animals / Dinosaurs & Prehistoric Creatures', bisac: 'JUV002060' },
    { path: 'Juvenile Fiction / Bedtime & Dreams', bisac: 'JUV010000' },
    { path: 'Juvenile Fiction / Action & Adventure / General', bisac: 'JUV001000' },
  ],
  'bedtime-story-starring-my-child': [
    { path: 'Juvenile Fiction / Bedtime & Dreams', bisac: 'JUV010000' },
    { path: 'Juvenile Fiction / Family / General', bisac: 'JUV013000' },
    { path: 'Juvenile Fiction / Imagination & Play', bisac: 'JUV051000' },
  ],
  'personalized-christmas-book': [
    { path: 'Juvenile Fiction / Holidays & Celebrations / Christmas & Advent', bisac: 'JUV017010' },
    { path: 'Juvenile Fiction / Bedtime & Dreams', bisac: 'JUV010000' },
    { path: 'Juvenile Fiction / Family / General', bisac: 'JUV013000' },
  ],
  'personalized-birthday-book': [
    { path: 'Juvenile Fiction / Holidays & Celebrations / Birthdays', bisac: 'JUV017100' },
    { path: 'Juvenile Fiction / Family / General', bisac: 'JUV013000' },
    { path: 'Juvenile Fiction / Imagination & Play', bisac: 'JUV051000' },
  ],
  'personalized-childrens-books': [
    { path: 'Juvenile Fiction / Family / General', bisac: 'JUV013000' },
    { path: 'Juvenile Fiction / Bedtime & Dreams', bisac: 'JUV010000' },
    { path: 'Juvenile Fiction / Imagination & Play', bisac: 'JUV051000' },
  ],
  'english-reading-for-beginners': [
    { path: 'Juvenile Fiction / Readers / Beginner', bisac: 'JUV043000' },
    { path: 'Juvenile Fiction / Concepts / Words', bisac: 'JUV009080' },
    { path: 'Juvenile Fiction / Concepts / Alphabet', bisac: 'JUV009010' },
  ],
}

/**
 * Categories for a theme, matched through the tracked-theme table.
 * Returns null for unmapped themes (caller shows the fallback line).
 */
export function categoriesForTheme(theme: string | null | undefined): KdpCategory[] | null {
  const tracked = trackedThemeForText(theme)
  if (!tracked) return null
  const triple = CATEGORY_MAP[tracked.slug]
  return triple ? [...triple] : null
}
