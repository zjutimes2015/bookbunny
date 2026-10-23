import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site'

/**
 * Shared schema.org builders. Everything emitted here must match what a visitor
 * can read on the page itself — no ratings or counts we cannot point at.
 * (Google retired WebSite SearchAction sitelinks search boxes, so none is emitted.)
 */

export function organizationJsonLd() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/icon.svg`,
    description: SITE_DESCRIPTION,
  }
}

export function websiteJsonLd() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

export function rootGraphJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [organizationJsonLd(), websiteJsonLd()],
  }
}

/**
 * The product itself, with the four plans exactly as listed on /pricing.
 * Prices are the monthly USD amounts shown on the pricing page.
 */
export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: [
      { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Starter', price: '12', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Creator', price: '29', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Studio', price: '59', priceCurrency: 'USD' },
    ],
  }
}

export function faqPageJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}
