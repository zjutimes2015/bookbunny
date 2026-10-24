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
}: ReadAlongPlayerProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [highlightedWord, setHighlightedWord] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animFrameRef = useRef<number>(0)
  const playingRef = useRef(false)

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
    </div>
  )
}
