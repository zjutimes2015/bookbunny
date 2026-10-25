import { SITE_URL } from '@/lib/site'

/**
 * llms.txt — a compact, machine-readable summary for LLM crawlers (GEO).
 * Generated per request so every absolute URL matches the deployed origin (SITE_URL)
 * instead of a hardcoded domain.
 */
export function GET() {
  const body = `# SproutTales

> SproutTales turns one idea into an illustrated children's picture book: consistent
> characters across every page, reading-level-matched text, and a print-ready PDF that
> passes Amazon KDP's preprint checks.

## What makes it different

- No wasted credits. Every plan includes a monthly book allowance (Free 1, Creator 8,
  Studio 22 books), optional Pro Animation Packs never expire, and every book you
  create stays in your library.
- Character consistency is enforced on every page through a reusable consistency line
  plus a stored reference character card.
- Two photo privacy schemes: Option A builds the character with no real photo at all;
  Option B uses a real photo with a selectable privacy scope.
- Reading levels (GRL A-E) with matched vocabulary, comprehension questions and a
  reading-progress view for parents and teachers.
- Exports two separate KDP-compliant PDFs — interior and full cover (back + spine +
  front) — with correct bleed, gutter, spine width and an even page count of at least 24.
- Books can be generated in multiple languages; English is the primary language.

## Pages

- [Home](${SITE_URL}/): overview and product tour.
- [AI picture book generator](${SITE_URL}/ai-picture-book-generator): how an idea becomes
  a finished, printable picture book.
- [SproutTales vs ReadKidz](${SITE_URL}/vs/readkidz): head-to-head comparison of pricing,
  credits, reading levels and KDP export.
- [Pricing](${SITE_URL}/pricing): plans, what is included, and the full feature
  comparison matrix.
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
