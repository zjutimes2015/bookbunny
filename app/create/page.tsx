'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import MultiCharacterManager from '@/components/MultiCharacterManager'
import TurnstileWidget from '@/components/TurnstileWidget'

type Step = 'characters' | 'story' | 'generating' | 'preview'

interface CharData {
  id: string
  name: string
  photoPreview?: string
  refSeed?: number
}

export default function CreatePage() {
  const [step, setStep] = useState<Step>('characters')
  const [characters, setCharacters] = useState<CharData[]>([])
  const [story, setStory] = useState<{ title: string; pages: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileError, setTurnstileError] = useState(false)

  // Generation state
  const [genId, setGenId] = useState<string | null>(null)
  const [genProgress, setGenProgress] = useState<{
    total: number; completed: number; pages: { index: number; status: string; imageB64?: string }[]
  } | null>(null)
  const [pageImages, setPageImages] = useState<(string | null)[]>([])

  const [theme, setTheme] = useState('')
  const [ageGroup, setAgeGroup] = useState('3-5')

  // Multi-character
  const handleAddCharacter = async (name: string, photo?: File) => {
    const newChar: CharData = { id: `char_${Date.now()}`, name }
    if (photo) newChar.photoPreview = URL.createObjectURL(photo)
    setCharacters([...characters, newChar])
  }

  const handleRemoveCharacter = (id: string) =>
    setCharacters(characters.filter(c => c.id !== id))

  const handleUpdateCharacter = (id: string, data: Partial<CharData>) =>
    setCharacters(characters.map(c => c.id === id ? { ...c, ...data } : c))

  // Story generation
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
        body: JSON.stringify({ theme, ageGroup, characterName: charNames, pages: 20 }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStory(data)
      setStep('generating')
      // Auto-start illustration generation
      startGeneration(data)
    } catch (err: unknown) {
      alert('Failed: ' + (err instanceof Error ? err.message : 'Error'))
    } finally {
      setLoading(false)
    }
  }

  // Start FLUX image generation for all pages
  const startGeneration = async (storyData: { title: string; pages: string[] }) => {
    try {
      const res = await fetch('/api/generate-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: storyData.title,
          pages: storyData.pages,
          characterImageB64: null, // V1: no reference yet
          refSeed: null,
          style: 'childrens book illustration, soft watercolor, warm colors',
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGenId(data.genId)
    } catch (err: unknown) {
      alert('Generation failed: ' + (err instanceof Error ? err.message : 'Error'))
    }
  }

  // Poll generation progress
  useEffect(() => {
    if (!genId) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate-pages?genId=${genId}`)
        const data = await res.json()
        setGenProgress(data)

        // Update page images as they arrive
        const images: (string | null)[] = []
        for (const p of data.pages || []) {
          images[p.index] = p.imageB64 ? `data:image/png;base64,${p.imageB64}` : null
        }
        setPageImages(images)

        if (data.status === 'done' || data.status === 'error') {
          clearInterval(interval)
          setTimeout(() => setStep('preview'), 500)
        }
      } catch {}
    }, 1500) // Poll every 1.5s

    return () => clearInterval(interval)
  }, [genId])

  // Export PDF with real images
  const handleExportPDF = async () => {
    if (!story) return
    setLoading(true)
    try {
      const pagesWithImages = story.pages.map((text, i) => ({
        text,
        imageB64: pageImages[i]?.split(',')[1],
        characters: characters.map(c => c.name),
      }))
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: story.title,
          author: characters.map(c => c.name).join(' & '),
          pages: pagesWithImages,
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
        body: JSON.stringify({ title: story.title, pages: story.pages }),
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

  const progress = genProgress
    ? Math.round((genProgress.completed / genProgress.total) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-3 mb-10">
        {(['characters', 'story', 'generating', 'preview'] as Step[]).map((s, i) => {
          const steps = ['characters', 'story', 'generating', 'preview']
          const currentIdx = steps.indexOf(step)
          const isActive = step === s
          const isDone = steps.indexOf(s) <= currentIdx && s !== 'generating'
          return (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                isActive ? 'bg-[#2D2D2D] text-white' :
                isDone ? 'bg-[#FF6B8A] text-white' : 'bg-[#F2F2F7] text-[#8E8E93]'
              }`}>{i + 1}</div>
              <span className={`text-sm font-medium ${isActive ? 'text-[#2D2D2D]' : 'text-[#8E8E93]'}`}>
                {s === 'characters' ? 'Characters' : s === 'generating' ? 'Illustrating' : s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {i < 3 && <div className="w-6 h-px bg-[#E5E5EA]" />}
            </div>
          )
        })}
      </div>

      {/* Step 1: Characters */}
      {step === 'characters' && (
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
                {turnstileError && (
                  <p className="text-xs text-red-400 text-center">Please complete the verification</p>
                )}
                <TurnstileWidget
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileError(true)}
                  className="my-3"
                />
                <button className="apple-button w-full disabled:opacity-50" disabled={!theme || loading}
                        onClick={handleGenerateStory}>
                  {loading ? '✨ Generating...' : `✨ Create Book with ${characters.length} Character${characters.length > 1 ? 's' : ''}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Generating Illustrations */}
      {step === 'generating' && (
        <div className="apple-card p-8 text-center">
          <div className="bunny-bounce"><BunnyMascot size={80} /></div>
          <h2 className="text-xl font-bold text-[#2D2D2D] mt-4">Painting Your Story...</h2>
          <p className="text-sm text-[#8E8E93] mt-1 mb-6">
            {genProgress ? `Page ${genProgress.completed} of ${genProgress.total}` : 'Starting...'}
          </p>

          {/* Progress bar */}
          <div className="w-full max-w-md mx-auto bg-[#F2F2F7] rounded-full h-3 mb-8">
            <div className="bunny-gradient h-3 rounded-full transition-all duration-500"
                 style={{ width: `${progress}%` }} />
          </div>

          {/* Page thumbnail grid - real images appear as they generate */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-w-2xl mx-auto">
            {(genProgress?.pages || Array(20).fill({ status: 'pending' })).map((p: any, i: number) => (
              <div key={i} className={`aspect-[3/4] rounded-xl flex items-center justify-center text-xs font-medium transition-all duration-500 ${
                p.status === 'done' ? 'ring-2 ring-[#98D8C8]' :
                p.status === 'generating' ? 'ring-2 ring-[#FF6B8A] animate-pulse' :
                p.status === 'failed' ? 'ring-2 ring-red-300' :
                'bg-[#F2F2F7] text-[#C8A2E8]'
              }`}
                   style={pageImages[i] ? { backgroundImage: `url(${pageImages[i]})`, backgroundSize: 'cover' } : {}}>
                {!pageImages[i] && (
                  <span>{p.status === 'pending' ? i + 1 : p.status === 'generating' ? '✨' : p.status === 'failed' ? '⚠️' : i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Preview with real images */}
      {step === 'preview' && story && (
        <div className="space-y-6">
          <div className="apple-card p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#2D2D2D]">{story.title}</h2>
                <p className="text-sm text-[#8E8E93]">
                  {characters.map(c => c.name).join(' & ')} • {story.pages.length} pages • {ageGroup}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
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

            {/* Full page grid with images */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {/* Cover */}
              <div className="apple-card p-3 text-center col-span-2 sm:col-span-1">
                <div className="aspect-[3/4] rounded-xl mb-2 flex items-center justify-center flex-col bunny-gradient text-white">
                  <span className="text-3xl mb-1">📖</span>
                  <span className="font-bold text-sm px-1 text-center">{story.title}</span>
                </div>
                <p className="text-[10px] text-[#8E8E93]">Cover</p>
              </div>

              {/* Pages with real images */}
              {story.pages.map((page, i) => (
                <div key={i} className="apple-card p-2.5 text-center">
                  <div className="aspect-[3/4] rounded-xl mb-1.5 overflow-hidden bg-[#FFF5EE] flex items-center justify-center relative"
                       style={pageImages[i] ? { backgroundImage: `url(${pageImages[i]})`, backgroundSize: 'cover' } : {}}>
                    {!pageImages[i] && <span className="text-3xl text-[#C8A2E8]">{i + 1}</span>}
                  </div>
                  <p className="text-[10px] text-[#8E8E93] leading-relaxed line-clamp-2">{page}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button className="apple-button-secondary text-sm px-6 py-3"
                    onClick={() => { setStep('characters'); setStory(null); setPageImages([]); setGenProgress(null) }}>
              ← Create Another Book
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
