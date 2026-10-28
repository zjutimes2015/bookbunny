import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site'

/**
 * llms.txt — a compact, machine-readable summary for LLM crawlers (GEO).
 *
 * Generated per request so every absolute URL matches the deployed origin
 * (SITE_URL) instead of a hardcoded domain. The deeper version — with the
 * full feature comparison, pricing table and FAQ — lives at /llms-full.txt.
 */
export function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## What ${SITE_NAME} does

- Generates a complete illustrated children's picture book from one written idea
- Keeps the same character on every page via a reusable consistency line plus a
  stored reference character card
- Matches vocabulary and sentence length to a reading level (GRL A-E)
- English learner (ELL) mode: English-only stories pitched to a GRL level for
  children whose home language is not English
- Exports two print-ready PDFs for Amazon KDP: interior pages and a full cover
  (back + spine + front) with correct bleed, gutter, spine width and an even
  page count of at least 24
- Supports 10 languages; English is the primary language
- Optional read-aloud narration and background music

## Plans and pricing

- Free — $0/month, 1 book per month, 8 pages, 3 art styles, watermarked preview PDF
- Creator — $29/month (or $261/year), 8 books per month, up to 16 pages per book,
  KDP interior + cover PDFs, commercial licence, narration and music
- Studio — $79/month (or $711/year), 22 books per month, up to 24 pages per book,
  everything in Creator, batched generation, priority support
- Teacher — $99/month (or $891/year), 40 books per month, up to 24 pages per book,
  plus exportable GRL vocabulary lists, GRL score reports, shareable student
  progress reports and classroom-ready sheets
- Pro Animation Packs — one-off $55 for 5 animated books or $100 for 10.
  Never expire.

Books over 12 pages use 2 book credits because each extra illustrated page
costs more to generate. Unused allowance rolls over 50% into the next billing
cycle. Books never expire and stay in the library.

## Who it is for

- Parents who want a personalized picture book starring their child
- Teachers who need leveled reading material at GRL A-E
- Self-publishers who need Amazon KDP-ready files
- Gift-givers looking for a personalised birthday or holiday present
- Families where English is not the home language, looking for graded English
  readers that match a classroom reading level

## Privacy

- Photo use is optional. Option A builds a character with no real photo at all.
- Option B uses a real photo with a selectable privacy scope.
- A guardian account and verifiable parental consent are required before any
  photo is processed, and consent can be withdrawn at any time.
- Uploads are never used to train models.

## Pages

- [Home](${SITE_URL}/): product tour and feature overview.
- [AI picture book generator](${SITE_URL}/ai-picture-book-generator): how an idea
  becomes a finished, printable picture book.
- [English reading for beginners](${SITE_URL}/english-reading-for-beginners):
  graded English readers for children learning English as an additional language.
- [Personalized children's books](${SITE_URL}/personalized-childrens-books): gift
  scenarios — birthdays, holidays, baby showers.
- [Pricing](${SITE_URL}/pricing): plans and the full feature comparison matrix.
- [How to make a children's book with AI](${SITE_URL}/blog/how-to-make-a-childrens-book):
  step-by-step tutorial.
- [${SITE_NAME} vs ReadKidz](${SITE_URL}/vs/readkidz): head-to-head comparison of
  pricing, credits, reading levels and KDP export.
- [About](${SITE_URL}/about): the team and the mission.
- [Child safety](${SITE_URL}/safety): parental consent and data minimization.
- [Privacy policy](${SITE_URL}/privacy) and [Terms of service](${SITE_URL}/terms).

## Full reference

See [llms-full.txt](${SITE_URL}/llms-full.txt) for the detailed feature list,
pricing table, FAQ and contact information.
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
