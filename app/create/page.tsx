'use client'

import { useState } from 'react'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'

type Step = 'character' | 'story' | 'preview'

export default function CreatePage() {
  const [step, setStep] = useState<Step>('character')
  const [character, setCharacter] = useState<{ name: string; imageB64: string; refSeed: number } | null>(null)
  const [story, setStory] = useState<{ title: string; pages: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [theme, setTheme] = useState('')
  const [ageGroup, setAgeGroup] = useState('3-5')
  const [charName, setCharName] = useState('')

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setCharName(file.name.split('.')[0] || 'My Hero')
  }

  const handleCreateCharacter = async () => {
    if (!photoFile) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('photo', photoFile)
      formData.append('name', charName)

      const res = await fetch('/api/create-character', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCharacter(data)
      setStep('story')
    } catch (err: unknown) {
      alert('Character creation failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateStory = async () => {
    if (!theme || !character) return
    setLoading(true)
    try {
      const res = await fetch('/api/create-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          ageGroup,
          characterName: character.name,
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
              {s === 'character' ? 'Character' : s === 'story' ? 'Story' : 'Preview'}
            </span>
            {i < 2 && <div className="w-8 h-px bg-[#E5E5EA]" />}
          </div>
        ))}
      </div>

      {/* Step 1: Character */}
      {step === 'character' && (
        <div className="apple-card p-8">
          <div className="text-center mb-6">
            <BunnyMascot size={60} />
            <h2 className="text-xl font-bold text-[#2D2D2D] mt-3">Create Your Character</h2>
            <p className="text-sm text-[#8E8E93] mt-1">Upload a photo or describe your hero</p>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#E5E5EA] rounded-2xl p-8 text-center hover:border-[#FF6B8A] transition-colors cursor-pointer"
                 onClick={() => document.getElementById('photo-upload')?.click()}>
              {photoFile ? (
                <div className="space-y-2">
                  <div className="w-20 h-20 rounded-2xl bg-[#FFF5EE] flex items-center justify-center mx-auto text-3xl">
                    📸
                  </div>
                  <p className="text-sm font-medium text-[#2D2D2D]">{photoFile.name}</p>
                  <p className="text-xs text-[#8E8E93]">{(photoFile.size / 1024).toFixed(0)} KB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-20 h-20 rounded-2xl bg-[#F2F2F7] flex items-center justify-center mx-auto text-3xl">
                    🐰
                  </div>
                  <p className="text-sm font-medium text-[#2D2D2D]">Tap to upload a photo</p>
                  <p className="text-xs text-[#8E8E93]">JPG or PNG, up to 10MB</p>
                </div>
              )}
              <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>

            <div>
              <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">Character Name</label>
              <input
                className="apple-input"
                placeholder="e.g. Luna, Max, Bunny"
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
              />
            </div>

            <button
              className="apple-button w-full text-center disabled:opacity-50"
              disabled={!photoFile || !charName || loading}
              onClick={handleCreateCharacter}
            >
              {loading ? '✨ Creating Character...' : '✨ Create Character'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Story */}
      {step === 'story' && (
        <div className="apple-card p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#2D2D2D]">Write Your Story</h2>
            <p className="text-sm text-[#8E8E93] mt-1">Describe the adventure</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#2D2D2D] mb-1.5 block">Story Theme</label>
              <input
                className="apple-input"
                placeholder="e.g. A magical forest adventure, A trip to the moon..."
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
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

            <button
              className="apple-button w-full text-center disabled:opacity-50"
              disabled={!theme || loading}
              onClick={handleGenerateStory}
            >
              {loading ? '✍️ Writing Story...' : '✍️ Generate Story'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && story && (
        <div className="space-y-6">
          <div className="apple-card p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#2D2D2D]">{story.title}</h2>
                <p className="text-sm text-[#8E8E93]">Starring {character?.name} • {ageGroup} years</p>
              </div>
              <button
                className="apple-button text-sm px-5 py-2.5"
                onClick={async () => {
                  setLoading(true)
                  try {
                    const res = await fetch('/api/export-pdf', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        storyId: 'draft',
                        characterId: character?.name,
                        title: story.title,
                        pages: story.pages,
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
                  }
                }}
              >
                {loading ? 'Exporting...' : '📖 Export PDF'}
              </button>
            </div>

            {/* Page previews */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {story.pages.map((page, i) => (
                <div key={i} className="apple-card p-3 text-center">
                  <div className="aspect-[3/4] bg-[#FFF5EE] rounded-xl mb-2 flex items-center justify-center text-3xl text-[#8E8E93]">
                    {i + 1}
                  </div>
                  <p className="text-xs text-[#8E8E93] leading-relaxed line-clamp-3">{page}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              className="apple-button-secondary text-sm px-6 py-3"
              onClick={() => { setStep('character'); setStory(null); setCharacter(null) }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
