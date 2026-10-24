/**
 * Affiliate program — shared pure logic + database helpers.
 *
 * Design notes:
 * - Commissions are tracked per payment (`payment_id` unique) so a webhook retry can
 *   never double-credit an affiliate.
 * - The first payment from a referral pays `firstRate`; every later payment pays
 *   `recurringRate`. This is what gives creators a reason to keep producing content.
 * - Commissions stay `pending` for a refund window, then get approved lazily when the
 *   affiliate opens the dashboard (no cron required).
 */

export type AffiliateTier = 'tier1' | 'tier2' | 'tier3'
export type CommissionKind = 'first' | 'recurring'
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'void'

export interface AffiliateTierConfig {
  id: AffiliateTier
  label: string
  firstRate: number
  recurringRate: number
  audience: string
  perks: string[]
}

export const AFFILIATE_TIERS: Record<AffiliateTier, AffiliateTierConfig> = {
  tier1: {
    id: 'tier1',
    label: 'Rising Creator',
    firstRate: 30,
    recurringRate: 15,
    audience: '1K – 50K followers',
    perks: ['Free Creator account', 'Launch kit + swipe copy', 'Real-time conversion dashboard'],
  },
  tier2: {
    id: 'tier2',
    label: 'Established Creator',
    firstRate: 40,
    recurringRate: 20,
    audience: '50K – 200K followers',
    perks: ['Everything in Tier 1', 'Custom discount code', '1:1 product walkthrough'],
  },
  tier3: {
    id: 'tier3',
    label: 'Partner',
    firstRate: 50,
    recurringRate: 25,
    audience: '200K+ / media',
    perks: ['Negotiated rates', 'Co-branded campaign', 'Dedicated partner manager'],
  },
}

export const DEFAULT_TIER: AffiliateTier = 'tier1'

/** Refund window before a commission becomes payable. */
export const COMMISSION_HOLD_DAYS = 30

/** Minimum balance before an affiliate can request a payout (USD cents). */
export const MIN_PAYOUT_CENTS = 5000

export const REFERRAL_COOKIE = 'ref_code'
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 90

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function isAffiliateTier(value: unknown): value is AffiliateTier {
  return value === 'tier1' || value === 'tier2' || value === 'tier3'
}

export function tierConfig(tier: AffiliateTier): AffiliateTierConfig {
  return AFFILIATE_TIERS[tier]
}

/** Uppercase and strip anything that is not A-Z / 0-9. */
export function normalizeCode(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function isValidCode(code: string): boolean {
  return /^[A-Z0-9]{4,16}$/.test(code)
}

/** Cryptographically random code is unnecessary; collision retries cover the space. */
export function generateReferralCode(random: () => number = Math.random, length = 8): string {
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]
  }
  return out
}

export function buildReferralLink(baseUrl: string, code: string, pathname = '/'): string {
  const base = baseUrl.replace(/\/+$/, '')
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${path}?ref=${encodeURIComponent(code)}`
}

export function computeCommissionCents(grossCents: number, ratePercent: number): number {
  if (!Number.isFinite(grossCents) || grossCents <= 0) return 0
  if (!Number.isFinite(ratePercent) || ratePercent <= 0) return 0
  return Math.round((grossCents * ratePercent) / 100)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

/** jane.doe@example.com -> j***e@example.com (shown to affiliates only). */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '—'
  const [local, domain] = email.split('@')
  if (!domain) return '—'
  if (local.length <= 2) return `${local[0] ?? '*'}***@${domain}`
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

// ---------------------------------------------------------------------------
// Database helpers (sql client injected so they stay easy to test/mock)
// ---------------------------------------------------------------------------

type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<any[]>

export interface AffiliateRow {
  id: string
  user_id: string
  code: string
  tier: AffiliateTier
  first_rate: number
  recurring_rate: number
  payout_email: string | null
  payout_method: string
  status: string
  created_at: string
  updated_at: string
}

export function resolveRates(row: Pick<AffiliateRow, 'tier' | 'first_rate' | 'recurring_rate'>) {
  const config = AFFILIATE_TIERS[isAffiliateTier(row.tier) ? row.tier : DEFAULT_TIER]
  const firstRate = Number(row.first_rate) || config.firstRate
  const recurringRate = Number(row.recurring_rate) || config.recurringRate
  return { firstRate, recurringRate }
}

export async function getAffiliateForUser(sql: Sql, userId: string): Promise<AffiliateRow | null> {
  const rows = await sql`SELECT * FROM affiliates WHERE user_id = ${userId} LIMIT 1`
  return (rows[0] as AffiliateRow) || null
}

export async function getAffiliateByCode(sql: Sql, code: string): Promise<AffiliateRow | null> {
  const rows = await sql`SELECT * FROM affiliates WHERE code = ${code} LIMIT 1`
  return (rows[0] as AffiliateRow) || null
}

/**
 * Attribute a new signup to the affiliate whose code was stored in the referral cookie.
 * Self-referrals and duplicate attributions are ignored.
 */
export async function attributeReferral(
  sql: Sql,
  { userId, code }: { userId: string; code: string },
): Promise<boolean> {
  const normalized = normalizeCode(code)
  if (!isValidCode(normalized)) return false

  const affiliate = await getAffiliateByCode(sql, normalized)
  if (!affiliate || affiliate.status !== 'active') return false
  if (affiliate.user_id === userId) return false

  const inserted = await sql`
    INSERT INTO referrals (affiliate_id, referred_user_id, code)
    VALUES (${affiliate.id}, ${userId}, ${normalized})
    ON CONFLICT (referred_user_id) DO NOTHING
    RETURNING id
  `
  return inserted.length > 0
}

/**
 * Accrue a commission for a completed payment. Safe to call from webhook retries —
 * `payment_id` is unique.
 */
export async function recordCommissionForPayment(
  sql: Sql,
  {
    userId,
    email,
    paymentId,
    grossCents,
  }: { userId?: string | null; email?: string | null; paymentId: string; grossCents: number },
): Promise<number> {
  if (!paymentId || grossCents <= 0) return 0

  let referredUserId = userId || null
  if (!referredUserId && email) {
    const rows = await sql`SELECT id FROM bookbunny_users WHERE email = ${email} LIMIT 1`
    referredUserId = (rows[0]?.id as string) || null
  }
  if (!referredUserId) return 0

  const referralRows = await sql`
    SELECT r.id, r.affiliate_id, a.user_id AS affiliate_user_id, a.status, a.tier,
           a.first_rate, a.recurring_rate
    FROM referrals r
    JOIN affiliates a ON a.id = r.affiliate_id
    WHERE r.referred_user_id = ${referredUserId}
    LIMIT 1
  `
  const referral = referralRows[0]
  if (!referral || referral.status !== 'active') return 0
  if (referral.affiliate_user_id === referredUserId) return 0

  const priorFirst = await sql`
    SELECT 1 FROM affiliate_commissions
    WHERE referral_id = ${referral.id} AND kind = 'first'
    LIMIT 1
  `
  const kind: CommissionKind = priorFirst.length > 0 ? 'recurring' : 'first'
  const { firstRate, recurringRate } = resolveRates(referral as AffiliateRow)
  const rate = kind === 'first' ? firstRate : recurringRate
  const amountCents = computeCommissionCents(grossCents, rate)
  if (amountCents <= 0) return 0

  const inserted = await sql`
    INSERT INTO affiliate_commissions
      (affiliate_id, referral_id, payment_id, kind, gross_cents, rate, amount_cents)
    VALUES (${referral.affiliate_id}, ${referral.id}, ${paymentId}, ${kind}, ${grossCents}, ${rate}, ${amountCents})
    ON CONFLICT (payment_id) DO NOTHING
    RETURNING id
  `
  if (inserted.length === 0) return 0

  await sql`
    UPDATE referrals
    SET status = 'converted', converted_at = COALESCE(converted_at, NOW())
    WHERE id = ${referral.id}
  `

  return amountCents
}

/** Move commissions past the refund window from pending -> approved. */
export async function approveMatureCommissions(sql: Sql, affiliateId: string): Promise<void> {
  await sql`
    UPDATE affiliate_commissions
    SET status = 'approved'
    WHERE affiliate_id = ${affiliateId}
      AND status = 'pending'
      AND created_at <= NOW() - (${COMMISSION_HOLD_DAYS} || ' days')::interval
  `
}
