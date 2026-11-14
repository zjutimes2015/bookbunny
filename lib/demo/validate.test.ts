import { describe, it, expect } from 'vitest'
import { validateDemoRequestBody, FORBIDDEN_DEMO_FIELDS } from './validate'

describe('validateDemoRequestBody', () => {
  it('accepts a preset-only request', () => {
    const res = validateDemoRequestBody({ presetId: 'moon-star', ageGroup: '3-5' })
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.request.presetId).toBe('moon-star')
      expect(res.request.ageGroup).toBe('3-5')
      expect(res.request.deviceId).toBeNull()
    }
  })

  it('defaults to the first preset and its age group when omitted', () => {
    const res = validateDemoRequestBody({})
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.request.presetId).toBe('moon-star')
      expect(res.request.ageGroup).toBe('3-5')
    }
  })

  it('accepts the full allowed field set', () => {
    const res = validateDemoRequestBody({
      presetId: 'night-train',
      ageGroup: '7-10',
      deviceId: 'demo-abc12345',
      turnstileToken: 'tok',
    })
    expect(res.ok).toBe(true)
  })

  it.each([...FORBIDDEN_DEMO_FIELDS])(
    'rejects personal-data field %s',
    (field) => {
      const res = validateDemoRequestBody({ presetId: 'moon-star', [field]: 'x' })
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.status).toBe(400)
        expect(res.code).toBe('personal_data_rejected')
      }
    },
  )

  it('rejects free-text theme even when it looks innocent', () => {
    const res = validateDemoRequestBody({ theme: 'A story about my daughter Emma' })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.code).toBe('personal_data_rejected')
  })

  it('rejects unknown fields', () => {
    const res = validateDemoRequestBody({ presetId: 'moon-star', nickname: 'Boo' })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.code).toBe('invalid_request')
  })

  it('rejects an unknown preset id', () => {
    const res = validateDemoRequestBody({ presetId: 'not-a-preset' })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.code).toBe('invalid_preset')
  })

  it('rejects an unknown age group', () => {
    const res = validateDemoRequestBody({ presetId: 'moon-star', ageGroup: '99-100' })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.code).toBe('invalid_age_group')
  })

  it('rejects a malformed device id', () => {
    const res = validateDemoRequestBody({ presetId: 'moon-star', deviceId: 'x' })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.code).toBe('invalid_device_id')
  })

  it('rejects a non-object body', () => {
    expect(validateDemoRequestBody(null).ok).toBe(false)
    expect(validateDemoRequestBody('moon-star').ok).toBe(false)
    expect(validateDemoRequestBody([]).ok).toBe(false)
  })
})
