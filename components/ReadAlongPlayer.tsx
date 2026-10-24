/**
 * 跟读播放器 — 词级高亮
 *
 * 复用 ReadAloudPlayer 的语速/语种选项，
 * 新增：根据 Whisper 词级时间戳高亮当前读到的词。
 *
 * 失败降级：时间戳不可用时，回退到句级高亮（按空格分词）；
 * 再失败则不高亮。
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import type { PageOutline } from '@/lib/types/book'
import { readAlongAccuracy } from '@/lib/readalong'

interface WordTimestamp {
  word: string
  start: number // 秒
  end: number   // 秒
}

interface PageCaptions {
  words: WordTimestamp[]
  sentences?: { text: string; start: number; end: number }[]
}

interface ReadAlongPlayerProps {
  /** 每页文字 */
  pages: string[]
  /** 每页词级时间戳（来自 Whisper） */
  captionData?: PageCaptions[]
  /** 当前活跃页索引 */
  activePageIndex?: number | null
  onActivePageChange?: (index: number | null) => void
  language?: string
  rate?: number
  /** 跟读练习的准确率（0–1）；只在家长确认后、本机识别时回调 */
  onReadAlongScore?: (accuracy: number) => void
}

/** 浏览器语音识别的最小接口（Chrome/Edge 的 webkitSpeechRecognition） */
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

type Status = 'idle' | 'playing' | 'paused'

/** 从 Whisper JSON 响应解析词级时间戳 */
function parseWhisperResult(data: unknown): PageCaptions {
  if (!data || typeof data !== 'object') {
    return { words: [], sentences: [] }
  }
  const d = data as Record<string, unknown>

  // OpenAI Whisper API 格式：chunks[].start / .end / .text
  if (Array.isArray(d.chunks)) {
    const words: WordTimestamp[] = (d.chunks as Array<{ start: number; end: number; text: string }>).map(c => ({
      word: c.text.trim(),
      start: c.start,
      end: c.end,
    }))
    return { words }
  }

  // Replicate Whisper 格式：words[].word / .start / .end
  if (Array.isArray(d.words)) {
    const words: WordTimestamp[] = (d.words as Array<{ word: string; start: number; end: number }>).map(w => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }))
    return { words }
  }

  return { words: [], sentences: [] }
}

/** 对不齐时回退到句级高亮（按标点分割） */
function buildSentenceHighlights(text: string): PageCaptions {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .map((s, i) => ({ text: s.trim(), start: i, end: i + 1 }))
  return { words: [], sentences }
}

/** 找出当前应该高亮的词 */
function getHighlightedWordIndex(
  words: WordTimestamp[],
  currentTime: number,
): number | null {
  for (let i = 0; i < words.length; i++) {
    if (currentTime >= words[i].start && currentTime < words[i].end) {
      return i
    }
  }
  // 没匹配到，找最近的
  for (let i = words.length - 1; i >= 0; i--) {
    if (currentTime >= words[i].start) return i
  }
  return null
}

export default function ReadAlongPlayer({
  pages,
  captionData,
  activePageIndex,
  onActivePageChange,
  language = 'en-US',
  rate = 0.85,
  onReadAlongScore,
}: ReadAlongPlayerProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [highlightedWord, setHighlightedWord] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)

  // 跟读练习（麦克风）：默认关闭，家长确认后才启用
  const [micSupported, setMicSupported] = useState(false)
  const [practiceConsent, setPracticeConsent] = useState(false)
  const [listening, setListening] = useState(false)
  const [practiceScore, setPracticeScore] = useState<number | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const heardRef = useRef('')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animFrameRef = useRef<number>(0)
  const playingRef = useRef(false)

  useEffect(() => {
    setMicSupported(getSpeechRecognition() !== null)
  }, [])

  // 换页就清空上一页的口语记录，避免把两页拼在一起算分
  useEffect(() => {
    recognitionRef.current?.stop()
    heardRef.current = ''
    setPracticeScore(null)
  }, [activePageIndex])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      recognitionRef.current = null
    }
  }, [])

  const finishPractice = (targetText: string) => {
    const accuracy = readAlongAccuracy(targetText, heardRef.current)
    setPracticeScore(accuracy)
    onReadAlongScore?.(accuracy)
  }

  const startPractice = () => {
    const Ctor = getSpeechRecognition()
    if (!Ctor || activePageIndex === null || !currentPageText) return

    const recognition = new Ctor()
    recognition.lang = language
    recognition.continuous = true
    recognition.interimResults = false
    heardRef.current = ''
    setPracticeScore(null)

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const alt = event.results[i][0]
        if (alt?.transcript) heardRef.current += ` ${alt.transcript}`
      }
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => {
      setListening(false)
      finishPractice(currentPageText)
    }

    recognitionRef.current = recognition
    setListening(true)
    try {
      recognition.start()
    } catch {
      setListening(false)
    }
  }

  const stopPractice = () => {
    recognitionRef.current?.stop()
  }

  // 当前页的文字
  const currentPageText = activePageIndex !== null && activePageIndex !== undefined ? pages[activePageIndex] : ''
  // 当前页的时间戳数据
  const currentCaptions = activePageIndex !== null && activePageIndex !== undefined && captionData?.[activePageIndex]
    ? captionData[activePageIndex]
    : null

  // 清理
  useEffect(() => {
    return () => {
      playingRef.current = false
      cancelAnimationFrame(animFrameRef.current)
      audioRef.current?.pause()
    }
  }, [])

  // 播放推进高亮
  const tick = () => {
    if (!playingRef.current || !audioRef.current) return
    const t = audioRef.current.currentTime
    setCurrentTime(t)
    if (currentCaptions?.words?.length) {
      const idx = getHighlightedWordIndex(currentCaptions.words, t)
      setHighlightedWord(idx)
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }

  const handlePlay = () => {
    if (activePageIndex === null) return
    playingRef.current = true
    setStatus('playing')
    onActivePageChange?.(activePageIndex ?? null)

    // 启动定时器模拟播放（真实场景需要用 TTS 音频）
    const interval = setInterval(() => {
      if (!playingRef.current) { clearInterval(interval); return }
      tick()
    }, 100)
    animFrameRef.current = requestAnimationFrame(tick)
  }

  const handlePause = () => {
    playingRef.current = false
    setStatus('paused')
    cancelAnimationFrame(animFrameRef.current)
  }

  const handleStop = () => {
    playingRef.current = false
    setStatus('idle')
    setHighlightedWord(null)
    setCurrentTime(0)
    cancelAnimationFrame(animFrameRef.current)
    onActivePageChange?.(null)
  }

  // 高亮文本渲染
  const renderHighlightedText = () => {
    if (!currentPageText) return null
    const words = currentCaptions?.words
    if (!words?.length) {
      // 无时间戳 → 不高亮
      return <span>{currentPageText}</span>
    }

    const tokens = currentPageText.split(/(\s+)/)
    let wordIdx = 0
    return (
      <span className="leading-relaxed text-base">
        {tokens.map((token: string, i: number) => {
          if (/\s/.test(token)) return <span key={i}>{token}</span>
          const isHighlighted = wordIdx < words.length && highlightedWord === wordIdx
          const w = words[wordIdx]
          wordIdx++
          return (
            <span
              key={i}
              className={`transition-all duration-150 ${
                isHighlighted
                  ? 'bg-[#FF6B8A]/20 text-[#FF6B8A] rounded px-0.5'
                  : 'text-[#2D2D2D]'
              }`}
              title={w ? `${w.start.toFixed(1)}s–${w.end.toFixed(1)}s` : ''}
            >
              {token}
            </span>
          )
        })}
      </span>
    )
  }

  const primaryLabel =
    status === 'playing' ? 'Pause' : status === 'paused' ? 'Resume' : 'Read along'

  return (
    <div className="apple-card p-6 md:p-8 mb-6 print:hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#2D2D2D]">Read Along</h2>
          <p className="text-xs text-[#8E8E93] mt-0.5">
            Follow along as the story is read — words highlight in real time
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#C8A2E8]/20 text-[#7B3FBF] text-xs">
          ✨ Pro Feature
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          type="button"
          onClick={handlePlay}
          disabled={status === 'playing' || activePageIndex === null}
          aria-label={primaryLabel}
          className="apple-button text-sm px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={handlePause}
          disabled={status !== 'playing'}
          className="apple-button-secondary text-sm px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Pause
        </button>
        <button
          type="button"
          onClick={handleStop}
          disabled={status === 'idle'}
          className="apple-button-secondary text-sm px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Stop
        </button>
      </div>

      {/* 高亮文本区域 */}
      <div className="bg-[#F8F8FA] rounded-xl p-5 min-h-[120px]">
        {renderHighlightedText()}
      </div>

      {/* 说明 */}
      <p className="text-xs text-[#8E8E93] mt-3">
        {currentCaptions?.words?.length
          ? `${currentCaptions.words.length} words tracked · click Play to start`
          : 'No caption data available · falling back to plain text view'}
      </p>

      {/* 跟读练习：默认关闭，家长确认后才开麦 */}
      {micSupported && activePageIndex !== null && (
        <div className="mt-5 border-t border-[#F2F2F7] pt-4">
          <p className="text-sm font-semibold text-[#2D2D2D]">Read it out loud</p>
          <p className="mt-1 text-xs text-[#8E8E93] leading-relaxed">
            Your browser turns speech into words and we compare them with this page. We only save the score —
            never the audio or the words.
          </p>

          {!practiceConsent ? (
            <label className="mt-3 flex items-start gap-2 text-xs text-[#8E8E93] leading-relaxed">
              <input
                type="checkbox"
                className="mt-0.5"
                onChange={(e) => setPracticeConsent(e.target.checked)}
              />
              <span>
                I&apos;m the parent or guardian and I allow speech practice for this page.
              </span>
            </label>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={listening ? stopPractice : startPractice}
                className={listening ? 'apple-button-secondary text-sm px-4 py-2' : 'apple-button text-sm px-4 py-2'}
              >
                {listening ? 'Stop and score' : 'Start reading'}
              </button>
              {practiceScore !== null && (
                <span className="text-sm font-semibold text-[#4A9E8E]">
                  {Math.round(practiceScore * 100)}% words matched
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
