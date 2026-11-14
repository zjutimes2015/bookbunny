import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { generateStory } from '@/lib/api/story'
import { buildConsistencyLine } from '@/lib/api/character'
import { getClientIp } from '@/lib/auth'
import { requireHuman, attachPassCookie, humanCheckFailedResponse } from '@/lib/turnstile'
import { DEMO_CHARACTER, DEMO_PAGE_COUNT, getDemoPreset } from '@/lib/demo/presets'
import { checkDemoQuota, getDemoQuotaStore } from '@/lib/demo/rate-limit'
import { validateDemoRequestBody } from '@/lib/demo/validate'

export const runtime = 'nodejs'

/**
 * No-login demo generation (item A).
 *
 * Reuses the existing story pipeline: lib/api/story generateStory with the
 * FIXED demo character card (Pip) and a fixed preset theme. The browser then
 * sends the returned outline to the existing /api/generate-pages endpoint for
 * illustrations, exactly like /create does.
 *
 * Order of checks (deliberate): personal-field rejection -> human check ->
 * daily quota -> generation. Nothing that could carry child data is ever
 * passed to the story generator: theme/character come from server presets.
 */

// In-memory quota store lives in lib/demo/rate-limit.ts (getDemoQuotaStore).
// It resets on restart and is per serverless instance (same caveat as the
// AdaptLane demo quota). No DB table by design.

/** Quota key: client IP + sha256 of the device id (raw id is never stored). */
function demoQuotaKey(ip: string, deviceId: string | null): string {
  if (!deviceId) return `demo:${ip}`
  const hash = createHash('sha256').update(deviceId).digest('hex').slice(0, 32)
  return `demo:${ip}:${hash}`
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.', code: 'invalid_request' },
      { status: 400 },
    )
  }

  // 1. COPPA gate: reject any name/photo/personal/free-text field first.
  const validation = validateDemoRequestBody(body)
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error, code: validation.code },
      { status: validation.status },
    )
  }
  const { presetId, ageGroup, deviceId, turnstileToken } = validation.request
  const preset = getDemoPreset(presetId)!

  // 2. Human check, same gate as the other generation endpoints.
  const human = await requireHuman(req, turnstileToken)
  if (!human.ok) return humanCheckFailedResponse()

  // 3. One demo generation per IP+device per rolling 24h.
  const quota = checkDemoQuota(getDemoQuotaStore(), demoQuotaKey(getClientIp(req), deviceId))
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: "You've already made today's free sample. Come back tomorrow — or create your own book with your child as the hero.",
        code: 'demo_daily_limit',
        resetAt: quota.resetAt,
      },
      { status: 429 },
    )
  }

  // 4. Generate via the existing pipeline. Fixed character + fixed theme:
  // nothing from the request body reaches the LLM except the preset choice
  // and the age group (both allowlisted).
  try {
    const story = await generateStory({
      theme: preset.theme,
      ageGroup,
      characterName: DEMO_CHARACTER.name,
      pages: DEMO_PAGE_COUNT,
      characterCards: [DEMO_CHARACTER],
      language: 'en',
    })

    const res = NextResponse.json({
      title: story.title,
      outline: story.outline,
      level: story.level ?? null,
      levelLabel: story.levelLabel ?? null,
      consistencyLine: buildConsistencyLine(DEMO_CHARACTER),
      presetId: preset.id,
      ageGroup,
      characterName: DEMO_CHARACTER.name,
      pages: DEMO_PAGE_COUNT,
      watermarkedPreview: true,
    })
    return human.issued ? attachPassCookie(res) : res
  } catch (err) {
    console.error('Demo generation error:', err)
    return NextResponse.json(
      { error: 'Demo generation failed. Please try again tomorrow.', code: 'demo_failed' },
      { status: 500 },
    )
  }
}
