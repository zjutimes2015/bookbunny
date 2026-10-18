'use client'

import { useState } from 'react'

interface Character {
  id: string
  name: string
  photoPreview?: string
  refSeed?: number
  /** 正在生成角色设定卡 */
  generating?: boolean
}

interface MultiCharacterManagerProps {
  characters: Character[]
  onAdd: (name: string, photo?: File) => void
  onRemove: (id: string) => void
  onUpdate: (id: string, data: Partial<Character>) => void
  maxCharacters?: number
}

export default function MultiCharacterManager({
  characters,
  onAdd,
  onRemove,
  onUpdate,
  maxCharacters = 5,
}: MultiCharacterManagerProps) {
  const [newName, setNewName] = useState('')
  const [newPhoto, setNewPhoto] = useState<File | null>(null)

  const handleAdd = () => {
    if (!newName.trim() || characters.length >= maxCharacters) return
    onAdd(newName.trim(), newPhoto || undefined)
    setNewName('')
    setNewPhoto(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#2D2D2D]">
          Characters ({characters.length}/{maxCharacters})
        </h3>
        <span className="text-xs text-[#8E8E93]">Add up to {maxCharacters} characters</span>
      </div>

      {/* Character list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {characters.map((char) => (
          <div
            key={char.id}
            className="apple-card p-3 text-center relative group"
          >
            <div className="w-12 h-12 rounded-full bg-[#FFF5EE] flex items-center justify-center mx-auto mb-2 text-xl">
              {char.generating ? (
                <span className="animate-pulse">✨</span>
              ) : char.photoPreview ? (
                <img src={char.photoPreview} alt={char.name}
                     className="w-12 h-12 rounded-full object-cover" />
              ) : (
                '🐰'
              )}
            </div>
            <p className="text-xs font-medium text-[#2D2D2D] truncate">{char.name}</p>
            {char.generating && (
              <p className="text-[9px] text-[#C8A2E8] mt-0.5">designing…</p>
            )}
            <button
              onClick={() => onRemove(char.id)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#FF6B8A] text-white text-xs
                         flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}

        {/* Add button */}
        {characters.length < maxCharacters && (
          <div className="apple-card p-3 border-dashed border-2 border-[#E5E5EA] flex flex-col items-center justify-center
                          cursor-pointer hover:border-[#FF6B8A] transition-colors min-h-[90px]"
               onClick={() => document.getElementById('char-upload')?.click()}>
            <span className="text-2xl text-[#C8A2E8]">+</span>
            <span className="text-xs text-[#8E8E93] mt-1">Add</span>
            <input id="char-upload" type="file" accept="image/*" className="hidden"
                   onChange={(e) => {
                     const file = e.target.files?.[0]
                     if (file) {
                       const name = file.name.split('.')[0]
                       onAdd(name, file)
                     }
                   }} />
          </div>
        )}
      </div>

      {/* Quick add form (always available while slots remain — enables 方案A 不用真照) */}
      {characters.length < maxCharacters && (
        <details className="text-sm">
          <summary className="text-[#FF6B8A] cursor-pointer font-medium">+ Add by name only</summary>
          <div className="flex gap-2 mt-2">
            <input
              className="apple-input text-sm py-2"
              placeholder="Character name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              className="apple-button-secondary text-sm px-4 py-2 whitespace-nowrap"
              onClick={handleAdd}
              disabled={!newName.trim()}
            >
              Add
            </button>
          </div>
        </details>
      )}
    </div>
  )
}
