'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import TurnstileWidget from '@/components/TurnstileWidget'
import {
  DEMO_AGE_GROUPS,
  DEMO_PRESETS,
  type DemoAgeGroup,
} from '@/lib/demo/presets'
import { getDemoDeviceId } from '@/lib/demo/device-id'
import type { PageOutline } from '@/lib/types/book'

export type DemoStatus = 'idle' | 'busy' | 'done'

interface DemoStory {
  title: string
  outline: PageOutline[]
  consistencyLine: string
}

interface DemoGeneratorProps {
  presetId: string
  ageGroup: DemoAgeGroup
  onPresetChange: (id: string) => void
  onAgeGroupChange: (age: DemoAgeGroup) => void
  /** Wrapper bumps this when the sticky bar's Generate button is tapped. */
  generateRequest: number
  onStatusChange?: (status: DemoStatus) => void
}

type Phase = 'idle' | 'writing' | 'illustrating' | 'done' | 'error'

const POLL_INTERVAL_MS = 1500

export default function DemoGenerator({
  presetId,
  ageGroup,
  onPresetChange,
  onAgeGroupChange,
  generateRequest,
  onStatusChange,
}: DemoGeneratorProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [story, setStory] = useState<DemoStory | null>(null)
  const [pageImages, setPageImages] = useState<Record<number, string>>({})
  const [illustrated, setIllustrated] = useState(0)
  const [illustrationFailed, setIllustrationFailed] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [turnstileError, setTurnstileError] = useState(false)
  const [turnstileRetryKey, setTurnstileRetryKey] = useState(0)

  const cardRef = useRef<HTMLDivElement>(null)
  const turnstileTokenRef = useRef<string | null>(null)
  const humanPassed = useRef(false)
  const busyRef = useRef(false)
  const storyRef = useRef<DemoStory | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    return () => {
      cancelledRef.current = true
    }
  }, [])

  useEffect(() => {
    onStatusChange?.(phase === 'writing' || phase === 'illustrating' ? 'busy' : phase === 'done' ? 'done' : 'idle')
  }, [phase, onStatusChange])

  // Same pass-exchange as /create: one Turnstile token becomes the 2h
  // bb_human cookie that both generation endpoints accept.
  const ensureHumanPass = useCallback(async (): Promise<boolean> => {
    if (humanPassed.current) return true
    const token = turnstileTokenRef.current
    if (!token) return false
    try {
      const res = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.success) {
        humanPassed.current = true
        return true
      }
    } catch {
      /* fall through to the failure branch below */
    }
    return false
  }, [])

  const pollIllustrations = useCallback(async (genId: string, total: number) => {
    await new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        if (cancelledRef.current) {
          clearInterval(interval)
          resolve()
          return
        }
        try {
          const r = await fetch(`/api/generate-pages?genId=${genId}`)
          const d = await r.json()
          setIllustrated(typeof d.completed === 'number' ? d.completed : 0)
          setPageImages((prev) => {
            const next = { ...prev }
            for (const p of d.pages || []) {
              if (p.imageB64) next[p.index] = `data:image/png;base64,${p.imageB64}`
              else if (p.imageUrl) next[p.index] = p.imageUrl
            }
            return next
          })
          if (d.status === 'done' || d.status === 'error') {
            clearInterval(interval)
            if (d.status === 'error') setIllustrationFailed(true)
            resolve()
          }
        } catch {
          // Transient poll failure: keep polling until the job resolves.
          void total
        }
      }, POLL_INTERVAL_MS)
    })
  }, [])

  const start = useCallback(async () => {
    if (busyRef.current || storyRef.current) return
    busyRef.current = true
    setError('')
    setIllustrationFailed(false)

    if (!(await ensureHumanPass())) {
      setTurnstileError(true)
      setError('Please complete the human check below, then try again.')
      setPhase('error')
      busyRef.current = false
      return
    }
    setTurnstileError(false)
    setPhase('writing')

    try {
      // Step 1: story outline from the demo endpoint (fixed character,
      // fixed preset theme — no personal data leaves the browser).
      const demoRes = await fetch('/api/demo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetId,
          ageGroup,
          deviceId: getDemoDeviceId(),
          turnstileToken: turnstileTokenRef.current || '',
        }),
      })
      const demoData = await demoRes.json()
      if (!demoRes.ok || demoData.error) {
        if (demoRes.status === 429) {
          throw new Error(
            "You've already made today's free sample. Come back tomorrow — or create your own book below.",
          )
        }
        if (demoRes.status === 403) {
          setTurnstileError(true)
          throw new Error('Human verification is required. Please complete the check below and try again.')
        }
        throw new Error(demoData.error || 'Demo generation failed.')
      }

      const nextStory: DemoStory = {
        title: demoData.title,
        outline: demoData.outline as PageOutline[],
        consistencyLine: demoData.consistencyLine as string,
      }
      storyRef.current = nextStory
      setStory(nextStory)
      setCurrentPage(0)
      setPhase('illustrating')

      // Step 2: illustrations via the EXISTING /api/generate-pages endpoint
      // (same DB job + polling as /create), with the demo consistency line.
      const genRes = await fetch('/api/generate-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outline: nextStory.outline,
          consistencyLine: nextStory.consistencyLine,
          aspect: '1:1',
          turnstileToken: turnstileTokenRef.current || '',
        }),
      })
      const genData = await genRes.json()
      if (!genRes.ok || genData.error || !genData.genId) {
        // The story text is still readable; illustrations just failed.
        setIllustrationFailed(true)
        setPhase('done')
        busyRef.current = false
        return
      }

      await pollIllustrations(genData.genId as string, nextStory.outline.length)
      if (!cancelledRef.current) setPhase('done')
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : 'Demo generation failed.')
        setPhase('error')
      }
    } finally {
      busyRef.current = false
    }
  }, [presetId, ageGroup, ensureHumanPass, pollIllustrations])

  const startRef = useRef(start)
  useEffect(() => {
    startRef.current = start
  }, [start])

  // Sticky-bar Generate: scroll to the card, then start (or just scroll if
  // the sample is already ready — the daily quota allows one per day).
  useEffect(() => {
    if (generateRequest === 0) return
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (!storyRef.current && !busyRef.current) {
      void startRef.current()
    }
    // Only the request counter triggers this; start is read via ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateRequest])

  const busy = phase === 'writing' || phase === 'illustrating'
  const totalPages = story?.outline.length ?? 0
  const currentOutline = story?.outline[currentPage]
  const currentImage = currentOutline ? pageImages[currentOutline.pageNumber] : undefined

  return (
    <div
      id="demo-generator"
      ref={cardRef}
      className="scroll-mt-24 rounded-3xl border border-[#E5E5EA] bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-[#2D2D2D]">Try it — make a free sample book</h2>
        <span className="text-[13px] font-medium text-[#545558]">No sign-up · No photo · No names</span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-[#545558]">
        Pick a story starter and an age. Every sample stars Pip, our demo
        character, and comes back as a complete 8-page book with a watermarked preview.
      </p>

      {/* Preset chips — fixed choices only, no free-text input anywhere. */}
      <fieldset disabled={busy || !!story} className="mt-5">
        <legend className="mb-2 text-sm font-medium text-[#2D2D2D]">Story starter</legend>
        <div className="flex flex-wrap gap-2">
          {DEMO_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPresetChange(p.id)}
              aria-pressed={presetId === p.id}
              className={
                presetId === p.id
                  ? 'rounded-full bg-[#FF6B8A] px-3.5 py-2 text-sm font-semibold text-white'
                  : 'rounded-full border border-[#E5E5EA] bg-white px-3.5 py-2 text-sm font-medium text-[#2D2D2D] transition-colors hover:border-[#FF6B8A]'
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="demo-age-group" className="mb-1.5 block text-sm font-medium text-[#2D2D2D]">
            Age range
          </label>
          <select
            id="demo-age-group"
            className="apple-input"
            value={ageGroup}
            disabled={busy || !!story}
            onChange={(e) => onAgeGroupChange(e.target.value as DemoAgeGroup)}
          >
            {DEMO_AGE_GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => void start()}
          disabled={busy || !!story}
          className="apple-button px-6 py-3 text-left disabled:opacity-60"
        >
          <span className="block text-base">Generate free sample</span>
          <span className="block text-[13px] font-normal opacity-80">
            Free · 1 a day · illustrations take a few minutes
          </span>
        </button>
      </div>

      <TurnstileWidget
        onVerify={(token) => {
          turnstileTokenRef.current = token
          setTurnstileError(false)
        }}
        onExpire={() => {
          turnstileTokenRef.current = null
        }}
        onError={() => setTurnstileError(true)}
        resetKey={turnstileRetryKey}
        className="mt-3"
      />
      {turnstileError && (
        <div className="mt-1 text-center">
          <p className="mb-2 text-xs text-red-400">
            Verification did not complete. Please tap “Verify again” and retry.
          </p>
          <button
            type="button"
            onClick={() => {
              setTurnstileError(false)
              turnstileTokenRef.current = null
              setTurnstileRetryKey((k) => k + 1)
            }}
            className="text-xs font-medium text-[#FF6B8A] underline underline-offset-2 hover:opacity-80"
          >
            Verify again
          </button>
        </div>
      )}

      {busy && (
        <p className="mt-4 text-sm text-[#545558]" role="status">
          {phase === 'writing'
            ? 'Writing your sample story…'
            : `Illustrating page ${Math.min(illustrated + 1, totalPages)} of ${totalPages}… illustrations take a few minutes — please keep this tab open.`}
        </p>
      )}

      {phase === 'error' && error && (
        <div className="mt-4 rounded-xl border border-[#E5E5EA] bg-[#FFFBF7] px-4 py-3" role="alert">
          <p className="text-sm leading-relaxed text-[#2D2D2D]">{error}</p>
          <p className="mt-2 text-sm">
            <Link href="/create" className="font-medium text-[#2D2D2D] underline underline-offset-4">
              Create your own book instead →
            </Link>
          </p>
        </div>
      )}

      {story && currentOutline && (
        <div className="mt-6 border-t border-[#E5E5EA] pt-5">
          <h3 className="text-base font-semibold text-[#2D2D2D]">{story.title}</h3>
          <p className="mt-1 text-[13px] text-[#545558]">
            Starring Pip, our demo character · Watermarked preview · Page {currentPage + 1} of {totalPages}
          </p>

          <div className="relative mt-4 aspect-square overflow-hidden rounded-2xl border border-[#E5E5EA] bg-[#FFFBF7]">
            {currentImage ? (
              <>
                <img
                  src={currentImage}
                  alt={`Sample book illustration, page ${currentOutline.pageNumber}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Watermarked preview, same wording as the free-plan export. */}
                <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold text-[#2D2D2D]">
                  SproutTales Preview
                </span>
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="rotate-[-12deg] text-lg font-bold tracking-wide text-white/60">
                    SproutTales Preview
                  </span>
                </span>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-[#545558]">
                {illustrationFailed
                  ? 'This illustration could not be generated. The story text below still reads fine.'
                  : 'Illustrating this page…'}
              </div>
            )}
          </div>

          <p className="mt-4 text-base leading-relaxed text-[#2D2D2D]">{currentOutline.pageText}</p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              className="rounded-full border border-[#E5E5EA] px-4 py-2 text-sm font-medium text-[#2D2D2D] disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="text-[13px] text-[#545558]">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-full border border-[#E5E5EA] px-4 py-2 text-sm font-medium text-[#2D2D2D] disabled:opacity-40"
            >
              Next →
            </button>
          </div>

          {phase === 'done' && (
            <div className="mt-5 rounded-2xl bg-[#FFF5EE] px-5 py-4 text-center">
              <p className="text-sm leading-relaxed text-[#2D2D2D]">
                Liked it? Your own book stars your child — same hero on every page.
              </p>
              <Link href="/create" className="apple-button mt-3 inline-block px-6 py-2.5 text-sm">
                Make your own book — free
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
