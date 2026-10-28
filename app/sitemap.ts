import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * sitemap.xml — the crawl map for search engines and AI crawlers.
 *
 * Only publicly indexable pages are listed. Private surfaces (/create,
 * /progress, /book/*) are excluded here and disallowed in robots.ts.
 * World detail pages are intentionally omitted: every world is still in
 * `draft` status, so listing them would advertise unreleased content.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/ai-picture-book-generator', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/english-reading-for-beginners', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/personalized-childrens-books', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/blog/how-to-make-a-childrens-book', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/vs/readkidz', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/affiliate', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/safety', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/refunds', priority: 0.4, changeFrequency: 'yearly' },
  ]

  return staticPages.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}
