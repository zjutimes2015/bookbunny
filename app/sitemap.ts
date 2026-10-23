import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * Only canonical, indexable marketing pages belong in the sitemap — app surfaces
 * (/create, /progress, /admin, /book) are behind sign-in and stay out.
 *
 * lastModified policy: a fixed per-page date recording when that page's content
 * last changed in a meaningful way. It is deliberately NOT the build time —
 * stamping every URL with "now" on each deploy tells crawlers the whole site
 * changed when it did not, and wastes crawl budget. Bump a page's date when its
 * copy or structure is edited.
 */
const LAST_CONTENT_CHANGE = {
  home: new Date('2026-10-19'),
  pricing: new Date('2026-10-19'),
  generator: new Date('2026-10-19'),
  vsReadkidz: new Date('2026-10-19'),
  safety: new Date('2026-10-19'),
} as const

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified: LAST_CONTENT_CHANGE.home },
    { url: `${SITE_URL}/pricing`, lastModified: LAST_CONTENT_CHANGE.pricing },
    { url: `${SITE_URL}/ai-picture-book-generator`, lastModified: LAST_CONTENT_CHANGE.generator },
    { url: `${SITE_URL}/vs/readkidz`, lastModified: LAST_CONTENT_CHANGE.vsReadkidz },
    { url: `${SITE_URL}/safety`, lastModified: LAST_CONTENT_CHANGE.safety },
  ]
}
