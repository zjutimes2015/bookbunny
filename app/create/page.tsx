'use client'

import { useState } from 'react'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import MultiCharacterManager from '@/components/MultiCharacterManager'
import TurnstileWidget from '@/components/TurnstileWidget'
import type { PageOutline, StyleCard, StyleLexicon, CharacterCard, AspectRatio } from '@/lib/types/book'
import { ASPECT_OPTIONS } from '@/lib/types/book'
import { STYLE_LIBRARY } from '@/data/style-library'
import { runImageChecks, runThreeStepChecks } from '@/lib/page-checks'

// 阶段6：至简三步状态机（设定 → 生成大纲 → 按纲生图）
type Step = 'setup' | 'outline' | 'illustrate'

interface CharData {
  id: string
  name: string
  photoPreview?: string
  refSeed?: number
  /** 阶段3：角色设定卡（12 项） */
  card?: CharacterCard
  /** 阶段3：一致性固定句（注入每页生图 prompt） */
  consistencyLine?: string
  /** 阶段3：角色参考图（base64） */
  imageB64?: string
  /** 正在生成角色卡 */
  generating?: boolean
}

/** 页面功能中文标签 */
const FUNC_LABEL: Record<string, string> = {
  cover: '封面', 'front-matter': '扉页', body: '正文', 'back-cover': '封底',
}

/** 生图检查表状态样式 */
const STATUS_BG: Record<string, string> = { pass: 'bg-[#EAF7F1]', warn: 'bg-amber-50', manual: 'bg-[#F2F2F7]' }
const STATUS_TEXT: Record<string, string> = { pass: 'text-[#3E9C7A]', warn: 'text-amber-500', manual: 'text-[#8E8E93]' }
const STATUS_ICON: Record<string, string> = { pass: '✓', warn: '!', manual: '•' }

/**
 * 文档 5.4：试生成选页 —— 覆盖不同故事状态（封面/开篇/约 1·3 与 2·3 处/结尾），
 * 去重后最多 5 页；若总页数 ≤ 5 则等于全部。
 */
function pickTrialPages(outline: PageOutline[]): number[] {
  const n = outline.length
  if (n <= 5) return outline.map(p => p.pageNumber)
  const idx = new Set<number>([
    0,                                   // 封面
    1,                                   // 第 1 页（开篇）
    Math.round((n - 1) / 3),             // 约 1/3 处（情绪冲突）
    Math.round(((n - 1) * 2) / 3),       // 约 2/3 处（关键转折）
    n - 1,                               // 结尾页
  ])
  return Array.from(idx).sort((a, b) => a - b).map(i => outline[i].pageNumber)
}

export default function CreatePage() {
  const [step, setStep] = useState<Step>('setup')
  const [characters, setCharacters] = useState<CharData[]>([])
  const [story, setStory] = useState<{
    title: string
    outline: PageOutline[]
    level?: string
    levelLabel?: string
    vocabularyPassed?: boolean
    vocabularyRatio?: number
    quiz?: { questions: { q: string; options: string[]; answer: number; skill: string }[] } | null
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileError, setTurnstileError] = useState(false)

  // 阶段5：生图流程状态（试生成 → 5 页一批续跑）
  const [genProgress, setGenProgress] = useState<{
    total: number; completed: number; pages: { index: number; status: string; imageB64?: string }[]
  } | null>(null)
  const [pageImages, setPageImages] = useState<Record<number, string>>({}) // 绝对页码 → dataURL
  const [trialDone, setTrialDone] = useState(false)
  const [pendingPages, setPendingPages] = useState<number[]>([])
  const [batchesStarted, setBatchesStarted] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({})
  const [savedBookId, setSavedBookId] = useState<string | null>(null)

  const [theme, setTheme] = useState('')
  const [ageGroup, setAgeGroup] = useState('3-5')
  const [level, setLevel] = useState('C')
  const [pageCount, setPageCount] = useState(20) // 第一步：页数

  // 规格层（阶段3）：画幅比例 + 宝宝照片方案
  const [aspect, setAspect] = useState<AspectRatio>('1:1')
  const [photoUsage, setPhotoUsage] = useState<'illustrated' | 'photo-family' | 'photo-public'>('illustrated')

  // Style layer（风格层）
  const [styleId, setStyleId] = useState('')
  const [styleCard, setStyleCard] = useState<StyleCard | null>(null)
  const [styleLexicon, setStyleLexicon] = useState<StyleLexicon | null>(null)
  const [styleLoading, setStyleLoading] = useState(false)

  // 阶段3：角色一致性固定句 + 参考图（取第一个已生成参考图的角色）
  const consistencyLine = characters.map(c => c.consistencyLine).filter(Boolean).join(' ')
  const refChar = characters.find(c => c.imageB64)

  const handleSelectStyle = async (id: string) => {
    setStyleId(id)
    if (!theme) return
    setStyleLoading(true)
    try {
      const res = await fetch('/api/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styleId: id, ageGroup, theme }),
      })
      const data = await res.json()
      if (data.card && data.lexicon) {
        setStyleCard(data.card)
        setStyleLexicon(data.lexicon)
      }
    } catch (err) {
      console.warn('Style fetch failed:', err)
    } finally {
      setStyleLoading(false)
    }
  }

  // Reading level options (GRL A-E, 3-8岁主战场)
  const LEVEL_OPTIONS = [
    { grl: 'A', label: 'Level A', age: '3-4', desc: 'Emerging · 1-6 words per sentence' },
    { grl: 'B', label: 'Level B', age: '4-5', desc: 'Beginning · 2-8 words per sentence' },
    { grl: 'C', label: 'Level C', age: '5-6', desc: 'Early · 3-10 words per sentence' },
    { grl: 'D', label: 'Level D', age: '6-7', desc: 'Developing · 4-13 words per sentence' },
    { grl: 'E', label: 'Level E', age: '7-8', desc: 'Confident · 5-16 words per sentence' },
  ]

  // Multi-character：加入后立即生成「角色设定卡 + 一致性固定句 + 角色参考图」
  const handleAddCharacter = async (name: string, photo?: File) => {
    const id = `char_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const draft: CharData = { id, name, generating: true }
    if (photo) draft.photoPreview = URL.createObjectURL(photo)
    setCharacters(prev => [...prev, draft])

    try {
      const fd = new FormData()
      fd.append('name', name)
      if (photo) fd.append('photo', photo)
      fd.append('theme', theme)
      fd.append('ageGroup', ageGroup)
      fd.append('photoUsage', photoUsage)
      if (styleCard?.mainStyle) fd.append('styleName', styleCard.mainStyle)
      if (styleLexicon) fd.append('styleLexicon', JSON.stringify(styleLexicon))

      const res = await fetch('/api/create-character', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setCharacters(prev => prev.map(c => c.id === id ? {
        ...c,
        card: data.card,
        consistencyLine: data.consistencyLine,
        imageB64: data.imageB64,
        refSeed: data.refSeed,
        generating: false,
      } : c))
    } catch (err) {
      console.warn('Character card generation failed:', err)
      setCharacters(prev => prev.map(c => c.id === id ? { ...c, generating: false } : c))
    }
  }

  const handleRemoveCharacter = (id: string) =>
    setCharacters(characters.filter(c => c.id !== id))

  const handleUpdateCharacter = (id: string, data: Partial<CharData>) =>
    setCharacters(characters.map(c => c.id === id ? { ...c, ...data } : c))

  // 第二步：生成大纲（仅生成单页大纲，不立即生图）
  const handleGenerateStory = async () => {
    if (!theme || characters.length === 0) return

    // Verify Turnstile
    if (!turnstileToken) {
      setTurnstileError(true)
      return
    }
    setTurnstileError(false)

    const verifyRes = await fetch('/api/verify-turnstile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: turnstileToken }),
    })
    const verifyData = await verifyRes.json()
    if (!verifyData.success) {
      setTurnstileError(true)
      return
    }

    setLoading(true)
    try {
      const charNames = characters.map(c => c.name).join(', ')
      const res = await fetch('/api/create-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme, ageGroup, characterName: charNames, pages: pageCount, level,
          styleLexicon, styleCard,
          characterCards: characters.map(c => c.card).filter(Boolean), // 阶段3：角色一致性
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStory(data)
      setStep('outline')
    } catch (err: unknown) {
      alert('Failed: ' + (err instanceof Error ? err.message : 'Error'))
    } finally {
      setLoading(false)
    }
  }

  // 提交一批（子集）生图并轮询；按绝对页码 p.index 合并到整本图片数组
  const runBatch = async (subset: PageOutline[]) => {
    if (!story || subset.length === 0) return
    try {
      const res = await fetch('/api/generate-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: story.title,
          outline: subset,                              // 子集：带真实 pageNumber
          characterImageB64: refChar?.imageB64 || null, // 阶段3：参考图
          refSeed: refChar?.refSeed || null,
          consistencyLine,                              // 阶段3：每页注入
          aspect,                                       // 阶段3：画幅比例
          styleLexicon,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const gid: string = data.genId

      await new Promise<void>((resolve) => {
        const interval = setInterval(async () => {
          try {
            const r = await fetch(`/api/generate-pages?genId=${gid}`)
            const d = await r.json()
            setGenProgress(d)
            // index 已是绝对页码，直接合并
            setPageImages(prev => {
              const next = { ...prev }
              for (const p of d.pages || []) {
                if (p.imageB64) next[p.index] = `data:image/png;base64,${p.imageB64}`
              }
              return next
            })
            if (d.status === 'done' || d.status === 'error') {
              clearInterval(interval)
              resolve()
            }
          } catch {}
        }, 1500) // Poll every 1.5s
      })
    } catch (err: unknown) {
      alert('Generation failed: ' + (err instanceof Error ? err.message : 'Error'))
    }
  }

  // 第三步：按纲生图（先试生成 4-5 页）
  const startIllustration = async () => {
    if (!story || generating) return
    setGenerating(true)
    setStep('illustrate')
    const trialNums = pickTrialPages(story.outline)
    const trialSet = new Set(trialNums)
    setPendingPages(story.outline.map(p => p.pageNumber).filter(n => !trialSet.has(n)))
    await runBatch(story.outline.filter(p => trialSet.has(p.pageNumber)))
    setTrialDone(true)
    saveBook()
    setGenerating(false)
  }

  // 第三步续跑：按 5 页一批递进生成剩余页
  const continueBatches = async () => {
    if (!story || generating) return
    setGenerating(true)
    setBatchesStarted(true)
    let remaining = [...pendingPages]
    while (remaining.length > 0) {
      const batch = remaining.slice(0, 5)
      remaining = remaining.slice(5)
      await runBatch(story.outline.filter(p => batch.includes(p.pageNumber)))
      setPendingPages(remaining)
    }
    setGenerating(false)
  }

  // Save the generated story + book to the database
  const saveBook = async () => {
    if (!story || savedBookId) return
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: story.title,
          outline: story.outline,
          ageGroup,
          theme,
          level: story.level || null,
          quiz: story.quiz || null,
          aspect,
        }),
      })
      const data = await res.json()
      if (data.bookId) setSavedBookId(data.bookId)
    } catch (err) {
      console.warn('Save book failed (non-blocking):', err)
    }
  }

  // Export PDF with real images
  const handleExportPDF = async () => {
    if (!story) return
    setLoading(true)
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: story.title,
          author: characters.map(c => c.name).join(' & '),
          outline: story.outline,
          size: '8.5x8.5',
        }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      window.open(URL.createObjectURL(blob), '_blank')
    } catch (err: unknown) {
      alert('Export failed: ' + (err instanceof Error ? err.message : 'Error'))
    } finally {
      setLoading(false)
    }
  }

  const handleExportVideo = async () => {
    if (!story) return
    setLoading(true)
    try {
      const res = await fetch('/api/export-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: story.title, outline: story.outline }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      window.open(URL.createObjectURL(blob), '_blank')
    } catch (err: unknown) {
      alert('Video export failed: ' + (err instanceof Error ? err.message : 'Error'))
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    setStep('setup')
    setStory(null)
    setPageImages({})
    setGenProgress(null)
    setTrialDone(false)
    setPendingPages([])
    setBatchesStarted(false)
    setManualChecks({})
  }

  // 派生：本批进度 + 按页码的状态映射
  const batchProgress = genProgress
    ? Math.round((genProgress.completed / Math.max(genProgress.total, 1)) * 100)
    : 0
  const statusByPage: Record<number, string> = {}
  for (const p of genProgress?.pages || []) statusByPage[p.index] = p.status

  // 派生：13 项三步流程检查 + 12 项生图检查
  const threeStepChecks = runThreeStepChecks({
    theme,
    ageGroup,
    styleChosen: !!styleCard || !!styleId,
    pages: pageCount,
    aspect,
    protagonist: characters.length > 0,
    hasOutline: !!story,
    outline: story?.outline,
    trialGenerated: trialDone,
    batchesStarted,
  })
  const imageChecks = story
    ? runImageChecks(story.outline, { consistencyLine, styleLexicon, hasRefImage: !!refChar })
    : []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Progress Steps（阶段6：三步） */}
      <div className="flex items-center justify-center gap-3 mb-10">
        {(['setup', 'outline', 'illustrate'] as Step[]).map((s, i) => {
          const steps: Step[] = ['setup', 'outline', 'illustrate']
          const currentIdx = steps.indexOf(step)
          const isActive = step === s
          const isDone = steps.indexOf(s) < currentIdx
          const label = s === 'setup' ? 'Setup' : s === 'outline' ? 'Outline' : 'Illustrate'
          return (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                isActive ? 'bg-[#2D2D2D] text-white' :
                isDone ? 'bg-[#FF6B8A] text-white' : 'bg-[#F2F2F7] text-[#8E8E93]'
              }`}>{i + 1}</div>
              <span className={`text-sm font-medium ${isActive ? 'text-[#2D2D2D]' : 'text-[#8E8E93]'}`}>
                {label}
              </span>
              {i < 2 && <div className="w-6 h-px bg-[#E5E5EA]" />}
            </div>
          )
        })}
      </div>

      {/* Step 1: Setup（设定：主题/年龄/风格/页数/比例/主角/情绪） */}
      {step === 'setup' && (
        <div className="apple-card p-8">
          <div className="text-center mb-6">
            <BunnyMascot size={60} />
            <h2 className="text-xl font-bold text-[#2D2D2D] mt-3">Create Your Characters</h2>
            <p className="text-sm text-[#8E8E93] mt-1">Add up to 5 characters</p>
          </div>
          <div className="space-y-6">
            <MultiCharacterManager
              characters={characters}
              onAdd={handleAddCharacter}
              onRemove={handleRemoveCharacter}
              onUpdate={handleUpdateCharacter}
              maxCharacters={5}
            />
            {characters.length > 0 && (
              <>
                <div>
                  <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">Story Theme</label>
                  <input className="apple-input" placeholder="e.g. A magical forest adventure..." value={theme}
                         onChange={(e) => setTheme(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">Age Group</label>
                  <select className="apple-input" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                    <option value="0-3">Baby (0-3)</option>
                    <option value="3-5">Preschool (3-5)</option>
                    <option value="5-7">Early Reader (5-7)</option>
                    <option value="7-10">Chapter Book (7-10)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">Reading Level (GRL)</label>
                  <div className="grid grid-cols-5 gap-2">
                    {LEVEL_OPTIONS.map(opt => (
                      <button
                        key={opt.grl}
                        type="button"
                        onClick={() => setLevel(opt.grl)}
                        className={`rounded-xl border px-2 py-2 text-center transition-all ${
                          level === opt.grl
                            ? 'border-[#FF6B8A] bg-[#FFF5EE] ring-1 ring-[#FF6B8A]'
                            : 'border-[#E5E5EA] bg-white hover:border-[#C8A2E8]'
                        }`}
                      >
                        <span className="block text-sm font-bold text-[#2D2D2D]">{opt.label}</span>
                        <span className="block text-[10px] text-[#8E8E93] mt-0.5">{opt.age}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#8E8E93] mt-1.5">
                    {LEVEL_OPTIONS.find(o => o.grl === level)?.desc}
                    <span className="text-[#FF6B8A]"> · Matched to your child's reading level</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">Picture-Book Style（风格层）</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {STYLE_LIBRARY.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectStyle(s.id)}
                        className={`apple-card p-2 text-center transition-all ${
                          styleId === s.id ? 'ring-2 ring-[#FF6B8A]' : 'hover:ring-1 hover:ring-[#C8A2E8]'
                        }`}
                      >
                        <span className="block text-[11px] font-semibold text-[#2D2D2D] leading-tight">{s.name}</span>
                        <span className="block text-[9px] text-[#8E8E93] mt-0.5 leading-tight">{s.nameEn}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#8E8E93] mt-1.5">
                    {styleLoading
                      ? 'Applying style...'
                      : styleCard
                        ? `${styleCard.mainStyle} · ${styleCard.colorMood}`
                        : 'Pick ONE main style for the whole book（先用主题生成风格卡）'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">页数 / Page Count</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[12, 16, 20, 24].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPageCount(n)}
                        className={`rounded-xl border px-2 py-2 text-center transition-all ${
                          pageCount === n
                            ? 'border-[#FF6B8A] bg-[#FFF5EE] ring-1 ring-[#FF6B8A]'
                            : 'border-[#E5E5EA] bg-white hover:border-[#C8A2E8]'
                        }`}
                      >
                        <span className="block text-sm font-bold text-[#2D2D2D]">{n}</span>
                        <span className="block text-[10px] text-[#8E8E93]">{n === 20 ? '推荐' : '页'}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">画幅比例 / Aspect Ratio（规格层）</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {ASPECT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAspect(opt.id)}
                        className={`rounded-xl border px-2 py-2 text-center transition-all ${
                          aspect === opt.id
                            ? 'border-[#FF6B8A] bg-[#FFF5EE] ring-1 ring-[#FF6B8A]'
                            : 'border-[#E5E5EA] bg-white hover:border-[#C8A2E8]'
                        }`}
                      >
                        <span className="block text-[12px] font-bold text-[#2D2D2D]">{opt.label}</span>
                        <span className="block text-[10px] text-[#8E8E93] mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">宝宝照片方案 / Photo Policy</label>
                  <select className="apple-input" value={photoUsage}
                          onChange={(e) => setPhotoUsage(e.target.value as typeof photoUsage)}>
                    <option value="illustrated">方案 A · 不用真照（隐私最安全，可商用）</option>
                    <option value="photo-family">方案 B · 用真照 · 仅家庭使用</option>
                    <option value="photo-public">方案 B · 用真照 · 可公开</option>
                  </select>
                  <p className="text-[11px] text-[#8E8E93] mt-1.5">
                    方案 A 按名字+主题生成插画角色；方案 B 用宝宝照片作 AI 参考图（注意隐私使用范围）
                  </p>
                </div>
                {turnstileError && (
                  <p className="text-xs text-red-400 text-center">Please complete the verification</p>
                )}
                <TurnstileWidget
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileError(true)}
                  className="my-3"
                />
                <button className="apple-button w-full disabled:opacity-50"
                        disabled={!theme || characters.length === 0 || loading}
                        onClick={handleGenerateStory}>
                  {loading ? '✨ Generating...' : '✨ 生成大纲 / Generate Outline'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Outline（生成大纲 + 13 项三步流程检查 + 分级展示） */}
      {step === 'outline' && story && (
        <div className="apple-card p-8">
          <div className="flex items-start sm:items-center justify-between gap-4 mb-5 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-[#2D2D2D]">{story.title}</h2>
              <p className="text-sm text-[#8E8E93]">
                {characters.map(c => c.name).join(' & ')} • {story.outline.length} pages • {ageGroup}
                {story.levelLabel && (
                  <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full bg-[#FFF5EE] text-[#FF6B8A] text-[11px] font-semibold">
                    GRL {story.level || level} · {story.levelLabel}
                  </span>
                )}
              </p>
            </div>
            <button className="apple-button text-sm px-4 py-2.5 disabled:opacity-50"
                    disabled={generating} onClick={startIllustration}>
              🎨 按纲生图 / Start Illustrating
            </button>
          </div>

          {/* 13 项三步流程检查表（文档 6.5） */}
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-[#2D2D2D] mb-2">三步流程检查表（文档 6.5 · 13 项）</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-5">
              {threeStepChecks.map(c => (
                <div key={c.key} className="flex items-center gap-2 text-xs">
                  <span className={c.done ? 'text-[#FF6B8A]' : 'text-[#C8A2E8]'}>{c.done ? '✓' : '○'}</span>
                  <span className={c.done ? 'text-[#2D2D2D]' : 'text-[#8E8E93]'}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 单页大纲表（表A + 表B 摘要） */}
          <h3 className="text-sm font-semibold text-[#2D2D2D] mb-2">单页大纲表（表A + 表B）</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[440px] overflow-auto pr-1">
            {story.outline.map(p => (
              <div key={p.pageNumber} className="rounded-xl border border-[#E5E5EA] p-3 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#2D2D2D]">
                    #{p.pageNumber} · {FUNC_LABEL[p.pageFunction] || p.pageFunction}
                  </span>
                  <span className="text-[10px] text-[#C8A2E8]">{p.characterEmotion}</span>
                </div>
                <p className="text-xs text-[#2D2D2D] leading-relaxed">{p.pageText}</p>
                <p className="text-[10px] text-[#8E8E93] mt-1 leading-relaxed">
                  画面：{p.plotNode || p.coreVisualElements?.join('、')}
                </p>
                <p className="text-[10px] text-[#8E8E93] leading-relaxed">
                  排版：{p.composition || p.textWhitespace}
                </p>
                <p className="text-[10px] text-[#C8A2E8] mt-0.5 leading-relaxed">{p.visualStyle}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Illustrate（按纲生图：试生成 → 批量续跑 → 预览） */}
      {step === 'illustrate' && story && (
        <div className="space-y-6">
          {/* 实时进度 + 缩略图 + 续跑 */}
          <div className="apple-card p-8 text-center">
            {(!trialDone || generating) && <div className="bunny-bounce"><BunnyMascot size={72} /></div>}
            <h2 className="text-lg font-bold text-[#2D2D2D] mt-3">
              {!trialDone
                ? '试生成 4-5 页中…（先看效果，再决定续跑）'
                : generating ? '按 5 页一批续跑生成中…' : '试生成完成，请先确认效果'}
            </h2>
            <p className="text-sm text-[#8E8E93] mt-1 mb-4">
              本批 {genProgress ? `${genProgress.completed} / ${genProgress.total}` : '…'} · 整本已完成 {Object.keys(pageImages).length} / {story.outline.length} 页
            </p>

            {/* 本批进度条 */}
            <div className="w-full max-w-md mx-auto bg-[#F2F2F7] rounded-full h-3 mb-6">
              <div className="bunny-gradient h-3 rounded-full transition-all duration-500"
                   style={{ width: `${batchProgress}%` }} />
            </div>

            {/* 页面缩略图（按绝对页码） */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-w-2xl mx-auto">
              {story.outline.map(p => {
                const img = pageImages[p.pageNumber]
                const st = img ? 'done' : (statusByPage[p.pageNumber] || 'pending')
                return (
                  <div key={p.pageNumber}
                       className={`aspect-[3/4] rounded-xl flex items-center justify-center text-xs font-medium transition-all duration-500 ${
                         st === 'done' ? 'ring-2 ring-[#98D8C8]' :
                         st === 'generating' ? 'ring-2 ring-[#FF6B8A] animate-pulse' :
                         st === 'failed' ? 'ring-2 ring-red-300' : 'bg-[#F2F2F7] text-[#C8A2E8]'
                       }`}
                       style={img ? { backgroundImage: `url(${img})`, backgroundSize: 'cover' } : {}}>
                    {!img && (
                      <span>{st === 'generating' ? '✨' : st === 'failed' ? '⚠️' : p.pageNumber}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 试生成完成后的续跑按钮 */}
            {trialDone && (
              <div className="mt-6">
                {pendingPages.length > 0 ? (
                  <button className="apple-button text-sm px-6 py-3 disabled:opacity-50"
                          disabled={generating} onClick={continueBatches}>
                    {generating ? '生成中…' : `▶ 继续按 5 页一批生成（剩余 ${pendingPages.length} 页）`}
                  </button>
                ) : (
                  <p className="text-sm text-[#FF6B8A] font-semibold">🎉 整本绘本已全部生成</p>
                )}
              </div>
            )}
          </div>

          {/* 12 项生图检查表（文档 5.9） */}
          {trialDone && (
            <div className="apple-card p-8">
              <h3 className="text-sm font-semibold text-[#2D2D2D] mb-3">生图检查表（文档 5.9 · 12 项）</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {imageChecks.map(c => (
                  <div key={c.key}
                       className={`flex items-start gap-2 rounded-xl px-3 py-2 ${STATUS_BG[c.status]}`}>
                    <span className={`mt-0.5 font-bold ${STATUS_TEXT[c.status]}`}>{STATUS_ICON[c.status]}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#2D2D2D]">{c.label}</p>
                      <p className="text-[10px] text-[#8E8E93] leading-relaxed">{c.detail}</p>
                    </div>
                    {c.status === 'manual' && (
                      <label className="ml-auto flex items-center gap-1 text-[10px] text-[#8E8E93] cursor-pointer shrink-0">
                        <input type="checkbox" checked={!!manualChecks[c.key]}
                               onChange={e => setManualChecks(prev => ({ ...prev, [c.key]: e.target.checked }))} />
                        通过
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 预览：分级 + 图片 + 导出 */}
          {trialDone && (
            <div className="apple-card p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#2D2D2D]">{story.title}</h2>
                  <p className="text-sm text-[#8E8E93]">
                    {characters.map(c => c.name).join(' & ')} • {story.outline.length} pages • {ageGroup}
                    {story.levelLabel && (
                      <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full bg-[#FFF5EE] text-[#FF6B8A] text-[11px] font-semibold">
                        GRL {story.level || level} · {story.levelLabel}
                      </span>
                    )}
                    {story.vocabularyPassed === false && (
                      <span className="inline-flex items-center ml-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[11px]">
                        {story.vocabularyRatio}% above level — try Level {String.fromCharCode((story.level || 'C').charCodeAt(0) + 1)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {savedBookId && (
                    <Link href={`/book/${savedBookId}`}
                          className="apple-button text-sm px-4 py-2.5 flex-1 sm:flex-none">
                      📖 View Story
                    </Link>
                  )}
                  <button className="apple-button text-sm px-4 py-2.5 flex-1 sm:flex-none disabled:opacity-50"
                          disabled={loading} onClick={handleExportPDF}>
                    {loading ? '...' : '📄 Download PDF'}
                  </button>
                  <button className="apple-button-secondary text-sm px-4 py-2.5 flex-1 sm:flex-none disabled:opacity-50"
                          disabled={loading} onClick={handleExportVideo}>
                    {loading ? '...' : '🎬 Video'}
                  </button>
                </div>
              </div>

              {/* Full page grid with images（按绝对页码取图） */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {story.outline.map(p => {
                  const img = pageImages[p.pageNumber]
                  return (
                    <div key={p.pageNumber} className="apple-card p-2.5 text-center">
                      <div className="aspect-[3/4] rounded-xl mb-1.5 overflow-hidden bg-[#FFF5EE] flex items-center justify-center"
                           style={img ? { backgroundImage: `url(${img})`, backgroundSize: 'cover' } : {}}>
                        {!img && <span className="text-3xl text-[#C8A2E8]">{p.pageNumber}</span>}
                      </div>
                      <p className="text-[10px] text-[#8E8E93] leading-relaxed line-clamp-2">{p.pageText}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 理解小测验（分级整合：有 quiz 时展示） */}
          {trialDone && story.quiz?.questions?.length ? (
            <div className="apple-card p-8">
              <h3 className="text-sm font-semibold text-[#2D2D2D] mb-3">
                理解小测验 / Comprehension Quiz · {story.levelLabel || `GRL ${story.level || level}`}
              </h3>
              <div className="space-y-3">
                {story.quiz.questions.map((q, qi) => (
                  <div key={qi} className="rounded-xl border border-[#E5E5EA] p-3 bg-white">
                    <p className="text-sm font-medium text-[#2D2D2D]">{qi + 1}. {q.q}</p>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {q.options.map((opt, oi) => (
                        <div key={oi}
                             className={`text-xs rounded-lg px-2.5 py-1.5 ${
                               oi === q.answer ? 'bg-[#FFF5EE] text-[#FF6B8A] font-semibold' : 'bg-[#F2F2F7] text-[#8E8E93]'
                             }`}>
                          {String.fromCharCode(65 + oi)}. {opt}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#C8A2E8] mt-1">考察：{q.skill}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="text-center">
            <button className="apple-button-secondary text-sm px-6 py-3" onClick={resetAll}>
              ← Create Another Book
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
