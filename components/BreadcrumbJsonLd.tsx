/**
 * BreadcrumbList structured data (SEO/GEO).
 *
 * Gives Google and answer engines the page's place in the site hierarchy,
 * which is what surfaces breadcrumb trails in search results and helps AI
 * crawlers map parent/child topic relationships. Rendered next to the
 * page's other JSON-LD scripts; one BreadcrumbList per page.
 */
export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
