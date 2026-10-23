import { SITE_URL } from '@/lib/site'

/**
 * llms.txt — a compact, machine-readable summary for LLM crawlers (GEO),
 * formatted per the llmstxt.org v2 proposal: H1, a blockquote summary that can
 * be quoted verbatim, one paragraph of key facts, then H2 link sections.
 * Generated per request so every absolute URL matches the deployed origin (SITE_URL)
 * instead of a hardcoded domain. Facts only — all numbers come from the live
 * pricing page and product behaviour.
 */
export function GET() {
  const body = `# SproutTales

> SproutTales is an AI picture book generator that turns one idea into an illustrated children's picture book: the hero can be your own child (from a photo, only with recorded and revocable parental consent), the text is matched to Guided Reading Levels GRL A–E, characters stay consistent on every page, and the finished book exports as print-ready PDFs that pass Amazon KDP checks.

SproutTales creates picture books of up to 24 illustrated pages in 15 art styles and 10 languages (EN, ZH, ZH-TW, ES, FR, DE, JA, KO, PT, IT). Reading levels run from GRL A to GRL E with matched vocabulary, comprehension questions, and a reading-progress view for parents and teachers. Character consistency is enforced on every page through a reusable consistency line plus a stored reference character card. A child photo is never required: one path builds the character from a description with no real photo at all, and the photo path runs only after a guardian account records parental consent, which can be withdrawn at any time. Pricing has four plans — Free ($0, one 8-page book with a watermarked preview), Starter ($12/month, 10 books), Creator ($29/month, 30 books, KDP interior + cover PDFs and a commercial license), and Studio ($59/month, 100 books) — plus an optional 5-book credit pack for $9. Books you create never expire, plan allowances reset monthly, and credit packs never expire. KDP exports are two separate PDFs — interior and full cover (back + spine + front) — with bleed, gutter, spine width and an even, padded page count of at least 24 handled automatically.

## Product

- [Pricing](${SITE_URL}/pricing): The four plans (Free $0, Starter $12/month, Creator $29/month, Studio $59/month), what each includes, the $9 five-book credit pack that never expires, and the full feature comparison matrix.
- [AI picture book generator](${SITE_URL}/ai-picture-book-generator): How an idea becomes a finished, printable picture book — story, leveled text (GRL A–E), consistent characters, and print-ready PDF export.
- [SproutTales vs ReadKidz](${SITE_URL}/vs/readkidz): Head-to-head comparison of pricing, expiring credits versus books that never expire, reading levels, photo privacy, and KDP export.
- [Home](${SITE_URL}/): Product overview, sample books, and how SproutTales works.

## Optional

- [Child safety](${SITE_URL}/safety): How verifiable parental consent works before any child photo is processed, COPPA-aligned data minimization, and audit logs.
- [Privacy policy](${SITE_URL}/privacy): How parent and child personal information is collected, used, retained, and deleted, and how to withdraw consent.
- [Terms of service](${SITE_URL}/terms): Eligibility for parents and guardians, content rules for photographs of children, AI-output disclaimers, ownership and licensing, and payments.
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
