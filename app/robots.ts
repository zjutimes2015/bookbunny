import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * AI answer/search engines decide whether we get cited inside generated answers (GEO).
 * Per the robots spec a named group REPLACES the `*` group instead of inheriting it,
 * so the rules below are repeated on purpose for every named crawler.
 */
const AI_ANSWER_ENGINES = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'OAI-AdsBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
]

/** Training / entity-recognition crawlers: allowed so models learn what SproutTales is. */
const AI_TRAINING_CRAWLERS = ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'Claude-Web', 'CCBot']

/** Product and private surfaces: never crawled. */
const PRIVATE_PATHS = ['/api/', '/admin', '/progress']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      ...AI_ANSWER_ENGINES.map((userAgent) => ({ userAgent, allow: '/', disallow: PRIVATE_PATHS })),
      ...AI_TRAINING_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow: PRIVATE_PATHS })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
