import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * robots.txt — crawler policy.
 *
 * Search engines (Googlebot, Bingbot) and AI crawlers (GPTBot, ClaudeBot,
 * PerplexityBot, Google-Extended, Applebot-Extended) are all welcome.
 * AI crawler access is what gets the site cited in ChatGPT / Perplexity /
 * Google AI Overviews answers.
 *
 * Only private, per-user surfaces are disallowed: the creation studio, the
 * reading-progress dashboard, and individual book pages (which are owned by
 * the account that generated them, not by the site).
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = ['/create', '/progress', '/book/', '/buddy', '/admin', '/affiliate/']

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider', 'cohere-ai', 'meta-externalagent'],
        allow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
