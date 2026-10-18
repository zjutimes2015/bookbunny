'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import BunnyMascot from '@/components/BunnyMascot'
import { pagesToOutline, type PageOutline } from '@/lib/types/book'

interface QuizQuestion {
  q: string
  options: string[]
  answer: number
  skill: 'literal' | 'inference' | 'vocabulary'
}

interface BookDetail {
  id: string
  title: string
  pages: string[]
  outline?: PageOutline[] | null
  ageGroup: string
  theme: string
  level: string | null
  quiz: { questions: QuizQuestion[] } | null
  createdAt: string
}

const SKILL_LABEL: Record<string, string> = {
  literal: 'What happened',
  inference: 'Think deeper',
  vocabulary: 'Word power',
}

export default function BookDetailPage() {
  const params = useParams()
  const bookId = typeof params.id === 'string' ? params.id : ''
  const [book, setBook] = useState<BookDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!bookId) return
    fetch(`/api/books/${bookId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setBook(data)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [bookId])

  const handleAnswer = (qIdx: number, optIdx: number) =>
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }))

  const score = book?.quiz
    ? book.quiz.questions.reduce(
        (acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0),
        0
      )
    : 0

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bunny-bounce"><BunnyMascot size={64} /></div>
        <p className="text-[#8E8E93] mt-4">Loading your story...</p>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-400 mb-4">{error || 'Story not found'}</p>
        <Link href="/create" className="apple-button text-sm px-5 py-2.5">← Create a new story</Link>
      </div>
    )
  }

  // 优先使用结构化 outline；旧数据回退到 pages（string[]）
  const outline: PageOutline[] =
    book.outline && book.outline.length > 0
      ? book.outline
      : pagesToOutline(book.pages || [])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {book.level && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#FFF5EE] text-[#FF6B8A] text-xs font-semibold">
                GRL {book.level}
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F2F2F7] text-[#8E8E93] text-xs">
              {book.ageGroup} years
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#98D8C8]/20 text-[#4A9E8E] text-xs">
              {outline.length} pages
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">{book.title}</h1>
          <p className="text-sm text-[#8E8E93] mt-1">
            {book.level
              ? `Leveled reader — matched to GRL ${book.level} vocabulary and sentence length`
              : 'Custom story'}
          </p>
        </div>
        <Link href="/create" className="apple-button-secondary text-sm px-4 py-2.5 shrink-0">
          + New Story
        </Link>
      </div>

      {/* Story pages */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        {outline.map((page, i) => (
          <div key={i} className="apple-card p-4">
            <span className="text-[10px] text-[#C8A2E8] font-semibold">PAGE {i + 1}</span>
            <p className="text-sm text-[#2D2D2D] leading-relaxed mt-1.5">{page.pageText}</p>
          </div>
        ))}
      </div>

      {/* Quiz */}
      {book.quiz && book.quiz.questions.length > 0 && (
        <div className="apple-card p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#2D2D2D]">Reading Check</h2>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Answer the questions to practice comprehension
              </p>
            </div>
            <BunnyMascot size={40} />
          </div>

          <div className="space-y-6">
            {book.quiz.questions.map((q, qi) => (
              <div key={qi} className="border border-[#F2F2F7] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-[#FF6B8A] bg-[#FFF5EE] px-2 py-0.5 rounded-full">
                    {SKILL_LABEL[q.skill] || 'Question'}
                  </span>
                  <span className="text-xs text-[#8E8E93]">Q{qi + 1}</span>
                </div>
                <p className="text-sm font-medium text-[#2D2D2D] mb-3">{q.q}</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = answers[qi] === oi
                    const isCorrect = submitted && oi === q.answer
                    const isWrongPick = submitted && isSelected && oi !== q.answer
                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswer(qi, oi)}
                        className={`text-left text-sm px-3.5 py-2.5 rounded-xl border transition-all ${
                          isCorrect
                            ? 'border-[#98D8C8] bg-[#98D8C8]/10 text-[#2D2D2D]'
                            : isWrongPick
                            ? 'border-red-300 bg-red-50 text-[#2D2D2D]'
                            : isSelected
                            ? 'border-[#FF6B8A] bg-[#FFF5EE] text-[#2D2D2D]'
                            : 'border-[#E5E5EA] bg-white text-[#2D2D2D] hover:border-[#C8A2E8]'
                        }`}
                      >
                        <span className="font-semibold mr-1.5">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            {submitted ? (
              <p className="text-sm font-semibold text-[#4A9E8E]">
                {score} / {book.quiz.questions.length} correct
                {score === book.quiz.questions.length
                  ? ' — Great job! 🌟'
                  : score >= book.quiz.questions.length / 2
                  ? ' — Keep practicing!'
                  : ' — Try reading it again!'}
              </p>
            ) : (
              <p className="text-xs text-[#8E8E93]">
                Tap an answer for each question, then check.
              </p>
            )}
            <button
              className="apple-button text-sm px-5 py-2.5 disabled:opacity-50"
              disabled={Object.keys(answers).length < book.quiz.questions.length}
              onClick={() => setSubmitted(true)}
            >
              {submitted ? '✓ Checked' : 'Check Answers'}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-[#F2F2F7] flex justify-end print:hidden">
            <button
              className="apple-button-secondary text-xs px-4 py-2"
              onClick={() => window.print()}
            >
              🖨 Print worksheet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
