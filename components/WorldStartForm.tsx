'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TurnstileWidget from '@/components/TurnstileWidget'
import BunnyMascot from '@/components/BunnyMascot'
import type { PageOutline } from '@/lib/types/book'
import { buildWorldBrief } from '@/lib/remix'

export interface StartWorld {
  id: string
  name: string
  ageRange: string
  theme: string
  scene: string
  artStyle: string
  characters: { name: string; role: string; personality: string; catchphrase: string }[]
  moralPool: string[]
  forbiddenZones: string[]
  sampleTitle: string
}

type Step = 'setup' | 'writing' | 'illustrating'

const IMAGE_BATCH = 5

/**
 * 世界库入口：选世界 → 填主角名字 → 挑这一集的寓意 → 确认 → 生成第 1 集。
 * 难度由世界年龄段自动映射 GRL，家长不需要懂分级。
 */
export default function WorldStartForm({ world }: { world: StartWorld }) {
  const router = useRouter()
  const [childName, setChildName] = useState('')
  const [moral, setMoral] = useState(world.moralPool[0] ?? '')
  const [token, setToken] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [step, setStep] = useState<Step>('setup')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)

  const canStart = childName.trim().length > 0 && !!token && confirmed && step === 'setup'

  const waitForBatch = async (genId: string) => {
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 3000))
      const status = await fetch(`/api/generate-pages?genId=${genId}`).then((r) => r.json())
      if (status.status === 'done' || status.status === 'error') return
    }
  }

  const handleStart = async () => {
    if (!canStart) return
    setError(null)
    setStep('writing')
    setProgress('Writing the story…')

    try {
      // 1. Turnstile token → 2 小时有效的通行证 cookie
      const passRes = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const pass = await passRes.json()
      if (!pass.success) throw new Error('Verification failed. Please retry the check.')

      // 2. 主角：只属于这个家庭，画风跟随世界
      const fd = new FormData()
      fd.append('name', childName.trim())
      fd.append('theme', world.theme)
      fd.append('ageGroup', world.ageRange)
      fd.append('photoUsage', 'illustrated')
      fd.append('turnstileToken', token || '')
      const charRes = await fetch('/api/create-character', { method: 'POST', body: fd })
      const character = await charRes.json()
      if (!charRes.ok || character.error) throw new Error(character.error || 'Could not create the hero')

      // 3. 故事：舞台来自世界，寓意来自家长的选择
      const worldBrief = buildWorldBrief({
        worldName: world.name,
        worldScene: world.scene,
        artStyle: world.artStyle,
        ageRange: world.ageRange,
        cast: world.characters,
        moral,
        forbidden: world.forbiddenZones,
      })
      const storyRes = await fetch('/api/create-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: `${world.theme} · ${moral}`,
          ageGroup: world.ageRange,
          characterName: childName.trim(),
          characterCards: character.card ? [character.card] : undefined,
          language: 'en-US',
          worldBrief,
          turnstileToken: token || '',
        }),
      })
      const story = await storyRes.json()
      if (storyRes.status === 401) {
        window.location.href = `/api/auth/google?next=/worlds/${world.id}/start`
        return
      }
      if (!storyRes.ok || story.error) throw new Error(story.error || 'Could not write the story')

      // 4. 落库：系列带上世界快照与这一集的寓意
      const saveRes = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: story.title,
          outline: story.outline,
          ageGroup: world.ageRange,
          theme: world.theme,
          level: story.level || null,
          quiz: story.quiz || null,
          aspect: '1:1',
          worldId: world.id,
          moral,
          character: {
            name: childName.trim(),
            card: character.card,
            consistencyLine: character.consistencyLine,
            imageB64: character.imageB64,
            style: world.artStyle,
          },
        }),
      })
      const saved = await saveRes.json()
      if (saveRes.status === 402) {
        window.location.href = '/pricing'
        return
      }
      if (!saveRes.ok || !saved.bookId) throw new Error(saved.error || 'Could not save the episode')

      // 5. 配图：主角参考图 + 世界画风，分批跑
      setStep('illustrating')
      const outline: PageOutline[] = story.outline || []
      const batches: PageOutline[][] = []
      for (let i = 0; i < outline.length; i += IMAGE_BATCH) {
        batches.push(outline.slice(i, i + IMAGE_BATCH))
      }
      for (let b = 0; b < batches.length; b++) {
        setProgress(`Illustrating page ${b * IMAGE_BATCH + 1}–${Math.min((b + 1) * IMAGE_BATCH, outline.length)} of ${outline.length}…`)
        try {
          const genRes = await fetch('/api/generate-pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              outline: batches[b],
              bookId: saved.bookId,
              characterImageB64: character.imageB64 || null,
              consistencyLine: character.consistencyLine || null,
              style: world.artStyle,
              ageGroup: world.ageRange,
              aspect: '1:1',
              turnstileToken: token || '',
            }),
          })
          const gen = await genRes.json()
          if (genRes.ok && gen.genId) await waitForBatch(gen.genId)
        } catch {
          // 单批失败不阻断：文字版已经落库，可以稍后重试配图
        }
      }

      router.push(`/book/${saved.bookId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('setup')
    }
  }

  if (step !== 'setup') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bunny-bounce inline-block"><BunnyMascot size={72} /></div>
        <h1 className="mt-6 text-2xl font-bold text-[#2D2D2D]">
          {step === 'writing' ? 'Writing your episode' : 'Illustrating your episode'}
        </h1>
        <p className="mt-2 text-sm text-[#8E8E93]">{progress}</p>
        <div className="mt-6 w-full bg-[#F2F2F7] rounded-full h-2.5">
          <div
            className="bunny-gradient h-2.5 rounded-full transition-all duration-700"
            style={{ width: step === 'writing' ? '30%' : '70%' }}
          />
        </div>
        <p className="mt-4 text-xs text-[#8E8E93]">
          This usually takes 2–4 minutes. Keep this tab open.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href={`/worlds/${world.id}`} className="text-sm text-[#8E8E93] hover:text-[#FF6B8A]">
        ← Back to {world.name}
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#FFF0F4] px-2.5 py-1 text-xs font-medium text-[#FF6B8A]">
          Ages {world.ageRange}
        </span>
        <span className="rounded-full bg-[#F2F2F7] px-2.5 py-1 text-xs font-medium text-[#2D2D2D]">
          {world.theme}
        </span>
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#2D2D2D]">
        Episode 1 in {world.name}
      </h1>
      <p className="mt-2 text-sm text-[#8E8E93] leading-relaxed">
        {world.scene}
      </p>

      {/* 主角 */}
      <div className="apple-card p-6 mt-8">
        <h2 className="text-lg font-bold text-[#2D2D2D]">Who is the hero?</h2>
        <p className="mt-1 text-xs text-[#8E8E93]">
          Your child&apos;s name and look stay in your account. World authors never see them.
        </p>
        <input
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          maxLength={24}
          placeholder="Your child's first name"
          className="mt-4 w-full rounded-xl border border-[#E5E5EA] px-4 py-3 text-sm text-[#2D2D2D] outline-none focus:border-[#FF6B8A]"
        />
        <p className="mt-2 text-[11px] text-[#C7C7CC]">
          The supporting cast ({world.characters.map((c) => c.name).join(', ')}) comes with the world.
        </p>
      </div>

      {/* 寓意 */}
      <div className="apple-card p-6 mt-5">
        <h2 className="text-lg font-bold text-[#2D2D2D]">What should this episode teach?</h2>
        <p className="mt-1 text-xs text-[#8E8E93]">
          One lesson per episode. The next episode rotates to another one.
        </p>
        <div className="mt-4 grid gap-2">
          {world.moralPool.map((m) => (
            <button
              key={m}
              onClick={() => setMoral(m)}
              className={`text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                moral === m
                  ? 'border-[#FF6B8A] bg-[#FFF5EE] text-[#2D2D2D]'
                  : 'border-[#E5E5EA] bg-white text-[#2D2D2D] hover:border-[#C8A2E8]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 确认 */}
      <div className="apple-card p-6 mt-5">
        <label className="flex items-start gap-3 text-sm text-[#2D2D2D] leading-relaxed">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1"
          />
          <span>
            I understand this story is AI-generated. {childName.trim() || 'My child'}&apos;s character is only
            used in our own books and is never shared with world authors or other families.
          </span>
        </label>

        <div className="mt-4">
          <TurnstileWidget
            onVerify={(t) => setToken(t)}
            onExpire={() => setToken(null)}
            onError={() => setToken(null)}
          />
        </div>

        <button
          onClick={handleStart}
          disabled={!canStart}
          className="apple-button w-full sm:w-auto text-sm px-6 py-3 mt-2 disabled:opacity-50"
        >
          Generate Episode 1
        </button>
        <p className="mt-3 text-[11px] text-[#8E8E93]">
          Uses one book from your plan. Reading level (GRL) is matched to ages {world.ageRange} automatically.
        </p>
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  )
}
