'use client'

import { useEffect, useState } from 'react'

interface BookInsights {
  opens: number
  finished: boolean
  pagesSeen: number
  replays: number
  quizAttempts: number
  quizAccuracy: number | null
  readAlongSamples: number
  readAlongAccuracy: number | null
  lastReadAt: string | null
}

function pct(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`
}

/** 单集学情面板：只给这集所属家庭看 */
export default function BookInsightsPanel({ bookId }: { bookId: string }) {
  const [data, setData] = useState<BookInsights | null>(null)

  useEffect(() => {
    if (!bookId) return
    let alive = true

    const load = () => {
      fetch(`/api/analytics/book?bookId=${bookId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (alive && d) setData(d)
        })
        .catch(() => {})
    }

    load()
    const timer = setInterval(load, 10000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [bookId])

  if (!data) return null

  const tiles = [
    { label: 'Finished', value: data.finished ? 'Yes' : 'Not yet' },
    { label: 'Pages seen', value: String(data.pagesSeen) },
    { label: 'Replays', value: String(data.replays) },
    { label: 'Quiz', value: pct(data.quizAccuracy) },
    { label: 'Read-aloud', value: pct(data.readAlongAccuracy) },
  ]

  return (
    <div className="apple-card p-6 md:p-8 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#2D2D2D]">This episode at a glance</h2>
          <p className="mt-0.5 text-xs text-[#8E8E93]">
            Read-aloud accuracy comes from speech practice you turn on — only the score is stored.
          </p>
        </div>
        <span className="rounded-full bg-[#F2F2F7] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[#8E8E93]">
          Private to your family
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl bg-[#FAFAFB] px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-[#8E8E93]">{t.label}</p>
            <p className="mt-1 text-lg font-bold text-[#2D2D2D]">{t.value}</p>
          </div>
        ))}
      </div>

      {data.opens === 0 && (
        <p className="mt-4 text-xs text-[#8E8E93]">
          No reading recorded yet. Open the read-aloud player to start collecting this episode&apos;s numbers.
        </p>
      )}
    </div>
  )
}
