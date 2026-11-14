'use client'

import { DEMO_AGE_GROUPS, DEMO_PRESETS, type DemoAgeGroup } from '@/lib/demo/presets'

interface StoryStarterWallProps {
  selectedPresetId: string
  onSelect: (presetId: string, ageGroup: DemoAgeGroup) => void
}

/**
 * "Click to use" story-starter wall (item E2). Each card shows a COMPLETE
 * story opening written for this wall. Tapping one fills the generator's
 * theme preset + age range. Openings are starter ideas, not finished books
 * and not any real user's book.
 */
export default function StoryStarterWall({ selectedPresetId, onSelect }: StoryStarterWallProps) {
  return (
    <section aria-label="Story starters" className="mt-10">
      <h2 className="text-center text-lg font-semibold text-[#2D2D2D]">Or start from a story opening</h2>
      <p className="mx-auto mt-1.5 max-w-lg text-center text-sm leading-relaxed text-[#545558]">
        Tap any opening to fill the generator above. These are starter ideas
        written for trying the tool — your sample book is generated fresh from the one you pick.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_PRESETS.map((preset) => {
          const selected = preset.id === selectedPresetId
          const ageLabel =
            DEMO_AGE_GROUPS.find((g) => g.id === preset.defaultAgeGroup)?.label ?? ''
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset.id, preset.defaultAgeGroup)}
              aria-pressed={selected}
              className={`rounded-2xl border bg-white p-5 text-left transition-colors ${
                selected
                  ? 'border-[#FF6B8A] ring-1 ring-[#FF6B8A]'
                  : 'border-[#E5E5EA] hover:border-[#FF6B8A]'
              }`}
            >
              <span className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#FF6B8A]">
                  {preset.label}
                </span>
                <span className="shrink-0 text-[13px] text-[#545558]">{ageLabel}</span>
              </span>
              <span className="block text-sm leading-relaxed text-[#2D2D2D]">{preset.opening}</span>
              <span className="mt-3 block text-sm font-medium text-[#2D2D2D]">
                {selected ? '✓ Selected — generate above' : 'Use this starter →'}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
