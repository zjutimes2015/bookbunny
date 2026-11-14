'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeThemeKey } from '@/lib/demand/normalize'
import { isTrackedTheme } from '@/lib/demand/themes'

interface ScoreData {
  score: number
  tier: 'High' | 'Medium' | 'Low'
  competition: 'High' | 'Medium' | 'Low' | null
  fetchedAt: string
  stale?: boolean
}

type Result = { kind: 'shown'; data: ScoreData } | { kind: 'rate-limited' }

function formatDataDate(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const TIER_COLOR: Record<ScoreData['tier'], string> = {
  High: 'bg-[#3E9C7A]',
  Medium: 'bg-[#E8B54D]',
  Low: 'bg-[#C8A2E8]',
}

/**
 * R1 theme demand score, shown under the Story Theme input in /create setup.
 *
 * Visibility: logged-in users only, and only while the feature switch is on.
 * Tracked themes (from the landing pages) check automatically on a cache hit;
 * free text only checks when the reader presses "Check demand" — never on
 * keystrokes. No data / API failure / over budget: renders nothing, so the
 * creation flow is never blocked or filled with placeholder numbers.
 */
export default function DemandScore({
  theme,
  isLoggedIn,
  enabled,
}: {
  theme: string
  isLoggedIn: boolean
  enabled: boolean
}) {
  const key = normalizeThemeKey(theme)
  const tracked = isTrackedTheme(theme)
  const [result, setResult] = useState<Result | null>(null)
  const [checking, setChecking] = useState(false)
  const autoCheckedRef = useRef<string | null>(null)

  const runCheck = useCallback(async (themeText: string) => {
    setChecking(true)
    try {
      const res = await fetch('/api/demand/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeText }),
      })
      const json = (await res.json().catch(() => null)) as
        | { available?: boolean; reason?: string; score?: number; tier?: ScoreData['tier']; competition?: ScoreData['competition']; fetchedAt?: string; stale?: boolean }
        | null
      if (res.ok && json?.available && typeof json.score === 'number' && json.tier && json.fetchedAt) {
        setResult({
          kind: 'shown',
          data: {
            score: json.score,
            tier: json.tier,
            competition: json.competition ?? null,
            fetchedAt: json.fetchedAt,
            stale: json.stale,
          },
        })
      } else if (res.ok && json?.reason === 'rate_limited') {
        setResult({ kind: 'rate-limited' })
      } else {
        setResult(null)
      }
    } catch {
      setResult(null)
    } finally {
      setChecking(false)
    }
  }, [])

  // A new theme invalidates the previous reading.
  useEffect(() => {
    setResult(null)
    autoCheckedRef.current = null
  }, [key])

  // Tracked themes only: one automatic check per theme (cache hits are free).
  useEffect(() => {
    if (!enabled || !isLoggedIn || !key || !tracked) return
    if (autoCheckedRef.current === key) return
    autoCheckedRef.current = key
    void runCheck(theme)
  }, [enabled, isLoggedIn, key, tracked, theme, runCheck])

  if (!enabled || !isLoggedIn || !theme.trim()) return null

  if (result?.kind === 'rate-limited') {
    return (
      <p className="text-xs text-[#8E8E93] mt-2">
        You&apos;ve reached today&apos;s demand-check limit. Please try again tomorrow.
      </p>
    )
  }

  if (result?.kind === 'shown') {
    const { data } = result
    const date = formatDataDate(data.fetchedAt)
    return (
      <div className="mt-2 rounded-xl border border-[#E5E5EA] p-3.5 bg-white" aria-label="Theme demand">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-[#2D2D2D]">Theme demand</span>
          <span className="text-[11px] font-medium text-[#8E8E93]">Estimated</span>
        </div>
        <div className="mt-2.5 flex items-center gap-3">
          <div className="h-2 flex-1 rounded-full bg-[#F2F2F7] overflow-hidden">
            <div
              className={`h-full rounded-full ${TIER_COLOR[data.tier]}`}
              style={{ width: `${Math.min(100, Math.max(0, data.score))}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-[#2D2D2D]">{data.tier}</span>
          <span className="text-xs text-[#8E8E93]">{data.score} / 100</span>
        </div>
        {data.competition && (
          <p className="text-xs text-[#8E8E93] mt-2">
            Competition: <span className="font-medium text-[#2D2D2D]">{data.competition}</span>
          </p>
        )}
        <p className="text-[11px] text-[#8E8E93] mt-2 leading-relaxed">
          A relative score: 100 is the highest-demand theme on record. A higher score means more
          people searched for similar books. Based on third-party estimates
          {date ? ` · Data from ${date}` : ''}
          {data.stale ? ' · showing the last available reading' : ''}.
        </p>
      </div>
    )
  }

  // Free text: explicit button only, never input-triggered.
  if (!tracked) {
    return (
      <button
        type="button"
        disabled={checking}
        onClick={() => void runCheck(theme)}
        className="mt-2 text-xs font-medium text-[#FF6B8A] underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
      >
        {checking ? 'Checking…' : 'Check demand'}
      </button>
    )
  }

  return null
}
