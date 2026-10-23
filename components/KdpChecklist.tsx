'use client'

import { useMemo } from 'react'
import {
  MIN_PAGES,
  MIN_SPINE_TEXT_IN,
  spineWidthIn,
  padToKdpPageCount,
  type KdpPaper,
} from '@/lib/kdp/spec'

export interface KdpChecklistProps {
  trimKey: string
  pageCount: number
  paper?: KdpPaper
  title?: string
  isbns?: string
  hasCopyrightPage?: boolean
}

export interface KdpCheckItem {
  key: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  detail: string
  actionable?: string
}

export function computeKdpChecks({
  trimKey,
  pageCount,
  paper = 'white',
  title = '',
  isbns,
  hasCopyrightPage,
}: KdpChecklistProps): KdpCheckItem[] {
  const actualPages = pageCount
  const paddedPages = padToKdpPageCount(pageCount)
  const spineIn = spineWidthIn(paddedPages, paper)

  const spineTextable = spineIn >= MIN_SPINE_TEXT_IN
  const enoughPages = paddedPages >= MIN_PAGES
  const titleLooksSeo = title.trim().length >= 5

  return [
    {
      key: 'pages',
      label: `Interior pages ≥ ${MIN_PAGES} (KDP hardcover minimum)`,
      status: enoughPages ? 'pass' : 'fail',
      detail: enoughPages
        ? `${actualPages} source pages → padded to ${paddedPages} (even)`
        : `Only ${actualPages} pages. Add ${MIN_PAGES - actualPages} more to reach the hardcover minimum.`,
      actionable: enoughPages ? undefined : 'Add a back matter or acknowledgment spread.',
    },
    {
      key: 'spine',
      label: 'Spine wide enough for text',
      status: spineTextable ? 'pass' : 'warn',
      detail: spineTextable
        ? `Spine ${spineIn.toFixed(3)} in — safe to print a book title`
        : `Spine only ${spineIn.toFixed(3)} in — too narrow for legible spine text. KDP may reject or trim the lettering.`,
      actionable: spineTextable ? undefined : 'Increase page count by ~10 pages to widen the spine.',
    },
    {
      key: 'seo-title',
      label: 'Cover title is descriptive',
      status: titleLooksSeo ? 'pass' : 'warn',
      detail: titleLooksSeo
        ? `Title looks specific enough ("${title}") for Amazon search.`
        : 'Title is very short or empty — consider adding 2–5 words that describe the story.',
      actionable: titleLooksSeo ? undefined : "Include character name + theme, e.g. 'Luna and the Dragon's Garden'.",
    },
    {
      key: 'isbn',
      label: 'ISBN placeholder reserved',
      status: isbns ? 'pass' : 'warn',
      detail: isbns
        ? `ISBN present: ${isbns}`
        : 'No ISBN detected. KDP can assign a free KDP ISBN on upload, or you can register your own via Bowker.',
      actionable: isbns ? undefined : "KDP's free KDP ISBN is fine for most creators — no action needed unless you want your own.",
    },
    {
      key: 'copyright',
      label: 'Copyright page included',
      status: hasCopyrightPage ? 'pass' : 'warn',
      detail: hasCopyrightPage
        ? 'Copyright page detected.'
        : 'No dedicated copyright page. Amazon KDP does not strictly require one, but it is standard practice.',
      actionable: hasCopyrightPage ? undefined : 'Add a simple copyright page: © Year Name. All rights reserved.',
    },
  ]
}

export function KdpChecklist(props: KdpChecklistProps) {
  const items = useMemo(() => computeKdpChecks(props), [props])
  const summary = useMemo(() => {
    const pass = items.filter(i => i.status === 'pass').length
    const warn = items.filter(i => i.status === 'warn').length
    const fail = items.filter(i => i.status === 'fail').length
    return { pass, warn, fail }
  }, [items])

  const overall =
    summary.fail > 0 ? 'fail' :
    summary.warn > 0 ? 'warn' : 'pass'

  const overallLabel =
    overall === 'pass' ? 'All checks passed' :
    overall === 'warn' ? 'Ready to upload — 2 minor suggestions' :
    'Fix 1 blocking issue before upload'

  const overallColor =
    overall === 'pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    overall === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-red-50 text-red-700 border-red-200'

  const iconFor = (s: KdpCheckItem['status']) =>
    s === 'pass' ? '✓' : s === 'warn' ? '!' : '✗'

  const colorFor = (s: KdpCheckItem['status']) =>
    s === 'pass' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    s === 'warn' ? 'text-amber-600 bg-amber-50 border-amber-200' :
    'text-red-600 bg-red-50 border-red-200'

  return (
    <div className="apple-card border border-[#E5E5EA] bg-[#FAFAFA]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-[#2D2D2D]">KDP Upload Checklist</h4>
          <p className="text-xs text-[#8E8E93] mt-0.5">
            Auto-validates your book against Amazon KDP's known requirements
          </p>
        </div>
        <div className={`text-xs px-3 py-1.5 rounded-full border font-medium ${overallColor}`}>
          {overallLabel}
        </div>
      </div>

      <ul className="space-y-2.5">
        {items.map(item => (
          <li key={item.key} className="flex items-start gap-3">
            <span
              className={`flex-shrink-0 w-5 h-5 rounded-full border text-xs flex items-center justify-center font-bold ${colorFor(item.status)}`}
              aria-label={item.status}
            >
              {iconFor(item.status)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#2D2D2D] leading-snug">{item.label}</p>
              <p className="text-xs text-[#8E8E93] leading-relaxed mt-0.5">{item.detail}</p>
              {item.actionable && (
                <p className="text-xs text-[#E4574F] leading-relaxed mt-0.5 font-medium">
                  → {item.actionable}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-[#8E8E93] mt-4 pt-3 border-t border-[#E5E5EA]">
        Amazon KDP rejects books that break trim-size, page-count, or spine requirements.
        Our PDFs already handle bleed and gutter automatically — these checks catch the rest.
      </p>
    </div>
  )
}
