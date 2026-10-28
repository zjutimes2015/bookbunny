'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import BunnyMascot from '@/components/BunnyMascot'
import ReadAloudPlayer from '@/components/ReadAloudPlayer'
import ReadAlongPlayer from '@/components/ReadAlongPlayer'
import TurnstileWidget from '@/components/TurnstileWidget'
import BookInsightsPanel from '@/components/BookInsights'
import TeachingExports from '@/components/TeachingExports'
import { pagesToOutline, type PageOutline } from '@/lib/types/book'
import { REMIX_KINDS, type RemixKind } from '@/lib/remix'
import { sendReadingEvents } from '@/lib/reading-events-client'
import { useAuth } from '@/lib/auth-context'

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
  aspect?: string | null
  quiz: { questions: QuizQuestion[] } | null
  pageImageUrls?: string[] | null
  createdAt: string
  /** 只有本书所属家庭、且已保存主角档案时才为 true */
  canContinue?: boolean
  episodeNumber?: number
  protagonistName?: string | null
  /** 只有本书所属家庭能看学情与续集 */
  isOwner?: boolean
}

interface ProJob {
  status: 'pending' | 'running' | 'done' | 'error'
  total: number
  completed: number
  pages: Array<{
    index: number
    clip: 'pending' | 'generating' | 'done' | 'error'
    audio: 'pending' | 'generating' | 'done' | 'error'
    captions: 'pending' | 'generating' | 'done' | 'error'
    print: 'pending' | 'generating' | 'done' | 'error'
    videoUrl?: string
    audioUrl?: string
    captionUrl?: string
    printUrl?: string
  }>
  musicUrl?: string
  coverUrl?: string
  finalVideoUrl?: string
}

const SKILL_LABEL: Record<string, string> = {
  literal: 'What happened',
  inference: 'Think deeper',
  vocabulary: 'Word power',
}

const PRO_COST = 3 // 每本 Pro 动画扣 3 credits

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = typeof params.id === 'string' ? params.id : ''
  const { user } = useAuth()
  const [book, setBook] = useState<BookDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [activePage, setActivePage] = useState<number | null>(null)

  // 续集（remix）：同一主角、同一世界，再演一集
  const [remixKind, setRemixKind] = useState<RemixKind | null>(null)
  const [remixToken, setRemixToken] = useState<string | null>(null)
  const [remixStep, setRemixStep] = useState<'idle' | 'writing' | 'illustrating'>('idle')
  const [remixError, setRemixError] = useState<string | null>(null)

  // 阅读数据回流：同一事件的去重标记，避免重复计数
  const openedRef = useRef(false)
  const completedRef = useRef(false)
  const quizSentRef = useRef(false)
  const lastPageSentRef = useRef<number | null>(null)
  const playCountRef = useRef(0)

  // Pro 动画状态
  const [proJobId, setProJobId] = useState<string | null>(null)
  const [proJob, setProJob] = useState<ProJob | null>(null)
  const [proGenerating, setProGenerating] = useState(false)
  const [proError, setProError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!bookId) return
    fetch(`/api/books/${bookId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setBook(data)
        // 检查是否已有 Pro 任务
        if (data.proJobId) setProJobId(data.proJobId)
        // 打开这一集（只记一次；非本人不记）
        if (data.isOwner && !openedRef.current) {
          openedRef.current = true
          sendReadingEvents(bookId, [{ type: 'book_open' }])
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [bookId])

  // 轮询 Pro 任务状态
  useEffect(() => {
    if (!proJobId) return
    const poll = () => {
      fetch(`/api/animate-pro?genId=${proJobId}`)
        .then(r => r.json())
        .then(data => {
          setProJob(data)
          if (data.status === 'done' || data.status === 'error') {
            if (pollRef.current) clearInterval(pollRef.current)
            pollRef.current = null
          }
        })
        .catch(() => {})
    }
    poll()
    pollRef.current = setInterval(poll, 3000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [proJobId])

  // 朗读推进到新页时，把对应卡片滚动到视野内
  useEffect(() => {
    if (activePage === null) return
    const el = document.getElementById(`story-page-${activePage}`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activePage])

  const handleAnswer = (qIdx: number, optIdx: number) =>
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }))

  const score = book?.quiz
    ? book.quiz.questions.reduce(
        (acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0),
        0,
      )
    : 0

  // Pro 动画为独立商品：消耗 Pro credits，余额不足则引导购买
  const proCredits = user?.proCredits ?? 0
  const canStartPro = !!user && proCredits >= PRO_COST

  // 启动 Pro 动画
  const handleStartPro = async () => {
    if (!book) return
    if (!user) {
      window.location.href = `/api/auth/google?next=/book/${book.id}`
      return
    }
    if (!canStartPro) {
      window.location.href = '/pricing#pro-animation'
      return
    }
    if (proJobId) return // 已有任务
    setProGenerating(true)
    setProError(null)
    try {
      const res = await fetch('/api/animate-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          pages: book.outline || book.pages.map((p, i) => ({ pageNumber: i + 1, pageText: p })),
          pageImages: book.pageImageUrls || [],
          language: 'en-US',
        }),
      })
      const data = await res.json()
      if (res.status === 402) {
        window.location.href = '/pricing#pro-animation'
        return
      }
      if (data.error) throw new Error(data.error)
      setProJobId(data.genId)
    } catch (err) {
      setProError(err instanceof Error ? err.message : 'Failed to start')
      setProGenerating(false)
    }
  }

  // 下载 Pro 视频
  const handleDownloadPro = () => {
    if (!proJob?.finalVideoUrl) return
    const a = document.createElement('a')
    a.href = proJob.finalVideoUrl
    a.download = `${book?.title || 'book'}-animated-pro.mp4`
    a.click()
  }

  /**
   * 家庭内改写：同一主角 + 同一世界，生成下一集。
   * 主角档案只在服务端按账户取用；前端只拿到「这一集」的文字与配图任务。
   */
  const handleRemix = async () => {
    if (!book || !remixKind) return
    setRemixError(null)
    setRemixStep('writing')
    try {
      const res = await fetch('/api/remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, kind: remixKind, turnstileToken: remixToken || '' }),
      })
      const data = await res.json()

      if (res.status === 401) {
        window.location.href = `/api/auth/google?next=/book/${book.id}`
        return
      }
      if (res.status === 402) {
        window.location.href = '/pricing'
        return
      }
      if (!res.ok || data.error) {
        throw new Error(
          data.code === 'bot_check_required'
            ? 'Verification expired. Please complete the check and try again.'
            : data.error || 'Failed to write the next episode',
        )
      }

      setRemixStep('illustrating')

      // 这一集立刻配图：复用同一个主角参考图与同一画风
      try {
        const genRes = await fetch('/api/generate-pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outline: data.outline,
            bookId: data.bookId,
            characterImageUrl: data.protagonistImageUrl || null,
            consistencyLine: data.consistencyLine || null,
            style: data.style || null,
            aspect: data.aspect || book.aspect || '1:1',
          }),
        })
        const gen = await genRes.json()
        if (genRes.ok && gen.genId) {
          // 最多等约 3 分钟；即使没画完也先进入新书页（文字已经存好）
          for (let i = 0; i < 60; i++) {
            await new Promise((r) => setTimeout(r, 3000))
            const status = await fetch(`/api/generate-pages?genId=${gen.genId}`).then((r) => r.json())
            if (status.status === 'done' || status.status === 'error') break
          }
        }
      } catch {
        // 配图失败不影响这一集：文字版已经落库
      }

      router.push(`/book/${data.bookId}`)
    } catch (err) {
      setRemixError(err instanceof Error ? err.message : 'Failed to write the next episode')
      setRemixStep('idle')
    }
  }

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

  const outline: PageOutline[] =
    book.outline && book.outline.length > 0
      ? book.outline
      : pagesToOutline(book.pages || [])

  const donePages = proJob?.pages?.filter(p => p.clip === 'done').length ?? 0
  const totalDone = proJob ? donePages : 0
  const proProgress = proJob
    ? Math.round((totalDone / Math.max(proJob.total, 1)) * 100)
    : 0

  const nextEpisode = (book.episodeNumber ?? 1) + 1
  const chosenRemix = REMIX_KINDS.find((k) => k.id === remixKind) ?? null

  /** 翻页 / 读完：只在本人阅读时回流 */
  const handleActivePageChange = (index: number | null) => {
    setActivePage(index)
    if (!book?.isOwner || index === null) return

    const pageNumber = index + 1
    if (lastPageSentRef.current !== pageNumber) {
      lastPageSentRef.current = pageNumber
      sendReadingEvents(book.id, [{ type: 'page_view', page: pageNumber }])
    }

    if (index === outline.length - 1 && !completedRef.current) {
      completedRef.current = true
      sendReadingEvents(book.id, [{ type: 'book_complete', page: pageNumber }])
    }
  }

  /** 从 idle 再播一次 = 重播 */
  const handlePlay = () => {
    if (!book?.isOwner) return
    playCountRef.current += 1
    if (playCountRef.current > 1) {
      sendReadingEvents(book.id, [{ type: 'replay' }])
    }
  }

  /** 提交 quiz：记录正确率；首次提交也视为读完 */
  const handleCheckAnswers = () => {
    if (!book?.quiz) return
    setSubmitted(true)
    if (!book.isOwner || quizSentRef.current) return

    quizSentRef.current = true
    const total = book.quiz.questions.length
    sendReadingEvents(book.id, [
      { type: 'quiz_submit', value: total > 0 ? score / total : 0, count: total },
    ])
    if (!completedRef.current) {
      completedRef.current = true
      sendReadingEvents(book.id, [{ type: 'book_complete' }])
    }
  }

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

      {/* Pro 动画面板 */}
      <div className="apple-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#2D2D2D]">Animated Read-Aloud</h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              AI-generated video with voiceover &amp; original music · {PRO_COST} credits per book · up to 8 pages
            </p>
            {user && (
              <p className="text-[11px] text-[#8E8E93] mt-1">
                Your balance: <span className="font-semibold text-[#7B3FBF]">{proCredits} credits</span>
              </p>
            )}
          </div>
          {!proJobId && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#C8A2E8]/20 text-[#7B3FBF] text-xs font-semibold">
              ✨ Pro
            </span>
          )}
        </div>

        {!proJobId && !proGenerating && (
          canStartPro ? (
            <button
              className="apple-button text-sm px-6 py-3 w-full sm:w-auto"
              onClick={handleStartPro}
            >
              🎬 Generate Animated Book ({PRO_COST} credits)
            </button>
          ) : (
            <div className="space-y-2">
              <button
                className="text-sm px-6 py-3 w-full sm:w-auto rounded-xl font-medium text-white bg-[#7B3FBF] hover:bg-[#6A2FB0] transition-all"
                onClick={handleStartPro}
              >
                ✨ Buy Pro Animation Pack · 5 books for $55
              </button>
              <p className="text-[11px] text-[#8E8E93]">
                {user
                  ? `You need ${Math.max(PRO_COST - proCredits, 0)} more credits for this book. Packs never expire.`
                  : 'Sign in to buy a Pro Animation Pack. Packs never expire.'}
              </p>
            </div>
          )
        )}

        {proGenerating && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bunny-bounce"><BunnyMascot size={32} /></div>
              <span className="text-sm text-[#2D2D2D]">Generating your animated book…</span>
            </div>
            <div className="w-full bg-[#F2F2F7] rounded-full h-2.5">
              <div
                className="bunny-gradient h-2.5 rounded-full transition-all duration-700"
                style={{ width: '30%' }}
              />
            </div>
            <p className="text-xs text-[#8E8E93]">This usually takes 2–5 minutes. You can close this tab.</p>
          </div>
        )}

        {proJob && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#2D2D2D]">
                {proJob.status === 'done' ? '✅ Complete!' :
                 proJob.status === 'error' ? '❌ Failed' :
                 `⏳ ${totalDone}/${proJob.total} pages done`}
              </span>
              {proJob.status === 'done' && proJob.finalVideoUrl && (
                <button
                  className="apple-button text-sm px-4 py-2"
                  onClick={handleDownloadPro}
                >
                  ⬇ Download MP4
                </button>
              )}
            </div>
            <div className="w-full bg-[#F2F2F7] rounded-full h-2.5">
              <div
                className="bunny-gradient h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${proProgress}%` }}
              />
            </div>
            {/* 每页状态 */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {proJob.pages?.map((p, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    p.clip === 'done' ? 'bg-[#98D8C8]/30 text-[#3E9C7A]' :
                    p.clip === 'generating' ? 'bg-[#FF6B8A]/20 text-[#FF6B8A] animate-pulse' :
                    p.clip === 'error' ? 'bg-red-100 text-red-400' :
                    'bg-[#F2F2F7] text-[#C8A2E8]'
                  }`}
                  title={`Page ${i + 1}: clip=${p.clip} audio=${p.audio}`}
                >
                  {p.clip === 'done' ? '✓' : p.index + 1}
                </div>
              ))}
            </div>
            {proJob.status === 'error' && (
              <p className="text-xs text-red-400">
                Generation failed. The free version (PDF + read-aloud) is still available.
              </p>
            )}
          </div>
        )}

        {proError && (
          <p className="text-xs text-red-400 mt-2">{proError}</p>
        )}
      </div>

      {/* Read along (Pro) or Read aloud (free) */}
      {proJob?.status === 'done' ? (
        <ReadAlongPlayer
          pages={outline.map(p => p.pageText)}
          activePageIndex={activePage}
          onActivePageChange={handleActivePageChange}
          onReadAlongScore={(accuracy) => {
            if (book.isOwner) sendReadingEvents(book.id, [{ type: 'readalong', value: accuracy }])
          }}
        />
      ) : (
        <ReadAloudPlayer
          pages={outline.map(p => p.pageText)}
          onActivePageChange={handleActivePageChange}
          onPlay={handlePlay}
        />
      )}

      {/* Story pages */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        {outline.map((page, i) => (
          <div
            key={i}
            id={`story-page-${i}`}
            className={`apple-card p-4 transition-all ${
              activePage === i ? 'ring-2 ring-[#FF6B8A] border-[#FF6B8A] bg-[#FFF5EE]' : ''
            }`}
          >
            <span className="text-[10px] text-[#C8A2E8] font-semibold">PAGE {i + 1}</span>
            {book.pageImageUrls?.[i] && (
              <div
                className="aspect-[4/3] rounded-lg mt-1.5 bg-[#FFF5EE]"
                style={{
                  backgroundImage: `url(${book.pageImageUrls[i]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
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
              onClick={handleCheckAnswers}
            >
              {submitted ? '✓ Checked' : 'Check Answers'}
            </button>
          </div>
        </div>
      )}

      {/* 单集学情：只给本家庭看 */}
      {book.isOwner && <BookInsightsPanel bookId={book.id} />}

      {/* 教学资料导出：词汇表 / 课堂讲义 / GRL 报告 */}
      {book.isOwner && (
        <TeachingExports bookId={book.id} isPaid={!!user?.isPaid} />
      )}

      {/* 续集：同一主角 + 同一世界。只在本书所属家庭里出现 */}
      {book.canContinue && (
        <div className="apple-card p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-[#2D2D2D]">
                Episode {nextEpisode}?
              </h2>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Same hero, same world — pick how this one goes.
              </p>
            </div>
            <BunnyMascot size={40} />
          </div>

          {remixStep === 'idle' && !remixKind && (
            <div className="grid sm:grid-cols-3 gap-3">
              {REMIX_KINDS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setRemixKind(option.id)}
                  className="text-left rounded-xl border border-[#E5E5EA] bg-white p-4 hover:border-[#FF6B8A] hover:bg-[#FFF5EE] transition-all"
                >
                  <span className="block text-sm font-semibold text-[#2D2D2D]">{option.label}</span>
                  <span className="mt-1 block text-xs text-[#8E8E93] leading-relaxed">{option.hint}</span>
                </button>
              ))}
            </div>
          )}

          {remixStep === 'idle' && chosenRemix && (
            <div className="space-y-4">
              <p className="text-sm text-[#2D2D2D]">
                <span className="font-semibold">{chosenRemix.label}</span>
                {book.protagonistName ? ` — ${book.protagonistName} stays the hero.` : ''}
              </p>
              <div className="rounded-xl bg-[#FFF5EE] p-4 text-xs text-[#8E8E93] leading-relaxed">
                This episode is AI-generated. {book.protagonistName || 'Your child'}&apos;s look stays inside
                your account — it is never shared with world authors or other families.
              </div>
              <TurnstileWidget
                onVerify={(token) => setRemixToken(token)}
                onExpire={() => setRemixToken(null)}
                onError={() => setRemixToken(null)}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  className="apple-button text-sm px-5 py-2.5 disabled:opacity-50"
                  disabled={!remixToken}
                  onClick={handleRemix}
                >
                  Generate Episode {nextEpisode}
                </button>
                <button
                  className="apple-button-secondary text-sm px-4 py-2.5"
                  onClick={() => { setRemixKind(null); setRemixToken(null) }}
                >
                  Pick another
                </button>
              </div>
              <p className="text-[11px] text-[#8E8E93]">
                Uses one book from your plan. Cancelling never charges you.
              </p>
            </div>
          )}

          {remixStep !== 'idle' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bunny-bounce"><BunnyMascot size={32} /></div>
                <span className="text-sm text-[#2D2D2D]">
                  {remixStep === 'writing'
                    ? 'Writing Episode ' + nextEpisode + '…'
                    : 'Illustrating Episode ' + nextEpisode + '…'}
                </span>
              </div>
              <div className="w-full bg-[#F2F2F7] rounded-full h-2.5">
                <div
                  className="bunny-gradient h-2.5 rounded-full transition-all duration-700"
                  style={{ width: remixStep === 'writing' ? '25%' : '65%' }}
                />
              </div>
              <p className="text-xs text-[#8E8E93]">
                Same hero, same world. This usually takes 1–3 minutes.
              </p>
            </div>
          )}

          {remixError && <p className="text-xs text-red-400 mt-3">{remixError}</p>}
        </div>
      )}
    </div>
  )
}
