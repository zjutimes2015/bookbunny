'use client'

import { useEffect, useRef, useState } from 'react'

interface ListingData {
  categories: { path: string; bisac: string }[] | null
  keywords: string[]
  fetchedAt: string
  stale?: boolean
}

function formatDataDate(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the legacy path below.
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

/**
 * R2 KDP listing suggestions, under KdpChecklist in the /create illustrate
 * step. Creator+ only: when the caller is not eligible (or the switch is
 * off) this component does not exist in the tree at all — no disabled state.
 * Results load only on the explicit button press. Any failure hides the
 * whole block silently so the export flow is never blocked.
 */
export default function ListingSuggestions({
  theme,
  title,
  canKdp,
  enabled,
}: {
  theme: string
  title: string
  canKdp: boolean
  enabled: boolean
}) {
  const [result, setResult] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  if (!enabled || !canKdp || failed) return null

  const handleCopy = async (text: string, key: string) => {
    if (await copyText(text)) {
      setCopiedKey(key)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  const handleGet = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/demand/listing-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, title }),
      })
      const json = (await res.json().catch(() => null)) as
        | { available?: boolean; categories?: ListingData['categories']; keywords?: string[]; fetchedAt?: string; stale?: boolean }
        | null
      if (res.ok && json?.available && Array.isArray(json.keywords) && json.fetchedAt) {
        setResult({
          categories: json.categories ?? null,
          keywords: json.keywords,
          fetchedAt: json.fetchedAt,
          stale: json.stale,
        })
      } else {
        setFailed(true)
      }
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  if (!result) {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleGet()}
        className="apple-button-secondary text-sm px-4 py-2.5 disabled:opacity-50"
      >
        {loading ? 'Loading…' : 'Get listing suggestions'}
      </button>
    )
  }

  const date = formatDataDate(result.fetchedAt)
  const copyAllText = [
    result.categories ? `Categories:\n${result.categories.map((c) => c.path).join('\n')}` : null,
    `Keywords:\n${result.keywords.join('\n')}`,
  ]
    .filter(Boolean)
    .join('\n\n')

  return (
    <div className="rounded-xl border border-[#E5E5EA] p-4 bg-white" aria-label="Listing suggestions">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#2D2D2D]">Listing suggestions</h3>
        <span className="text-[11px] font-medium text-[#8E8E93]">Estimated</span>
      </div>

      <p className="text-xs font-medium text-[#2D2D2D] mt-3 mb-1.5">Categories</p>
      {result.categories ? (
        <ul className="space-y-1.5">
          {result.categories.map((c, i) => (
            <li key={c.bisac} className="flex items-center justify-between gap-2 text-sm text-[#2D2D2D]">
              <span>{c.path}</span>
              <button
                type="button"
                onClick={() => void handleCopy(c.path, `cat-${i}`)}
                className="shrink-0 text-xs font-medium text-[#FF6B8A] hover:opacity-80"
                aria-label={`Copy category ${c.path}`}
              >
                {copiedKey === `cat-${i}` ? 'Copied' : 'Copy'}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#8E8E93]">No category suggestions for this theme yet</p>
      )}

      <p className="text-xs font-medium text-[#2D2D2D] mt-4 mb-1.5">Keywords</p>
      <ul className="flex flex-wrap gap-1.5">
        {result.keywords.map((kw, i) => (
          <li key={`${kw}-${i}`}>
            <button
              type="button"
              onClick={() => void handleCopy(kw, `kw-${i}`)}
              className="text-xs rounded-full bg-[#F2F2F7] px-2.5 py-1.5 text-[#2D2D2D] hover:bg-[#E5E5EA]"
              aria-label={`Copy keyword ${kw}`}
            >
              {copiedKey === `kw-${i}` ? 'Copied ✓' : kw}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleCopy(copyAllText, 'all')}
          className="apple-button-secondary text-xs px-3 py-2"
        >
          {copiedKey === 'all' ? 'Copied ✓' : 'Copy all'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleGet()}
          className="text-xs font-medium text-[#8E8E93] underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <p className="text-[11px] text-[#8E8E93] mt-3 leading-relaxed">
        Suggestions based on estimated search demand. Verify categories and keywords in KDP before
        publishing.
        {date ? ` Data from ${date}` : ''}
        {result.stale ? ' · showing the last available reading' : ''}.
      </p>
    </div>
  )
}
