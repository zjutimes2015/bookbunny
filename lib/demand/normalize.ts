/**
 * Theme normalization — the single key rule shared by the demand cache (R4),
 * the `?theme=` prefill map (R6), and the category map (R2).
 *
 * Rule (SPEC §4 / R4#4): lowercase, trim, collapse whitespace, strip
 * punctuation. Two spellings of the same theme ("Dinosaur Bedtime Story!",
 * "dinosaur  bedtime story") must hit the same cache row.
 *
 * Client-safe: no secrets, no Node APIs. Imported by both the browser
 * components and the server routes.
 */

/** Normalize free theme text into a cache/match key. Empty input -> ''. */
export function normalizeThemeKey(theme: string | null | undefined): string {
  if (!theme) return ''
  return theme
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Normalize a `?theme=` slug into the same key space ("dinosaur-bedtime-story" -> "dinosaur bedtime story"). */
export function normalizeSlug(slug: string | null | undefined): string {
  if (!slug) return ''
  return normalizeThemeKey(slug.replace(/[-_]+/g, ' '))
}
