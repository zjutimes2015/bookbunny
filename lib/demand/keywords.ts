/**
 * Keyword cleanup for R2 listing suggestions (SPEC §4 / R2#3).
 *
 * Pipeline: drop non-strings/empties -> trim + collapse whitespace -> drop
 * overlong junk -> drop brand terms -> case-insensitive dedupe (first
 * spelling wins) -> truncate to 7. Order from the API (highest volume first)
 * is preserved; nothing is invented to pad the list.
 *
 * The brand list is a small hand-maintained set of obvious brand names
 * (SPEC appendix item 10). Trademark-depth checking is P2, out of scope.
 *
 * Client-safe pure functions: no secrets, no Node APIs.
 */

import { normalizeThemeKey } from './normalize'

/** Obvious brand names whose keywords must not be suggested. Normalized comparison. */
export const BRAND_TERMS: readonly string[] = [
  'disney',
  'pixar',
  'marvel',
  'lego',
  'peppa pig',
  'paw patrol',
  'bluey',
  'sesame street',
  'pokemon',
  'harry potter',
  'barbie',
  'hot wheels',
  'fisher price',
  'nickelodeon',
  'dr seuss',
]

const NORMALIZED_BRANDS = BRAND_TERMS.map((b) => normalizeThemeKey(b))

export const LISTING_KEYWORD_LIMIT = 7

/** Max characters kept per keyword; longer strings are API junk, not usable keywords. */
const MAX_KEYWORD_LENGTH = 100

export function isBrandKeyword(keyword: string): boolean {
  const key = normalizeThemeKey(keyword)
  if (!key) return false
  return NORMALIZED_BRANDS.some((brand) => brand !== '' && key.includes(brand))
}

export function cleanKeywords(
  raw: readonly unknown[],
  limit: number = LISTING_KEYWORD_LIMIT,
): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const cleaned = item.replace(/\s+/g, ' ').trim()
    if (!cleaned || cleaned.length > MAX_KEYWORD_LENGTH) continue
    if (isBrandKeyword(cleaned)) continue
    const key = normalizeThemeKey(cleaned)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(cleaned)
    if (out.length >= limit) break
  }
  return out
}
