'use client'

import { useEffect, useRef, useState } from 'react'
import { MUSIC_MOODS, createAmbient, type AmbientController } from '@/lib/audio/music'
import {
  cancelSpeech,
  pauseSpeech,
  resumeSpeech,
  speak,
  speechSupported,
  subscribeVoices,
  type NarrationVoice,
} from '@/lib/audio/narration'

interface ReadAloudPlayerProps {
  pages: string[]
  onActivePageChange?: (index: number | null) => void
  /** 每次从 idle 开始播放（含重播）时触发，用于统计重播次数 */
  onPlay?: () => void
}

type Status = 'idle' | 'playing' | 'paused'

interface LanguageOption {
  code: string
  label: string
}

/** BCP-47 语言选项（文案全部为英文，面向家长/老师） */
const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Spanish (Spain)' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
  { code: 'zh-TW', label: 'Traditional Chinese' },
]

/** 朗读速度选项：默认偏慢，更适合低龄儿童 */
const SPEED_OPTIONS = [0.7, 0.85, 1, 1.25]

/**
 * 朗读 + 配乐播放器。
 * 配音走浏览器内置 Web Speech API（见 lib/audio/narration.ts）；
 * 配乐走运行时 Web Audio 合成（见 lib/audio/music.ts）。
 */
export default function ReadAloudPlayer({ pages, onActivePageChange, onPlay }: ReadAloudPlayerProps) {
  const [supported, setSupported] = useState(false)
  const [voices, setVoices] = useState<NarrationVoice[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [pageIndex, setPageIndex] = useState<number | null>(null)
  const [rate, setRate] = useState(0.85)
  const [lang, setLang] = useState('en-US')
  const [voiceName, setVoiceName] = useState('')

  const [musicOn, setMusicOn] = useState(false)
  const [mood, setMood] = useState(MUSIC_MOODS[0].id)
  const [musicVolume, setMusicVolume] = useState(0.25)

  const ambientRef = useRef<AmbientController | null>(null)
  const playingRef = useRef(false)
  const indexRef = useRef<number | null>(null)
  const rateRef = useRef(rate)
  const langRef = useRef(lang)
  const voiceRef = useRef(voiceName)
  const onActiveRef = useRef(onActivePageChange)
  const onPlayRef = useRef(onPlay)

  // 能力探测与语音订阅（仅客户端执行）
  useEffect(() => {
    setSupported(speechSupported())
  }, [])

  useEffect(() => {
    onPlayRef.current = onPlay
  }, [onPlay])

  useEffect(() => subscribeVoices(setVoices), [])

  useEffect(() => {
    rateRef.current = rate
  }, [rate])

  useEffect(() => {
    langRef.current = lang
    setVoiceName('') // 切换语言后清除旧语音，回到自动选择
  }, [lang])

  useEffect(() => {
    voiceRef.current = voiceName
  }, [voiceName])

  useEffect(() => {
    onActiveRef.current = onActivePageChange
  }, [onActivePageChange])

  // 卸载清理：停止朗读并销毁配乐控制器
  useEffect(() => {
    return () => {
      playingRef.current = false
      cancelSpeech()
      ambientRef.current?.dispose()
      ambientRef.current = null
    }
  }, [])

  const resetToIdle = () => {
    playingRef.current = false
    indexRef.current = null
    setStatus('idle')
    setPageIndex(null)
    onActiveRef.current?.(null)
  }

  /** 顺序朗读第 index 页；读完自动推进到下一页 */
  const speakPage = (index: number) => {
    if (index >= pages.length) {
      resetToIdle()
      return
    }

    indexRef.current = index
    setPageIndex(index)
    onActiveRef.current?.(index)

    speak(pages[index], {
      lang: langRef.current,
      voiceName: voiceRef.current || undefined,
      rate: rateRef.current,
      onEnd: () => {
        // 若期间已被 Stop/取消，则不再推进
        if (!playingRef.current) return
        speakPage(index + 1)
      },
      onError: () => {
        if (!playingRef.current) return
        resetToIdle()
      },
    })
  }

  const handlePrimary = () => {
    if (status === 'playing') {
      pauseSpeech()
      setStatus('paused')
      return
    }
    if (status === 'paused') {
      resumeSpeech()
      setStatus('playing')
      return
    }
    if (pages.length === 0) return
    playingRef.current = true
    setStatus('playing')
    onPlayRef.current?.()
    speakPage(0)
  }

  const handleStop = () => {
    cancelSpeech()
    resetToIdle()
  }

  const toggleMusic = () => {
    if (!musicOn) {
      // 从用户手势启动，满足浏览器自动播放策略
      if (!ambientRef.current) ambientRef.current = createAmbient(mood, musicVolume)
      ambientRef.current.setMood(mood)
      ambientRef.current.setVolume(musicVolume)
      ambientRef.current.start()
      setMusicOn(true)
    } else {
      ambientRef.current?.stop()
      setMusicOn(false)
    }
  }

  const changeMood = (id: string) => {
    setMood(id)
    ambientRef.current?.setMood(id)
  }

  const changeVolume = (v: number) => {
    setMusicVolume(v)
    ambientRef.current?.setVolume(v)
  }

  // 与当前语言同语种的语音优先
  const langPrefix = lang.split('-')[0].toLowerCase()
  const matchingVoices = voices.filter(v =>
    v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)
  )

  const primaryLabel =
    status === 'playing' ? 'Pause' : status === 'paused' ? 'Resume' : 'Read aloud'

  const readout =
    pageIndex === null
      ? `Ready · ${pages.length} ${pages.length === 1 ? 'page' : 'pages'}`
      : `Page ${pageIndex + 1} / ${pages.length}`

  return (
    <div className="apple-card p-6 md:p-8 mb-6 print:hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#2D2D2D]">Read Aloud</h2>
          <p className="text-xs text-[#8E8E93] mt-0.5">
            Listen to the story, page by page
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#98D8C8]/20 text-[#4A9E8E] text-xs">
          🔊 Narration
        </span>
      </div>

      {!supported ? (
        <p className="text-sm text-[#8E8E93]">
          Read-aloud is not available in this browser. The music controls below still work.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrimary}
              aria-label={primaryLabel}
              aria-pressed={status === 'playing'}
              className="apple-button text-sm px-5 py-2.5"
            >
              {primaryLabel}
            </button>
            <button
              type="button"
              onClick={handleStop}
              disabled={status === 'idle'}
              aria-label="Stop read aloud"
              className="apple-button-secondary text-sm px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Stop
            </button>
          </div>

          <p
            className="text-sm font-semibold text-[#2D2D2D] mt-3"
            aria-live="polite"
            aria-atomic="true"
          >
            {readout}
          </p>

          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <label className="block">
              <span className="text-xs font-semibold text-[#8E8E93]">Speed</span>
              <select
                value={rate}
                onChange={e => setRate(Number(e.target.value))}
                className="apple-input mt-1.5 text-sm"
                aria-label="Narration speed"
              >
                {SPEED_OPTIONS.map(s => (
                  <option key={s} value={s}>
                    {s}×
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-[#8E8E93]">Language</span>
              <select
                value={lang}
                onChange={e => setLang(e.target.value)}
                className="apple-input mt-1.5 text-sm"
                aria-label="Narration language"
              >
                {LANGUAGE_OPTIONS.map(o => (
                  <option key={o.code} value={o.code}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-[#8E8E93]">Voice</span>
              <select
                value={voiceName}
                onChange={e => setVoiceName(e.target.value)}
                className="apple-input mt-1.5 text-sm"
                aria-label="Narration voice"
              >
                <option value="">Automatic (recommended)</option>
                {matchingVoices.map(v => (
                  <option key={`${v.name}-${v.lang}`} value={v.name}>
                    {v.name} · {v.lang}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {matchingVoices.length === 0 && (
            <p className="text-xs text-[#C8A2E8] mt-2">
              Your browser has no installed voice for this language — narration will fall back to
              a default voice.
            </p>
          )}
        </>
      )}

      {/* Background music */}
      <div className="mt-6 pt-5 border-t border-[#F2F2F7]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#2D2D2D]">Background music</h3>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Gentle ambient music, generated live in your browser.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleMusic}
            aria-pressed={musicOn}
            aria-label="Toggle background music"
            className={`text-sm font-medium px-4 py-2 rounded-full border transition-colors ${
              musicOn
                ? 'bg-[#FF6B8A] text-white border-[#FF6B8A]'
                : 'bg-[#F2F2F7] text-[#2D2D2D] border-[#E5E5EA]'
            }`}
          >
            {musicOn ? 'On' : 'Off'}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-[#8E8E93]">Mood</span>
            <select
              value={mood}
              onChange={e => changeMood(e.target.value)}
              className="apple-input mt-1.5 text-sm"
              aria-label="Music mood"
            >
              {MUSIC_MOODS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-[#8E8E93]">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={musicVolume}
              onChange={e => changeVolume(Number(e.target.value))}
              className="w-full mt-5 accent-[#FF6B8A]"
              aria-label="Background music volume"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
