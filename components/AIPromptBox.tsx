'use client'

import { useRef } from 'react'

interface AIPromptBoxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Quick-start idea chips, shown while the box is empty */
  suggestions?: string[]
  disabled?: boolean
}

/**
 * Apple-style AI prompt box for the Story Theme step on /create.
 * Idea chips + auto-growing textarea + a "surprise me" shortcut.
 */
export default function AIPromptBox({
  value,
  onChange,
  placeholder = 'Describe the story you want to create…',
  suggestions = [],
  disabled = false,
}: AIPromptBoxProps) {
  const areaRef = useRef<HTMLTextAreaElement>(null)

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const surprise = () => {
    if (suggestions.length === 0) return
    const pool = suggestions.filter((s) => s !== value)
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? suggestions[0]
    onChange(pick)
    areaRef.current?.focus()
  }

  return (
    <div className={`apple-card p-3 ${disabled ? 'opacity-60' : ''}`}>
      {value.trim() === '' && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 px-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange(s)
                areaRef.current?.focus()
              }}
              className="text-[11px] text-[#8E8E93] bg-[#F2F2F7] hover:bg-[#FFF5EE] hover:text-[#FF6B8A] rounded-full px-2.5 py-1 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <textarea
        ref={areaRef}
        rows={2}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value)
          autoGrow(e.target)
        }}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#2D2D2D] placeholder:text-[#C7C7CC] focus:outline-none disabled:cursor-not-allowed"
      />

      <div className="flex items-center justify-end mt-1 px-1">
        <button
          type="button"
          onClick={surprise}
          disabled={disabled || suggestions.length === 0}
          className="flex items-center gap-1.5 text-[12px] font-medium text-[#8E8E93] hover:text-[#FF6B8A] disabled:opacity-40 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          Surprise me
        </button>
      </div>
    </div>
  )
}
