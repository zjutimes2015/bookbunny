// Demo request validation (COPPA hard rule, item A4).
//
// Allowlist + explicit personal-field rejection, pure and unit-testable.
// The demo endpoint accepts exactly four fields; anything that could carry a
// child's name, photo, contact detail, or free text is rejected with 400
// before any human check, quota check, or generation runs.

import {
  DEFAULT_DEMO_PRESET_ID,
  getDemoPreset,
  isDemoAgeGroup,
  type DemoAgeGroup,
} from './presets'

/** Fields that must never appear in a demo request. */
export const FORBIDDEN_DEMO_FIELDS = [
  'name',
  'childName',
  'characterName',
  'photo',
  'photoDataUri',
  'photoUrl',
  'image',
  'imageUrl',
  'email',
  'phone',
  'theme',
  'prompt',
  'story',
  'description',
  'freeText',
  'text',
  'message',
  'childAge',
  'birthday',
  'birthdate',
  'address',
  'accountId',
  'userId',
] as const

/** The only fields a demo request may carry. */
export const ALLOWED_DEMO_FIELDS = [
  'presetId',
  'ageGroup',
  'deviceId',
  'turnstileToken',
] as const

export type DemoRequest = {
  presetId: string
  ageGroup: DemoAgeGroup
  deviceId: string | null
  turnstileToken: string | null
}

export type DemoValidation =
  | { ok: true; request: DemoRequest }
  | { ok: false; status: 400; code: string; error: string }

/** Client-generated random id (localStorage), not a fingerprint: uuid-ish. */
const DEVICE_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/

export function validateDemoRequestBody(body: unknown): DemoValidation {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, status: 400, code: 'invalid_request', error: 'Request body must be a JSON object.' }
  }

  const keys = Object.keys(body as Record<string, unknown>)

  for (const field of FORBIDDEN_DEMO_FIELDS) {
    if (keys.includes(field)) {
      return {
        ok: false,
        status: 400,
        code: 'personal_data_rejected',
        error:
          'The demo does not accept names, photos, or personal details. Pick a story starter instead.',
      }
    }
  }

  for (const key of keys) {
    if (!(ALLOWED_DEMO_FIELDS as readonly string[]).includes(key)) {
      return {
        ok: false,
        status: 400,
        code: 'invalid_request',
        error: `Unexpected field: ${key}. The demo only accepts a story preset and an age group.`,
      }
    }
  }

  const raw = body as Record<string, unknown>
  const preset = getDemoPreset(raw.presetId ?? DEFAULT_DEMO_PRESET_ID)
  if (!preset) {
    return {
      ok: false,
      status: 400,
      code: 'invalid_preset',
      error: 'Unknown story preset. Pick one of the story starters.',
    }
  }

  const ageGroup = raw.ageGroup ?? preset.defaultAgeGroup
  if (!isDemoAgeGroup(ageGroup)) {
    return {
      ok: false,
      status: 400,
      code: 'invalid_age_group',
      error: 'Unknown age group.',
    }
  }

  let deviceId: string | null = null
  if (raw.deviceId !== undefined && raw.deviceId !== null && raw.deviceId !== '') {
    if (typeof raw.deviceId !== 'string' || !DEVICE_ID_PATTERN.test(raw.deviceId)) {
      return {
        ok: false,
        status: 400,
        code: 'invalid_device_id',
        error: 'Invalid device id.',
      }
    }
    deviceId = raw.deviceId
  }

  const turnstileToken =
    typeof raw.turnstileToken === 'string' && raw.turnstileToken ? raw.turnstileToken : null

  return { ok: true, request: { presetId: preset.id, ageGroup, deviceId, turnstileToken } }
}
