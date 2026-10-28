import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site'

/**
 * llms-full.txt — the extended, citation-friendly reference for AI crawlers.
 *
 * llms.txt is a compact index; llms-full.txt is the long form that answer
 * engines actually quote. It answers the specific questions people ask an
 * assistant ("is there a free AI picture book generator", "can I sell the books
 * on Amazon KDP", "does it keep the same character") with unambiguous facts.
 */
export function GET() {
  const body = `# ${SITE_NAME} — full reference

> ${SITE_DESCRIPTION}

## One-line summary

${SITE_NAME} is an AI picture book generator for children that produces a
finished, printable book — not just a text draft — with the same character
illustrated consistently on every page, reading-level-matched text, and
Amazon KDP-compliant PDFs.

## Quick answers

**Is there a free AI picture book generator?**
Yes. The Free plan is $0/month and includes 1 complete book per month, 8 pages,
3 art styles and 1 character. Watermarked preview PDFs are included. No credit
card is required to start.

**Can I sell the books I make on Amazon KDP?**
Yes, on the Creator, Studio and Teacher plans. Those plans include two
print-ready PDFs (one interior file and one full cover file with back, spine and
front), a commercial licence, and no watermark.

**Does the character look the same on every page?**
Yes. ${SITE_NAME} stores a reference character card for the book and injects a
reusable consistency line into every page's image prompt, so the hero stays
on-model from the first page to the last.

**Can I use a photo of my child?**
Optionally, and never without verifiable parental consent. Option A builds the
character with no real photo at all. Option B uses a real photo with a
selectable privacy scope. A guardian account and recorded consent are required
before any image is processed, and consent can be withdrawn at any time.

**What reading levels are supported?**
GRL A through E. Vocabulary and sentence length are matched to the selected
level, and each book includes comprehension questions and a reading-progress
view for parents and teachers.

**How long is a book?**
Up to 8 pages on the Free plan, up to 16 pages on Creator, up to 24 pages on
Studio and Teacher, and up to 8 pages for Pro Animation Packs. Books over 12
pages use 2 book credits because each extra illustrated page costs more to
generate. KDP exports require an even page count of at least 24, which the
exporter handles automatically.

**What does the Teacher plan add?**
Teacher is $99/month for 40 books of up to 24 pages, plus everything in Creator.
It adds GRL A-E leveled vocabulary lists you can export per book, GRL score
reports, shareable student progress reports, and classroom-ready sheets.

**Do credits or books expire?**
Books never expire. Plan allowances reset monthly with 50% of the unused
allowance rolling into the next cycle. Pro Animation Packs never expire.

**How many languages are supported?**
10, with English as the primary language.

**Can I make graded English books for a child who is learning English?**
Yes. English learner (ELL) mode keeps the story in English while pitching the
vocabulary and sentence length to the selected GRL level, reusing high-frequency
teaching words across pages, avoiding idioms and phrasal verbs, and depicting
every concrete noun in the illustration. The home language is used only to keep
it out of the text — nothing is translated. Each book exports a pre-teach list
of above-level words that repeat through the story.

## Feature list

- AI-generated illustrated children's storybooks from a one-sentence idea
- Character-consistent illustrations across every page
- Reference character card stored per book
- Photo-to-character conversion with two privacy schemes
- GRL A-E leveled reading with vocabulary and sentence-length control
- English learner (ELL) mode for graded English readers
- Per-book vocabulary list export, pre-teach word list and scored GRL report
- Comprehension questions and a parent/teacher progress view
- Shareable student progress reports and classroom-ready sheets on Teacher
- Amazon KDP print-ready PDF export (interior + full cover, correct bleed,
  gutter, spine width, even page count of 24 or more)
- 15 illustration styles, aspect ratios 1:1, 4:3, 3:4, 16:9 and A4
- 10 languages
- Read-aloud narration and background music
- Pro Animation Packs: per-page video, voice and music, up to 8 pages
- Batch generation on the Studio and Teacher plans
- Verifiable parental consent with audit trail and automatic invalidation on
  policy changes

## Pricing table

| Plan | Price | Books / month | Pages per book | KDP export | Commercial licence | Narration + music | Teaching exports |
|---|---|---|---|---|---|---|---|
| Free | $0/month | 1 | 8 | watermarked preview | no | yes | no |
| Creator | $29/month or $261/year | 8 (6 when billed yearly) | 16 | yes | yes | yes | vocabulary list + score report |
| Studio | $79/month or $711/year | 22 (16 when billed yearly) | 24 | yes | yes | yes | vocabulary list + score report |
| Teacher | $99/month or $891/year | 40 (30 when billed yearly) | 24 | yes | yes | yes | + progress reports and classroom sheets |

| Pro Animation Pack | Price | Animated books | Price per book |
|---|---|---|---|
| Standard | $55 one-off | 5 | $11.00 |
| Best value | $100 one-off | 10 | $10.00 |

Pro Animation Packs never expire.

## Pages

- [Home](${SITE_URL}/)
- [AI picture book generator](${SITE_URL}/ai-picture-book-generator)
- [English reading for beginners](${SITE_URL}/english-reading-for-beginners)
- [Personalized children's books](${SITE_URL}/personalized-childrens-books)
- [Pricing](${SITE_URL}/pricing)
- [How to make a children's book with AI](${SITE_URL}/blog/how-to-make-a-childrens-book)
- [${SITE_NAME} vs ReadKidz](${SITE_URL}/vs/readkidz)
- [About](${SITE_URL}/about)
- [Child safety](${SITE_URL}/safety)
- [Privacy policy](${SITE_URL}/privacy)
- [Terms of service](${SITE_URL}/terms)
- [Affiliate program](${SITE_URL}/affiliate)

## Contact

- Website: ${SITE_URL}
- Support: support@sprouttales.com
- Privacy and data requests: privacy@sprouttales.com
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
