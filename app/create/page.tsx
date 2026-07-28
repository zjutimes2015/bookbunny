'use client'

import { useState } from 'react'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import MultiCharacterManager from '@/components/MultiCharacterManager'

type Step = 'character' | 'story' | 'preview'

interface CharData {
  id: string
  name: string
  photoPreview?: string
  refSeed?: number
}

export default function CreatePage() {
  const [step, setStep] = useState<Step>('character')
  const [characters, setCharacters] = useState<CharData[]>([])
  const [story, setStory] = useState<{ title: string; pages: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [exportType, setExportType] = useState<'pdf' | 'video' | null>(null)
  const [theme, setTheme] = useState('')
  const [ageGroup, setAgeGroup] = useState('3-5')

  // Multi-character management
  const handleAddCharacter = async (name: string, photo?: File) => {
    const newChar: CharData = {
      id: `char_${Date.now()}`,
      name,
    }
    if (photo) {
      newChar.photoPreview = URL.createObjectURL(photo)
    }
    setCharacters([...characters, newChar])
  }

  const handleRemoveCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id))
  }

  const handleUpdateCharacter = (id: string, data: Partial<CharData>) => {
    setCharacters(characters.map(c => c.id === id ? { ...c, ...data } : c))
  }

  // Story generation
  const handleGenerateStory = async () => {
    if (!theme || characters.length === 0) return
    setLoading(true)
    try {
      const charNames = characters.map(c => c.name).join(', ')
      const res = await fetch('/api/create-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          ageGroup,
          characterName: charNames,
          pages: 20,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStory(data)
      setStep('preview')
    } catch (err: unknown) {
      alert('Story generation failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  // Export functions
  const handleExportPDF = async () => {
    if (!story) return
    setExportType('pdf')
    setLoading(true)
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: story.title,
          author: characters.map(c => c.name).join(' & '),
          pages: story.pages.map(p => ({
            text: p,
            characters: characters.map(c => c.name),
          })),
          size: '8.5x8.5',
        }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err: unknown) {
      alert('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
      setExportType(null)
    }
  }

  const handleExportVideo = async () => {
    if (!story) return
    setExportType('video')
    setLoading(true)
    try {
      const res = await fetch('/api/export-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: story.title,
          pages: story.pages,
        }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err: unknown) {
      alert('Video export failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
      setExportType(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Progress */}
      <div className="flex items-center justify-center gap-3 mb-10">
        {(['character', 'story', 'preview'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step === s ? 'bg-[#2D2D2D] text-white' :
              ['character', 'story', 'preview'].indexOf(step) >= i ? 'bg-[#FF6B8A] text-white' :
              'bg-[#F2F2F7] text-[#8E8E93]'
            }`}>
              {i + 1}
            </div>
            <span className={`text-sm font-medium ${step === s ? 'text-[#2D2D2D]' : 'text-[#8E8E93]'}`}>
              {s === 'character' ? 'Characters' : s === 'story' ? 'Story' : 'Preview'}
            </span>
            {i < 2 && <div className="w-8 h-px bg-[#E5E5EA]" />}
          </div>
        ))}
      </div>

      {/* Step 1: Characters (multi now) */}
      {step === 'character' && (
        <div className="apple-card p-8">
          <div className="text-center mb-6">
            <BunnyMascot size={60} />
            <h2 className="text-xl font-bold text-[#2D2D2D] mt-3">Create Your Characters</h2>
            <p className="text-sm text-[#8E8E93] mt-1">Add up to 5 characters for your story</p>
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
              <div>
                <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">Story Theme</label>
                <input
                  className="apple-input"
                  placeholder="e.g. A magical forest adventure, A trip to the moon..."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                />
              </div>
            )}

            {characters.length > 0 && (
              <div>
                <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">Age Group</label>
                <select className="apple-input" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                  <option value="0-3">Baby (0-3)</option>
                  <option value="3-5">Preschool (3-5)</option>
                  <option value="5-7">Early Reader (5-7)</option>
                  <option value="7-10">Chapter Book (7-10)</option>
                </select>
              </div>
            )}

            <button
              className="apple-button w-full text-center disabled:opacity-50"
              disabled={characters.length === 0 || !theme || loading}
              onClick={handleGenerateStory}
            >
              {loading ? '✍️ Writing Story...' : `✍️ Generate Story with ${characters.length} Character${characters.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Story generation status */}
      {step === 'story' && (
        <div className="apple-card p-8 text-center">
          <div className="bunny-bounce">
            <BunnyMascot size={80} />
          </div>
          <h2 className="text-xl font-bold text-[#2D2D2D] mt-4">Generating Your Story...</h2>
          <p className="text-sm text-[#8E8E93] mt-2">Creating a magical adventure for {characters.map(c => c.name).join(', ')}</p>
        </div>
      )}

      {/* Step 3: Preview with ALL exports */}
      {step === 'preview' && story && (
        <div className="space-y-6">
          <div className="apple-card p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#2D2D2D]">{story.title}</h2>
                <p className="text-sm text-[#8E8E93]">
                  Starring {characters.map(c => c.name).join(' & ')} • {story.pages.length} pages • {ageGroup} years
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  className="apple-button text-sm px-4 py-2.5 flex-1 sm:flex-none disabled:opacity-50"
                  disabled={loading && exportType === 'pdf'}
                  onClick={handleExportPDF}
                >
                  {loading && exportType === 'pdf' ? '...' : '📄 PDF'}
                </button>
                <button
                  className="apple-button-secondary text-sm px-4 py-2.5 flex-1 sm:flex-none disabled:opacity-50"
                  disabled={loading && exportType === 'video'}
                  onClick={handleExportVideo}
                >
                  {loading && exportType === 'video' ? '...' : '🎬 Video'}
                </button>
              </div>
            </div>

            {/* Story pages preview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {/* Cover */}
              <div className="apple-card p-3 text-center col-span-2">
                <div className="aspect-[4/3] rounded-xl mb-2 flex items-center justify-center flex-col bunny-gradient text-white">
                  <span className="text-4xl mb-2">📖</span>
                  <span className="font-bold text-lg px-2 text-center leading-tight">{story.title}</span>
                </div>
                <p className="text-xs text-[#8E8E93]">Cover</p>
              </div>

              {/* Pages */}
              {story.pages.slice(0, 12).map((page, i) => (
                <div key={i} className="apple-card p-2.5 text-center">
                  <div className="aspect-[3/4] bg-[#FFF5EE] rounded-xl mb-1.5 flex items-center justify-center relative overflow-hidden">
                    <span className="text-3xl text-[#C8A2E8]">{i + 1}</span>
                  </div>
                  <p className="text-[10px] text-[#8E8E93] leading-relaxed line-clamp-2">{page}</p>
                </div>
              ))}
              {story.pages.length > 12 && (
                <div className="apple-card p-2.5 text-center flex items-center justify-center">
                  <span className="text-sm text-[#8E8E93]">+{story.pages.length - 12} more pages</span>
                </div>
              )}
            </div>
          </div>

          {/* KDP tips */}
          <div className="apple-card p-6 bg-[#FFF5EE]/50">
            <h3 className="font-semibold text-[#2D2D2D] mb-2">📘 KDP Publishing Tips</h3>
            <ul className="text-sm text-[#8E8E93] space-y-1">
              <li>• Your PDF is already sized 8.5x8.5 with bleeds</li>
              <li>• Upload directly to Amazon KDP &gt; Paperback &gt; Upload Manuscript</li>
              <li>• Set trim size to 8.5x8.5 in KDP setup</li>
              <li>• Ready for both Kindle and print-on-demand</li>
            </ul>
          </div>

          <div className="text-center">
            <button
              className="apple-button-secondary text-sm px-6 py-3"
              onClick={() => {
                setStep('character')
                setStory(null)
                setTheme('')
              }}
            >
              ← Create Another Book
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
