/**
 * Site-wide constants shared by robots, sitemap and page metadata.
 * The production domain is injected via SITE_URL; local development falls back to localhost.
 */
export const SITE_URL = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')

export const SITE_NAME = 'SproutTales'

/** Primary meta description used across landing pages */
export const SITE_DESCRIPTION =
  'AI picture book generator with the same character on every page, GRL A–E leveled text, and print-ready Amazon KDP PDFs. Free plan: 1 book a month, no credit card.'

/** Legal entity that operates the service; shown in the privacy policy and terms. */
export const LEGAL_ENTITY = process.env.LEGAL_ENTITY || 'SproutTales'

/**
 * Where privacy / data-deletion requests are sent. Must be an address on the domain
 * we actually own, or the notice is invalid.
 */
export const LEGAL_CONTACT_EMAIL = process.env.LEGAL_CONTACT_EMAIL || 'privacy@sprouttales.com'

/** Jurisdiction whose law governs the Terms; drives the governing-law clause. */
export const LEGAL_JURISDICTION = process.env.LEGAL_JURISDICTION || "the People's Republic of China"

/**
 * Days after the charge date during which an unused subscription period or an
 * unused credit pack may be refunded. Kept equal to the affiliate commission hold.
 */
export const REFUND_WINDOW_DAYS = 30

/**
 * Version of the privacy policy and parental-consent notice.
 * Bump this whenever the policy text changes: every stored consent record
 * carries the version it was granted under, so a bump invalidates old consents
 * and forces parents to re-consent.
 */
export const POLICY_VERSION = '2026-10-24'
