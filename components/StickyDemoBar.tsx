'use client'

import { useEffect, useState } from 'react'
import { DEMO_PRESETS } from '@/lib/demo/presets'

interface StickyDemoBarProps {
  presetId: string
  onPresetChange: (id: string) => void
  onGenerate: () => void
  generating: boolean
  hasResult: boolean
}

/**
 * Slim sticky bottom bar (item E3): after scrolling past the hero, the demo
 * prompt stays one tap away. Quiet by design — no popups, no animation
 * beyond a simple show/hide on scroll.
 */
export default function StickyDemoBar({
  presetId,
  onPresetChange,
  onGenerate,
  generating,
  hasResult,
}: StickyDemoBarProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 640)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E5EA] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <span className="hidden text-sm font-semibold text-[#2D2D2D] sm:block">Free sample book</span>
        <select
          aria-label="Story starter"
          value={presetId}
          disabled={generating || hasResult}
          onChange={(e) => onPresetChange(e.target.value)}
          className="min-w-0 flex-1 rounded-full border border-[#E5E5EA] bg-white px-3 py-2 text-sm text-[#2D2D2D] sm:max-w-[220px] sm:flex-none"
        >
          {DEMO_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="apple-button px-5 py-2 text-sm disabled:opacity-60"
        >
          {hasResult ? 'See your sample ↓' : generating ? 'Generating…' : 'Generate free sample'}
        </button>
        <span className="hidden text-[13px] text-[#545558] md:block">Free · a few minutes</span>
      </div>
    </div>
  )
}
