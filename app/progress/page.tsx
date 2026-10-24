'use client'

import type { Metadata } from 'next'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import { useAuth } from '@/lib/auth-context'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'Reading Progress — Track Your Child\'s Leveled Book Journey | SproutTales'
const DESCRIPTION = 'Track your child\'s reading journey with SproutTales: view books read by level (GRL A–E), see comprehension progress, and explore their growing library.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/progress` },
  robots: 'noindex, follow',
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/progress`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

interface BookItem {
  id: string
  title: string
  level: string | null
  hasQuiz: boolean
  pageCount: number
  createdAt: string
}

interface ProgressData {
  booksRead: number
  levelDistribution: Record<string, number>
  nextLevel: string
  books: BookItem[]
}

const LEVEL_ORDER = ['A', 'B', 'C', 'D', 'E']
const LEVEL_COLORS: Record<string, string> = {
  A: 'bg-[#98D8C8]/20 text-[#4A9E8E]',
  B: 'bg-[#C8E8B0]/20 text-[#6B9E4A]',
  C: 'bg-[#FFF5EE] text-[#FF6B8A]',
  D: 'bg-[#C8A2E8]/20 text-[#7B52AB]',
  E: 'bg-[#FFDAB9]/30 text-[#CC7A3A]',
  none: 'bg-[#F2F2F7] text-[#8E8E93]',
}

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setError('Please sign in to see your reading progress.')
      setLoading(false)
      return
    }
    fetch('/api/reading-progress')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bunny-bounce"><BunnyMascot size={64} /></div>
        <p className="text-[#8E8E93] mt-4">Loading your reading journey...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <BunnyMascot size={64} />
        <p className="text-[#8E8E93] mt-4 mb-6">{error}</p>
        <Link href="/create" className="apple-button text-sm px-5 py-2.5">← Create a story</Link>
      </div>
    )
  }

  if (!data) return null

  const maxCount = Math.max(1, ...Object.values(data.levelDistribution))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Reading Journey</h1>
          <p className="text-sm text-[#8E8E93] mt-1">
            {user?.name ? `${user.name}'s` : 'Your'} leveled reading progress
          </p>
        </div>
        <Link href="/create" className="apple-button text-sm px-4 py-2.5">+ New Story</Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="apple-card p-5 text-center">
          <p className="text-3xl font-bold text-[#2D2D2D]">{data.booksRead}</p>
          <p className="text-xs text-[#8E8E93] mt-1">Books read</p>
        </div>
        <div className="apple-card p-5 text-center">
          <p className="text-3xl font-bold bunny-text-gradient">
            {data.nextLevel}
          </p>
          <p className="text-xs text-[#8E8E93] mt-1">Next level</p>
        </div>
        <div className="apple-card p-5 text-center">
          <p className="text-3xl font-bold text-[#2D2D2D]">
            {Object.keys(data.levelDistribution).filter(l => l !== 'none').length}
          </p>
          <p className="text-xs text-[#8E8E93] mt-1">Levels explored</p>
        </div>
      </div>

      {/* Level distribution */}
      <div className="apple-card p-6 mb-8">
        <h2 className="font-semibold text-[#2D2D2D] mb-4">Levels Read</h2>
        <div className="space-y-3">
          {LEVEL_ORDER.map(level => {
            const cnt = data.levelDistribution[level] || 0
            const pct = Math.round((cnt / maxCount) * 100)
            return (
              <div key={level} className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${LEVEL_COLORS[level]}`}>
                  {level}
                </span>
                <div className="flex-1 h-3 bg-[#F2F2F7] rounded-full overflow-hidden">
                  <div
                    className="h-full bunny-gradient rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-[#8E8E93] w-6 text-right">{cnt}</span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-[#8E8E93] mt-4">
          {data.nextLevel === 'E'
            ? '🌟 You reached the highest level! Keep reading to build fluency.'
            : `Next up: Level ${data.nextLevel} — books with longer sentences and richer vocabulary.`}
        </p>
      </div>

      {/* Book list */}
      <div className="apple-card p-6">
        <h2 className="font-semibold text-[#2D2D2D] mb-4">Your Library</h2>
        {data.books.length === 0 ? (
          <div className="text-center py-8">
            <BunnyMascot size={48} />
            <p className="text-sm text-[#8E8E93] mt-3 mb-4">No stories yet. Create your first leveled book!</p>
            <Link href="/create" className="apple-button text-sm px-5 py-2.5">Create a Book →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {data.books.map(book => (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#F2F2F7] hover:border-[#C8A2E8] hover:bg-[#FFF5EE]/40 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bunny-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">
                    📖
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#2D2D2D] truncate group-hover:text-[#FF6B8A] transition-colors">
                      {book.title}
                    </p>
                    <p className="text-[11px] text-[#8E8E93]">
                      {book.pageCount} pages
                      {book.hasQuiz ? ' · Reading check' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {book.level && (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${LEVEL_COLORS[book.level] || LEVEL_COLORS.none}`}>
                      {book.level}
                    </span>
                  )}
                  <span className="text-[#C8A2E8] text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
