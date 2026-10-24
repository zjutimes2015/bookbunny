import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * Search + AI answer engines read /sitemap.xml (referenced by app/robots.ts) to discover
 * the routes we want indexed and cited. Only the public marketing and product-entry
 * routes are listed — private surfaces such as /api, /admin and /progress stay uncrawled.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const monthly = () => ({ lastModified: now, changeFrequency: 'monthly' as const })
  const weekly = () => ({ lastModified: now, changeFrequency: 'weekly' as const })

  return [
    {
      url: `${SITE_URL}/`,
      ...weekly(),
      priority: 1,
    },
    {
      url: `${SITE_URL}/ai-picture-book-generator`,
      ...monthly(),
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/pricing`,
      ...monthly(),
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/vs/readkidz`,
      ...monthly(),
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/affiliate`,
      ...monthly(),
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/safety`,
      ...monthly(),
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacy`,
      ...monthly(),
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms`,
      ...monthly(),
      priority: 0.5,
    },
  ]
}
