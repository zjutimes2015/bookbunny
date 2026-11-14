// Browser-side demo device id: a random value stored in localStorage, used
// only to scope the 1-per-day demo quota (IP + device). It contains no
// personal data, is never sent anywhere else, and clearing site data resets it.

const STORAGE_KEY = 'sprouttales-demo-device-id'

export function getDemoDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing && /^[A-Za-z0-9_-]{8,128}$/.test(existing)) return existing

    const fresh =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
    window.localStorage.setItem(STORAGE_KEY, fresh)
    return fresh
  } catch {
    // Private mode / blocked storage: fall back to an in-memory id. The
    // server still rate-limits by IP, so abuse control is not lost.
    return `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  }
}
