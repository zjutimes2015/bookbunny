'use client'

import { useCallback, useState } from 'react'
import DemoGenerator, { type DemoStatus } from '@/components/DemoGenerator'
import StoryStarterWall from '@/components/StoryStarterWall'
import StickyDemoBar from '@/components/StickyDemoBar'
import { DEFAULT_DEMO_PRESET_ID, getDemoPreset, type DemoAgeGroup } from '@/lib/demo/presets'

/**
 * Homepage demo block (items A + E): shared preset/age state for the
 * generator card, the story-starter wall, and the sticky bottom bar.
 */
export default function DemoSection() {
  const [presetId, setPresetId] = useState<string>(DEFAULT_DEMO_PRESET_ID)
  const [ageGroup, setAgeGroup] = useState<DemoAgeGroup>(
    getDemoPreset(DEFAULT_DEMO_PRESET_ID)?.defaultAgeGroup ?? '3-5',
  )
  const [generateRequest, setGenerateRequest] = useState(0)
  const [status, setStatus] = useState<DemoStatus>('idle')

  const handleSelectStarter = useCallback((id: string, age: DemoAgeGroup) => {
    setPresetId(id)
    setAgeGroup(age)
    document.getElementById('demo-generator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleStatusChange = useCallback((next: DemoStatus) => {
    setStatus(next)
  }, [])

  return (
    <>
      <div className="mx-auto mt-8 max-w-3xl">
        <DemoGenerator
          presetId={presetId}
          ageGroup={ageGroup}
          onPresetChange={setPresetId}
          onAgeGroupChange={setAgeGroup}
          generateRequest={generateRequest}
          onStatusChange={handleStatusChange}
        />
      </div>

      <StoryStarterWall selectedPresetId={presetId} onSelect={handleSelectStarter} />

      <StickyDemoBar
        presetId={presetId}
        onPresetChange={setPresetId}
        onGenerate={() => setGenerateRequest((c) => c + 1)}
        generating={status === 'busy'}
        hasResult={status === 'done'}
      />
    </>
  )
}
