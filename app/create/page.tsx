'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import MultiCharacterManager from '@/components/MultiCharacterManager'
import ParentalConsentGate from '@/components/ParentalConsentGate'
import TurnstileWidget from '@/components/TurnstileWidget'
import AIPromptBox from '@/components/AIPromptBox'
import type { PageOutline, StyleCard, StyleLexicon, CharacterCard, AspectRatio, BookLanguage } from '@/lib/types/book'
import { ASPECT_OPTIONS, BOOK_LANGUAGES, DEFAULT_BOOK_LANGUAGE } from '@/lib/types/book'
import { STYLE_LIBRARY } from '@/data/style-library'
import { runImageChecks, runThreeStepChecks } from '@/lib/page-checks'
import { buildInteriorPdf, buildCoverPdf, type KdpPageInput } from '@/lib/kdp/export'
import { KDP_TRIM, padToKdpPageCount, interiorDimsIn, coverDimsIn } from '@/lib/kdp/spec'
import { KdpChecklist } from '@/components/KdpChecklist'
import { useAuth } from '@/lib/auth-context'
import { analyzeStoryForGRL, type GrlReport } from '@/lib/grl/analyzer'

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

/** Page function labels (English — reader-facing) */
const FUNC_LABEL: Record<string, string> = {
  cover: 'Cover', 'front-matter': 'Front Matter', body: 'Body', 'back-cover': 'Back Cover',
}

/** Quick-start story ideas for the AI prompt box (English — reader-facing) */
const THEME_IDEAS = [
  'A magical forest adventure',
  'A journey to the moon',
  'A shy dragon learns to share',
  'A bedtime story under the sea',
]

/** KDP 裁切尺寸选项（以 lib/kdp/spec 为唯一来源） */
const TRIM_OPTIONS = Object.entries(KDP_TRIM).map(([id, t]) => ({ id, label: `${t.w} × ${t.h} in` }))

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

// KDP 导出：文件名 slug 化（仅 ASCII，避免中文/特殊字符）
function slugify(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'book'
}

// 触发浏览器下载（不依赖 Node fs，纯客户端）
function downloadBytes(bytes: Uint8Array, filename: string) {
  // pdf-lib 的 Uint8Array 在 TS 5.7 下不能直接作为 BlobPart，需转成纯 ArrayBuffer
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const blob = new Blob([buffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function CreatePage() {
  const { user } = useAuth()
  // 套餐页数上限：Free 8 / Starter 12 / Creator 20 / Studio 24
  const tier = user?.subscriptionTier
  const maxPages =
    tier === 'studio' || tier === 'commercial' ? 24 : tier === 'creator' ? 20 : tier === 'starter' ? 12 : 8
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

  // 家长同意：无生效同意时不得上传儿童照片
  const [photoConsent, setPhotoConsent] = useState(false)
  const [consentBlocked, setConsentBlocked] = useState(false)

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
  const [grlOpen, setGrlOpen] = useState(false)
  const [grlReport, setGrlReport] = useState<GrlReport | null>(null)

  const [theme, setTheme] = useState('')
  const [ageGroup, setAgeGroup] = useState('3-5')
  const [level, setLevel] = useState('C')
  const [pageCount, setPageCount] = useState(20) // 第一步：页数
  const effectivePages = Math.min(pageCount, maxPages)

  // 绘本内容语言（出海默认英语，一本只用一种语言）
  const [language, setLanguage] = useState<BookLanguage>(DEFAULT_BOOK_LANGUAGE)

  // 规格层（阶段3）：画幅比例 + 宝宝照片方案
  const [aspect, setAspect] = useState<AspectRatio>('1:1')
  const [photoUsage, setPhotoUsage] = useState<'illustrated' | 'photo-family' | 'photo-public'>('illustrated')

  // KDP 印刷规格：裁切尺寸（决定内页尺寸与封面书脊宽度）
  const [trim, setTrim] = useState('8.5x8.5')

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
        body: JSON.stringify({ styleId: id, ageGroup, theme, language }),
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

  // 人机校验通行证：Turnstile token 是一次性的，先换成 2 小时有效的 bb_human cookie，
  // 后续 create-character / create-story / generate-pages 都靠这张 cookie 通过服务端校验。
  // token 同时存 ref：子组件可能在首次渲染时就缓存了回调，读 state 会拿到旧值。
  const turnstileTokenRef = useRef<string | null>(null)
  const humanPassed = useRef(false)
  const ensureHumanPass = async (): Promise<boolean> => {
    if (humanPassed.current) return true
    const token = turnstileTokenRef.current || turnstileToken
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
    } catch { /* 网络异常走下面的失败分支 */ }
    return false
  }

  // Multi-character：加入后立即生成「角色设定卡 + 一致性固定句 + 角色参考图」
  const handleAddCharacter = async (name: string, photo?: File) => {
    // 儿童照片属于个人信息：没有生效的家长同意就绝不处理。
    if (photo && !photoConsent) {
      setConsentBlocked(true)
      return
    }
    setConsentBlocked(false)
    if (!(await ensureHumanPass())) {
      setTurnstileError(true)
      return
    }
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
      fd.append('language', language)
      fd.append('turnstileToken', turnstileToken || '')
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

    // 人机校验：token 已换成 bb_human cookie，这里只需确认已通过
    if (!(await ensureHumanPass())) {
      setTurnstileError(true)
      return
    }
    setTurnstileError(false)

    setLoading(true)
    try {
      const charNames = characters.map(c => c.name).join(', ')
      const res = await fetch('/api/create-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme, ageGroup, characterName: charNames, pages: effectivePages, level,
          language,
          styleLexicon, styleCard,
          characterCards: characters.map(c => c.card).filter(Boolean), // 阶段3：角色一致性
          turnstileToken: turnstileToken || '', // cookie 缺失时的兜底
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStory(data)
      setStep('outline')

      // 生成 GRL 可解释报告（异步，不阻塞主流程）
      if (data.level && Array.isArray(data.outline)) {
        const fullText = data.outline
          .map((p: PageOutline) => p.pageText || '')
          .join(' ')
        try {
          const report = analyzeStoryForGRL(fullText, data.level)
          setGrlReport(report)
        } catch {
          setGrlReport(null)
        }
      }
    } catch (err: unknown) {
      alert('Failed: ' + (err instanceof Error ? err.message : 'Error'))
    } finally {
      setLoading(false)
    }
  }

  // 提交一批（子集）生图并轮询；按绝对页码 p.index 合并到整本图片数组
  const runBatch = async (subset: PageOutline[], bookId: string | null) => {
    if (!story || subset.length === 0) return
    try {
      const res = await fetch('/api/generate-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: story.title,
          outline: subset,                              // 子集：带真实 pageNumber
          bookId,                                       // 服务端据此把图片写入 R2 与 books.page_image_urls
          characterImageB64: refChar?.imageB64 || null, // 阶段3：参考图
          refSeed: refChar?.refSeed || null,
          consistencyLine,                              // 阶段3：每页注入
          aspect,                                       // 阶段3：画幅比例
          styleLexicon,
          language,
          turnstileToken: turnstileToken || '',          // cookie 缺失时的兜底
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Generation failed')
      const gid: string = data.genId

      await new Promise<void>((resolve) => {
        const interval = setInterval(async () => {
          try {
            const r = await fetch(`/api/generate-pages?genId=${gid}`)
            const d = await r.json()
            setGenProgress(d)
            // index 已是绝对页码，直接合并（R2 模式返回 URL，未配置 R2 时回退 base64）
            setPageImages(prev => {
              const next = { ...prev }
              for (const p of d.pages || []) {
                if (p.imageB64) next[p.index] = `data:image/png;base64,${p.imageB64}`
                else if (p.imageUrl) next[p.index] = p.imageUrl
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
    // 先落库拿到 bookId，生图期间即可把图片写入 R2 与 books.page_image_urls
    const bookId = savedBookId || await saveBook()
    const trialNums = pickTrialPages(story.outline)
    const trialSet = new Set(trialNums)
    setPendingPages(story.outline.map(p => p.pageNumber).filter(n => !trialSet.has(n)))
    await runBatch(story.outline.filter(p => trialSet.has(p.pageNumber)), bookId)
    setTrialDone(true)
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
      await runBatch(story.outline.filter(p => batch.includes(p.pageNumber)), savedBookId)
      setPendingPages(remaining)
    }
    setGenerating(false)
  }

  // Save the generated story + book to the database（返回 bookId 供生图持久化使用）
  const saveBook = async (): Promise<string | null> => {
    if (!story || savedBookId) return savedBookId
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
          language,
        }),
      })
      const data = await res.json()
      if (data.bookId) {
        setSavedBookId(data.bookId)
        return data.bookId as string
      }
    } catch (err) {
      console.warn('Save book failed (non-blocking):', err)
    }
    return null
  }

  /** 把 R2 图片 URL 转成 data URL，供客户端 PDF 导出使用 */
  const hydrateImages = async (images: Record<number, string>): Promise<Record<number, string>> => {
    const entries = Object.entries(images).filter(([, v]) => !v.startsWith('data:'))
    if (entries.length === 0) return images

    const next = { ...images }
    await Promise.all(
      entries.map(async ([key, url]) => {
        try {
          const res = await fetch(url)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const blob = await res.blob()
          const dataUrl: string = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(blob)
          })
          next[Number(key)] = dataUrl
        } catch (err) {
          console.warn('Image hydrate failed:', url, err)
        }
      }),
    )
    setPageImages(next)
    return next
  }

  // 由页面 outline + 已生成的 pageImages 构造 KdpPageInput[]（images key 为绝对页码）
  const buildPageInputs = (images: Record<number, string> = pageImages): KdpPageInput[] => {
    if (!story) return []
    const byNum = new Map(story.outline.map(p => [p.pageNumber, p]))
    const maxOutline = story.outline.reduce((m, p) => Math.max(m, p.pageNumber), 0)
    const maxImage = Object.keys(images).reduce((m, k) => Math.max(m, Number(k) || 0), 0)
    const maxNo = Math.max(maxOutline, maxImage, 1)
    const inputs: KdpPageInput[] = []
    for (let n = 1; n <= maxNo; n++) {
      inputs.push({ text: byNum.get(n)?.pageText, imageDataUrl: images[n] })
    }
    return inputs
  }

  // KDP 成品尺寸提示（导出区展示；几何全部来自 lib/kdp/spec）
  const kdpPageCount = padToKdpPageCount(buildPageInputs().length)
  const interiorIn = interiorDimsIn(trim)
  const coverIn = coverDimsIn(trim, kdpPageCount)

  // 导出权限：Starter 及以上导出内页，Creator 及以上导出 KDP 封面
  const canExport = !!user && (user.isPaid || (tier !== undefined && tier !== 'free'))
  const canKdp = !!user && (tier === 'creator' || tier === 'studio' || tier === 'commercial')

  const requirePlan = (allowed: boolean, message: string) => {
    if (allowed) return true
    if (confirm(`${message}\n\nView plans?`)) window.location.href = '/pricing'
    return false
  }

  // Export KDP-ready interior PDF — generated in the browser (images live client-side)
  const handleExportPDF = async () => {
    if (!story) return
    if (!requirePlan(canExport, 'PDF export is available on Starter and above.')) return
    setLoading(true)
    try {
      const images = await hydrateImages(pageImages)
      const author = characters.map(c => c.name).join(' & ')
      const bytes = await buildInteriorPdf({
        title: story.title,
        author,
        pages: buildPageInputs(images),
        trim,
        paper: 'white',
      })
      downloadBytes(bytes, `${slugify(story.title)}-interior.pdf`)
    } catch (err: unknown) {
      alert('Export failed: ' + (err instanceof Error ? err.message : 'Error'))
    } finally {
      setLoading(false)
    }
  }

  // Export KDP-ready full cover PDF (back cover + spine + front cover)
  const handleExportCover = async () => {
    if (!story) return
    if (!requirePlan(canKdp, 'KDP interior + cover PDFs are available on Creator and above.')) return
    setLoading(true)
    try {
      const images = await hydrateImages(pageImages)
      const author = characters.map(c => c.name).join(' & ')
      const pages = buildPageInputs(images)
      const coverPage = story.outline.find(p => p.pageFunction === 'cover')
      const backPage = story.outline.find(p => p.pageFunction === 'back-cover')
      const bytes = await buildCoverPdf({
        title: story.title,
        author,
        pages: padToKdpPageCount(pages.length),
        trim,
        paper: 'white',
        frontImageDataUrl: coverPage ? images[coverPage.pageNumber] : undefined,
        backImageDataUrl: backPage ? images[backPage.pageNumber] : undefined,
        blurb: backPage?.pageText,
      })
      downloadBytes(bytes, `${slugify(story.title)}-cover.pdf`)
    } catch (err: unknown) {
      alert('Cover export failed: ' + (err instanceof Error ? err.message : 'Error'))
    } finally {
      setLoading(false)
    }
  }

  // ==== 启发 #3: Web Speech + 漫画分镜导出 ====

  /** 朗读整本书（Web Speech API） */
  const handleListen = () => {
    if (!story) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Sorry, your browser does not support text-to-speech. Try Chrome or Edge.')
      return
    }
    window.speechSynthesis.cancel() // 停止之前的朗读
    const pages = story.outline.filter(p => p.pageFunction === 'body')
    for (const page of pages) {
      const text = page.pageText || ''
      if (!text.trim()) continue
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 0.9
      u.pitch = 1.0
      u.lang = language === 'zh' ? 'zh-CN' : 'en-US'
      window.speechSynthesis.speak(u)
    }
  }

  /** 取消朗读 */
  const handleStopListen = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  /** 导出漫画分镜：每页图片 + 文本 → 批量下载 */
  const handleExportComicPages = async () => {
    if (!story) return
    const pages = story.outline.filter(p => p.pageFunction !== 'cover')
    if (pages.length === 0) return
    setLoading(true)
    try {
      // 1. 下载每页图片（如果有图片的话）
      for (const page of pages) {
        const imgData = pageImages[page.pageNumber]
        if (imgData) {
          const a = document.createElement('a')
          a.href = imgData
          a.download = `${slugify(story.title)}-page-${String(page.pageNumber).padStart(2, '0')}.png`
          document.body.appendChild(a)
          a.click()
          a.remove()
          await new Promise(r => setTimeout(r, 200)) // 避免浏览器拦截批量下载
        }
      }
      // 2. 同时导出一个文本脚本（家长可用任何 TTS 朗读）
      const scriptText = story.outline
        .filter(p => p.pageFunction === 'body')
        .map(p => `[Page ${p.pageNumber}]\n${p.pageText || ''}`)
        .join('\n\n')
      const blob = new Blob([`🎙️ Listen to "${story.title}"\n\n${scriptText}`], { type: 'text/plain' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${slugify(story.title)}-listen-script.txt`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (err: unknown) {
      alert('Export failed: ' + (err instanceof Error ? err.message : 'Error'))
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
    pages: effectivePages,
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
          <ParentalConsentGate onConsentChange={setPhotoConsent} />
          {consentBlocked && (
            <p className="text-xs text-red-500 text-center mb-4">
              Parental consent is required before a photograph of your child can be used. Complete the
              step above, or add the character without a photo.
            </p>
          )}
          {/* 人机校验组件必须常驻：第一个角色的创建请求也要带通行证 */}
          <TurnstileWidget
            onVerify={(token) => {
              turnstileTokenRef.current = token
              setTurnstileToken(token)
            }}
            onExpire={() => {
              turnstileTokenRef.current = null
              setTurnstileToken(null)
            }}
            onError={() => setTurnstileError(true)}
            className="my-3"
          />
          {turnstileError && (
            <p className="text-xs text-red-400 text-center mb-3">Please complete the verification</p>
          )}
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
                  <AIPromptBox
                    value={theme}
                    onChange={setTheme}
                    placeholder="e.g. A magical forest adventure..."
                    suggestions={THEME_IDEAS}
                  />
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
                  <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">Book Language</label>
                  <select className="apple-input" value={language}
                          onChange={(e) => setLanguage(e.target.value as BookLanguage)}>
                    {BOOK_LANGUAGES.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.nativeLabel && l.nativeLabel !== l.label ? `${l.label} · ${l.nativeLabel}` : l.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#8E8E93] mt-1.5">
                    One book uses a single language — the story text is written in it.
                  </p>
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
                  <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">Picture-Book Style</label>
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
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#8E8E93] mt-1.5">
                    {styleLoading
                      ? 'Applying style...'
                      : styleCard
                        ? `${styleCard.mainStyle} · ${styleCard.colorMood}`
                        : 'Pick ONE main style for the whole book'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">Page Count</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[8, 12, 20, 24].map(n => {
                      const locked = n > maxPages
                      return (
                        <button
                          key={n}
                          type="button"
                          disabled={locked}
                          onClick={() => !locked && setPageCount(n)}
                          title={locked ? `Upgrade your plan for ${n}-page books` : undefined}
                          className={`rounded-xl border px-2 py-2 text-center transition-all ${
                            locked
                              ? 'border-[#F2F2F7] bg-[#FAFAFB] opacity-45 cursor-not-allowed'
                              : effectivePages === n
                              ? 'border-[#FF6B8A] bg-[#FFF5EE] ring-1 ring-[#FF6B8A]'
                              : 'border-[#E5E5EA] bg-white hover:border-[#C8A2E8]'
                          }`}
                        >
                          <span className="block text-sm font-bold text-[#2D2D2D]">{n}</span>
                          <span className="block text-[10px] text-[#8E8E93]">
                            {locked ? 'upgrade' : n === 20 ? 'pages · Recommended' : 'pages'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">Aspect Ratio</label>
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
                  <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">Photo Policy</label>
                  <select className="apple-input" value={photoUsage}
                          onChange={(e) => setPhotoUsage(e.target.value as typeof photoUsage)}>
                    <option value="illustrated">Option A · No real photo (privacy-safe, commercial use)</option>
                    <option value="photo-family">Option B · Real photo · Family use only</option>
                    <option value="photo-public">Option B · Real photo · Public sharing</option>
                  </select>
                  <p className="text-[11px] text-[#8E8E93] mt-1.5">
                    Option A builds an illustrated character from name + theme. Option B uses your baby's photo as an AI reference image (note the privacy scope).
                  </p>
                </div>
                <button className="apple-button w-full disabled:opacity-50"
                        disabled={!theme || characters.length === 0 || loading}
                        onClick={handleGenerateStory}>
                  {loading ? '✨ Generating...' : '✨ Generate Outline'}
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
              🎨 Start Illustrating
            </button>
          </div>

          {/* 13 项三步流程检查表（文档 6.5） */}
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-[#2D2D2D] mb-2">Three-Step Checklist (Doc 6.5 · 13 items)</h3>
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
          <h3 className="text-sm font-semibold text-[#2D2D2D] mb-2">Page-by-Page Outline (Table A + Table B)</h3>
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
                  Visual: {p.plotNode || p.coreVisualElements?.join(', ')}
                </p>
                <p className="text-[10px] text-[#8E8E93] leading-relaxed">
                  Layout: {p.composition || p.textWhitespace}
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
                ? 'Generating a 4-5 page trial… (review first, then continue)'
                : generating ? 'Continuing in batches of 5 pages…' : 'Trial ready — please review the result'}
            </h2>
            <p className="text-sm text-[#8E8E93] mt-1 mb-4">
              This batch {genProgress ? `${genProgress.completed} / ${genProgress.total}` : '…'} · Book {Object.keys(pageImages).length} / {story.outline.length} pages done
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
                    {generating ? 'Generating…' : `▶ Continue in batches of 5 pages (${pendingPages.length} pages left)`}
                  </button>
                ) : (
                  <p className="text-sm text-[#FF6B8A] font-semibold">🎉 The whole book is generated</p>
                )}
              </div>
            )}
          </div>

          {/* 12 项生图检查表（文档 5.9） */}
          {trialDone && (
            <div className="apple-card p-8">
              <h3 className="text-sm font-semibold text-[#2D2D2D] mb-3">Image Checklist (Doc 5.9 · 12 items)</h3>
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
                        Pass
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
                  {/* GRL 可解释报告展开面板 */}
                  {grlReport && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setGrlOpen(v => !v)}
                        className="text-xs font-medium text-[#FF6B8A] hover:text-[#e05877] underline-offset-2 hover:underline"
                      >
                        {grlOpen ? 'Hide' : 'Show'} GRL {grlReport.grl} Readability Report (score: {grlReport.overallScore}/100)
                      </button>
                      {grlOpen && (
                        <div className="mt-3 p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5EA]">
                          {/* Verdict */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              grlReport.overallVerdict === 'excellent' ? 'bg-[#3E9C7A]' :
                              grlReport.overallVerdict === 'good' ? 'bg-[#4EA3F5]' :
                              grlReport.overallVerdict === 'fair' ? 'bg-amber-500' : 'bg-[#FF6B8A]'
                            }`}>
                              {grlReport.overallVerdict === 'excellent' ? 'A' :
                               grlReport.overallVerdict === 'good' ? 'B' :
                               grlReport.overallVerdict === 'fair' ? 'C' : 'D'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[#2D2D2D]">
                                {grlReport.overallVerdict === 'excellent' ? 'Excellent match' :
                                 grlReport.overallVerdict === 'good' ? 'Good match' :
                                 grlReport.overallVerdict === 'fair' ? 'Fair — consider simpler words' : 'Needs revision'}
                              </div>
                              <div className="text-xs text-[#8E8E93]">
                                GRL {grlReport.grl} · ages {grlReport.ageRange}
                              </div>
                            </div>
                          </div>

                          {/* Dimensions bar */}
                          <div className="space-y-2 mb-3">
                            {grlReport.dimensions.map(d => (
                              <div key={d.name}>
                                <div className="flex justify-between text-xs text-[#555] mb-0.5">
                                  <span>{d.name}</span>
                                  <span className="text-[#8E8E93]">{d.actual} / {d.target}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-[#E5E5EA] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      d.score >= 80 ? 'bg-[#3E9C7A]' : d.score >= 60 ? 'bg-[#4EA3F5]' : d.score >= 40 ? 'bg-amber-500' : 'bg-[#FF6B8A]'
                                    }`}
                                    style={{ width: `${d.score}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Over-level words */}
                          {grlReport.overLevelWords.length > 0 && (
                            <div className="mb-3">
                              <div className="text-xs font-medium text-[#2D2D2D] mb-1">Advanced words ({grlReport.overLevelWords.length}):</div>
                              <div className="flex flex-wrap gap-1">
                                {grlReport.overLevelWords.slice(0, 12).map(w => (
                                  <span key={w} className="px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700">{w}</span>
                                ))}
                                {grlReport.overLevelWords.length > 12 && (
                                  <span className="text-[10px] text-[#8E8E93]">+{grlReport.overLevelWords.length - 12} more</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Top words */}
                          <div>
                            <div className="text-xs font-medium text-[#2D2D2D] mb-1">Most-used words:</div>
                            <div className="flex flex-wrap gap-1">
                              {grlReport.topWords.slice(0, 8).map(w => (
                                <span key={w.word} className="px-1.5 py-0.5 text-[10px] rounded bg-[#F2F2F7] text-[#555]">{w.word} ×{w.count}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                          disabled={loading} onClick={handleExportCover}>
                    {loading ? '...' : '🖼️ Download KDP Cover'}
                  </button>
                  <button className="apple-button-secondary text-sm px-4 py-2.5 flex-1 sm:flex-none disabled:opacity-50"
                          disabled={loading} onClick={handleListen}>
                    🔊 Listen
                  </button>
                  <button className="apple-button-secondary text-sm px-4 py-2.5 flex-1 sm:flex-none disabled:opacity-50"
                          disabled={loading} onClick={handleExportComicPages}>
                    {loading ? '...' : '📚 Comic Pages'}
                  </button>
                </div>
              </div>

              {/* KDP print spec（裁切尺寸 + 成品尺寸提示，几何来自 lib/kdp/spec） */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 pb-6 border-b border-[#E5E5EA]">
                <label htmlFor="kdp-trim" className="text-sm font-medium text-[#2D2D2D]">Print size</label>
                <select id="kdp-trim" name="kdp-trim" className="apple-input w-auto"
                        value={trim} onChange={(e) => setTrim(e.target.value)}>
                  {TRIM_OPTIONS.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
                <span className="text-xs text-[#8E8E93]">
                  Interior {interiorIn.widthIn.toFixed(2)} × {interiorIn.heightIn.toFixed(2)} in (incl. bleed)
                  {' · '}{kdpPageCount} pages
                  {' · '}cover {coverIn.widthIn.toFixed(2)} × {coverIn.heightIn.toFixed(2)} in
                </span>
              </div>

              {/* KDP upload checklist — auto-validates against Amazon KDP requirements */}
              <div className="mb-6">
                <KdpChecklist
                  trimKey={trim}
                  pageCount={story.outline.length}
                  title={story.title}
                  paper="white"
                />
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
                Comprehension Quiz · {story.levelLabel || `GRL ${story.level || level}`}
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
                    <p className="text-[10px] text-[#C8A2E8] mt-1">Skill: {q.skill}</p>
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
