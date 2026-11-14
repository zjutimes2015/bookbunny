/**
 * Tracked themes: the slug -> theme text map shared by the `?theme=` prefill
 * (R6) and the demand seed keywords (R4 §4.1).
 *
 * The 14 slugs below were read off the `CREATE_HREF` constants of the 14
 * landing pages (7 original + 7 theme pages added 2026-11-14 from the theme
 * demand research round). Theme texts are derived from each page's own
 * title/copy; seed phrases are QUERY STRINGS (inputs to the third-party API),
 * not measurements — no volume, score, or ranking data is hardcoded anywhere
 * in this file. All numbers come only from API responses.
 *
 * NOTE: the 7 theme pages added 2026-11-14 have no verified BISAC triple in
 * `categories.ts` yet, so R2 category suggestions fall back to the "no
 * suggestions yet" line for them (see categories.ts doctrine: unverified
 * paths are never invented). Their `?theme=` prefill and seed keywords work
 * from this table alone.
 *
 * Client-safe: no secrets, no Node APIs.
 */

import { normalizeSlug, normalizeThemeKey } from './normalize'

export interface TrackedTheme {
  /** The `?theme=` slug carried by the landing page CTA. */
  slug: string
  /** Text prefilled into the Story Theme input. */
  themeText: string
  /** 3–5 seed keyword phrases sent to the volume endpoint for this theme. */
  seeds: string[]
}

export const TRACKED_THEMES: TrackedTheme[] = [
  {
    slug: 'dinosaur-bedtime-story',
    themeText: 'A dinosaur bedtime story',
    seeds: [
      'dinosaur bedtime story',
      'dinosaur book for kids',
      'dinosaur picture book',
      'dinosaur bedtime story for toddlers',
    ],
  },
  {
    slug: 'bedtime-story-starring-my-child',
    themeText: 'A bedtime story starring my child',
    seeds: [
      'personalized bedtime story',
      'bedtime story book for kids',
      'personalized childrens book',
      'bedtime stories for kids',
    ],
  },
  {
    slug: 'personalized-christmas-book',
    themeText: 'A personalized Christmas book',
    seeds: [
      'personalized christmas book',
      'christmas book for kids',
      'christmas picture book',
      'personalized christmas story',
    ],
  },
  {
    slug: 'personalized-birthday-book',
    themeText: 'A personalized birthday book',
    seeds: [
      'personalized birthday book',
      'birthday book for kids',
      'birthday picture book',
    ],
  },
  {
    slug: 'personalized-childrens-books',
    themeText: "A personalized children's book",
    seeds: [
      'personalized childrens books',
      'personalized story book for kids',
      'custom childrens book',
    ],
  },
  {
    slug: 'english-reading-for-beginners',
    themeText: 'An English reading story for beginners',
    seeds: [
      'english reading for beginners',
      'beginner reader books for kids',
      'early reader books',
    ],
  },
  {
    slug: 'ai-picture-book-generator',
    themeText: 'A picture book adventure',
    seeds: [
      'picture book for kids',
      'childrens picture book',
      'kids story book',
    ],
  },
  {
    slug: 'afraid-of-the-dark-bedtime-story',
    themeText: 'A bedtime story for a child afraid of the dark',
    seeds: [
      'bedtime story for child afraid of the dark',
      'book about fear of the dark for toddlers',
      'personalized book scared of the dark',
      'afraid of the dark book ages 3 5',
      'goodnight story for child afraid of the dark',
    ],
  },
  {
    slug: 'potty-training-book',
    themeText: 'A potty training story',
    seeds: [
      'potty training book for toddlers',
      'potty training book for boys',
      'personalized potty training book',
      'toddler potty book',
      'potty training story book for 2 year old',
    ],
  },
  {
    slug: 'new-baby-sibling-book',
    themeText: 'A new baby sibling story',
    seeds: [
      'new baby sibling book',
      'big brother book',
      'big sister book for toddlers',
      'personalized big sister book new baby',
      'book about becoming a big brother',
    ],
  },
  {
    slug: 'first-day-of-school-book',
    themeText: 'A first day of school story',
    seeds: [
      'first day of school book',
      'first day of school picture book',
      'school anxiety book for kids',
      'kindergarten preparation book',
      'personalized first day of school book',
    ],
  },
  {
    slug: 'grandparents-picture-book',
    themeText: 'A grandparents story',
    seeds: [
      'grandparent picture book',
      'grandma book for kids',
      'personalized book from grandma',
      'grandparents day book',
      'book about grandma and grandchild',
    ],
  },
  {
    slug: 'doctor-dentist-visit-book',
    themeText: 'A doctor and dentist visit story',
    seeds: [
      'going to the dentist book for toddlers',
      'first dentist visit book for kids',
      'personalized dentist book for kids',
      'going to the doctor book for toddlers',
      'book about visiting the doctor for preschoolers',
    ],
  },
  {
    slug: 'books-like-my-family',
    themeText: 'A bedtime story about a family like mine',
    seeds: [
      "diverse children's picture books",
      "children's books about different families",
      'inclusive bedtime story book',
      'personalized book diverse characters',
      'books where kids see themselves',
    ],
  },
]

const BY_SLUG = new Map(TRACKED_THEMES.map((t) => [t.slug, t]))

/**
 * R6: resolve a `?theme=` slug to the theme text to prefill.
 * Unknown / empty slugs return null (caller ignores them, blank form).
 */
export function themeForSlug(slug: string | null | undefined): string | null {
  if (!slug) return null
  const hit = BY_SLUG.get(slug.trim().toLowerCase())
  return hit ? hit.themeText : null
}

/**
 * Match free theme text against a tracked theme, so a prefilled theme (or a
 * user typing the same words) follows the cache-hit path. Matches on the
 * normalized theme text or on the slug words.
 */
export function trackedThemeForText(theme: string | null | undefined): TrackedTheme | null {
  const key = normalizeThemeKey(theme)
  if (!key) return null
  return (
    TRACKED_THEMES.find(
      (t) => normalizeThemeKey(t.themeText) === key || normalizeSlug(t.slug) === key,
    ) ?? null
  )
}

export function isTrackedTheme(theme: string | null | undefined): boolean {
  return trackedThemeForText(theme) !== null
}

/**
 * Seed keyword phrases for a theme (SPEC §4.1 `seed_keywords`).
 * Tracked themes use their curated phrases; any other free text is queried
 * as-is (single seed) — the server never invents phrases for free text.
 */
export function seedKeywordsForTheme(theme: string): string[] {
  const tracked = trackedThemeForText(theme)
  if (tracked) return [...tracked.seeds]
  const trimmed = theme.trim()
  return trimmed ? [trimmed] : []
}
