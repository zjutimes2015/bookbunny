import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site'

/** Default image used for Open Graph / Twitter when a page has no dedicated image. */
export const DEFAULT_OG_IMAGE = '/og-image.png'
export const DEFAULT_TWITTER_IMAGE = '/twitter-image.png'

/**
 * Shared page-metadata factory.
 *
 * • title  — must be ≤ 60 chars
 * • description — must be ≤ 155 chars and end with a soft CTA where applicable
 * • og / twitter — all public pages share one default image until dedicated images are generated
 * • canonical — absolute URL based on the route passed in
 * • keywords — topic-relevant phrases that help AI-answer engines surface us
 */
export function makePageMetadata(
  overrides: {
    title?: string
    description?: string
    keywords?: string[]
    /** Override the og/twitter image (absolute URL). Defaults to DEFAULT_OG_IMAGE. */
    ogImage?: string
    twitterImage?: string
    /** Whether this page should be indexable. Defaults to true. */
    noIndex?: boolean
    /** The route path for canonical/OG URL (e.g. '/pricing'). */
    canonical?: string
    /** Extra open-graph fields. */
    extraOG?: Record<string, string>
  },
): Metadata {
  const title = overrides.title || SITE_NAME
  const description = overrides.description || SITE_DESCRIPTION

  return {
    title,
    description,
    keywords: overrides.keywords ?? [
      'AI children book generator',
      'AI picture book',
      'children story maker',
      'KDP book creator',
      'Amazon KDP children book',
      'leveled reader AI',
      'GRL A-E book',
      'consistent character illustration',
      'photo to character AI',
      'parental consent children app',
      'SproutTales',
    ],
    alternates: {
      canonical: `${SITE_URL}${overrides.canonical ?? ''}`,
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url: `${SITE_URL}${overrides.canonical ?? ''}`,
      images: [
        {
          url: overrides.ogImage ?? DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${title}`,
        },
      ],
      ...overrides.extraOG,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@sprouttales',
      creator: '@sprouttales',
      title,
      description,
      images: [overrides.twitterImage ?? DEFAULT_TWITTER_IMAGE],
    },
    robots: overrides.noIndex
      ? { index: false, follow: false }
      : undefined,
  }
}
