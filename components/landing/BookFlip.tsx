'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Scene, SPREADS } from './book-art'

const FLIP_MS = 1100
const HOLD_MS = 4200

/**
 * Hero visual: an open book whose pages turn by themselves (CSS 3D flip),
 * cycling through three spreads of one generated book. Tap/click flips manually.
 * Pure CSS animation on mount of the flipping leaf; auto-advance pauses for
 * prefers-reduced-motion users.
 */
export default function BookFlip() {
  const [page, setPage] = useState(0)
  const [flipping, setFlipping] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const flip = useCallback(() => {
    setFlipping((f) => (f ? f : true))
  }, [])

  // Commit the page turn when the leaf animation finishes.
  useEffect(() => {
    if (!flipping) return
    const t = setTimeout(() => {
      setPage((p) => (p + 1) % SPREADS.length)
      setFlipping(false)
    }, FLIP_MS)
    return () => clearTimeout(t)
  }, [flipping])

  // Gentle auto-play; disabled for reduced-motion users.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timer.current = setInterval(flip, HOLD_MS)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [flip])

  const n = SPREADS.length
  const left = SPREADS[(page + n - 1) % n]
  const right = flipping ? SPREADS[(page + 1) % n] : SPREADS[page]

  return (
    <div>
      <div
        className="flipbook"
        onClick={flip}
        role="img"
        aria-label="An open picture book whose pages turn, showing three spreads of The Moon Bunny — the same bunny character on every page"
        title="Tap to turn the page"
      >
        {/* left page (previous spread) */}
        <div className="flipbook-half flipbook-left">
          <Scene variant={left.variant} className="h-full w-full" />
        </div>
        {/* right page (current spread; next spread revealed while flipping) */}
        <div className="flipbook-half flipbook-right">
          <Scene variant={right.variant} className="h-full w-full" />
        </div>
        {/* the turning leaf */}
        {flipping && (
          <div className="flipbook-leaf" aria-hidden="true">
            <div className="flipbook-face flipbook-face-front">
              <Scene variant={SPREADS[page].variant} className="h-full w-full" />
            </div>
            <div className="flipbook-face flipbook-face-back">
              <Scene variant={SPREADS[page].variant} className="h-full w-full" />
            </div>
          </div>
        )}
        <div className="flipbook-spine" aria-hidden="true" />
        <span className="absolute bottom-3 left-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#2D2D2D] backdrop-blur">
          The Moon Bunny · GRL B · 16 pages
        </span>
        <span className="absolute bottom-3 right-3 z-10 rounded-full bg-[#2D2D2D]/70 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
          Tap to flip →
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {SPREADS.map((s, i) => (
          <span
            key={s.variant}
            className={`h-1.5 rounded-full transition-all ${i === page ? 'w-5 bg-[#2D2D2D]' : 'w-1.5 bg-[#E5E5EA]'}`}
          />
        ))}
        <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-[#8E8E93]">
          Same bunny, every page — flip it
        </span>
      </div>
    </div>
  )
}
