/**
 * VPC credit ledger: the $1.00 parental-consent verification fee, recorded so
 * it can be refunded manually after the user's first paid order.
 *
 * Redemption policy (manual, decided 2026-11-14): checkout charges the
 * product's full price — there is NO automatic discount. When a parent asks
 * for the $1.00 back after their first paid order, an operator verifies the
 * pending credit in this ledger, refunds $1.00 in the Waffo dashboard, and
 * records the consumption with scripts/mark-vpc-credit-consumed.cjs. The full
 * procedure is docs/vpc-credit-manual-redemption.md. User-facing copy must
 * describe this manual process and must never promise an automatic credit at
 * checkout (see components/ParentalConsentGate.tsx).
 *
 * Flow:
 * 1. GRANT — when the VPC card charge settles, the Waffo webhook (OrderCompleted /
 *    SubscriptionActivated, tier 'vpc') calls {@link grantVpcCredit} right after
 *    the consent record is written. The grant is idempotent on the VPC order id,
 *    and a user can hold at most one pending ('granted') credit.
 * 2. FIRST ORDER — when the user's first paid order after the grant completes
 *    (any non-VPC order: subscription or Pro animation pack — there is no
 *    single-book product), the webhook calls {@link stampFirstOrder}, which
 *    atomically stamps that order onto the pending credit. The stamp is the
 *    first-order detection: exactly one order can win it. The stamp is only a
 *    record: it is NOT consumption, and the stamped order may be a renewal
 *    rather than the first purchase (see the manual doc for the L3/L4
 *    semantics an operator must check before refunding).
 * 3. CONSUME — {@link applyCreditToAmount} is the pure clamp math for reducing
 *    a charge by the credit (never below zero; kept for a future automatic
 *    discount, unused today), and {@link consumeVpcCredit} atomically flips a
 *    pending credit to 'consumed' exactly once. No route calls it: only the
 *    manual marking tool records a consumption, after a human has refunded
 *    the $1.00.
 *
 * Why no automatic discount (Waffo-side gap, deferred — not this build's job):
 * the Waffo SDK exposes a session-level `priceSnapshot` override, but wiring
 * it is NOT safe on the evidence in this repo: it requires a `taxCategory`
 * (the live products' tax categories are unverified — the provision script used
 * 'digital_goods', the live store state is unknown), and for subscription
 * products the SDK documents it as replacing "the regular period price" without
 * saying whether that is the first period only or every renewal. Applying it
 * unchecked could discount every renewal. Until both points are verified
 * against Waffo docs and a test-mode checkout, `consumeVpcCredit` stays
 * unwired by routes and pending credits are honored manually from this ledger.
 *
 * Audit: every credit row records who (user_id), when (granted_at /
 * first_order_at / consumed_at), how much (amount_cents), and the order
 * references (source_order_id = the VPC charge, first_order_id, consumed_order_id).
 *
 * The credit is independent of the consent record: withdrawing consent does not
 * void it (the parent paid the $1.00), and the development simulated-consent path
 * grants no credit (no real charge settled).
 *
 * Storage: `vpc_credits` table, DDL in scripts/migrate-vpc-credit.cjs following
 * the existing migrate-*.cjs pattern. Production table creation is UNVERIFIED —
 * the migration must be run against the production database before this code can
 * grant anything there; until then the webhook's try/catch logs the failure and
 * payment handling continues.
 */
import { randomUUID } from 'node:crypto'
import { VPC_PRICE_CENTS } from './waffo'

/** The verification fee, refunded in full when redeemed manually: $1.00. Never grant more than this. */
export const VPC_CREDIT_CENTS = VPC_PRICE_CENTS

export type VpcCreditStatus = 'granted' | 'consumed' | 'void'

export interface VpcCreditRecord {
  id: string
  userId: string
  amountCents: number
  status: VpcCreditStatus
  /** Waffo order id of the settled $1.00 VPC charge that funded this credit. */
  sourceOrderId: string
  /** First paid order completed after the grant, if any. */
  firstOrderId: string | null
  firstOrderAt: string | null
  /** Order the credit was actually applied to, once consumed. */
  consumedOrderId: string | null
  consumedAt: string | null
  grantedAt: string
}

/**
 * Minimal structural type for the Neon tagged-template client, mirroring
 * lib/affiliate.ts so webhook call sites can pass their `sql` straight through.
 */
export type VpcCreditSql = (
  strings: TemplateStringsArray,
  ...values: unknown[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => Promise<any[]>

function mapRow(row: Record<string, unknown>): VpcCreditRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    amountCents: Number(row.amount_cents),
    status: row.status as VpcCreditStatus,
    sourceOrderId: String(row.source_order_id),
    firstOrderId: (row.first_order_id as string) ?? null,
    firstOrderAt: row.first_order_at ? String(row.first_order_at) : null,
    consumedOrderId: (row.consumed_order_id as string) ?? null,
    consumedAt: row.consumed_at ? String(row.consumed_at) : null,
    grantedAt: String(row.granted_at),
  }
}

export type GrantVpcCreditReason =
  | 'granted'
  | 'already-granted'
  | 'duplicate-order'
  | 'non-positive-amount'
  | 'unsupported-currency'

export interface GrantVpcCreditResult {
  granted: boolean
  credit: VpcCreditRecord | null
  reason: GrantVpcCreditReason
}

/**
 * Record a $1.00 credit for a settled VPC charge. Call only from the webhook's
 * completed-event branch, after the consent record is written — a failed or
 * abandoned charge never reaches that branch, so it can never grant a credit.
 *
 * Idempotent: a duplicate delivery of the same VPC order returns the existing
 * row instead of a second credit, and a user who already holds a pending credit
 * (e.g. re-verified after a policy bump) gets no second one. The partial unique
 * index on (user_id) WHERE status = 'granted' is the database backstop for the
 * check-then-insert race; a 23505 from a true race propagates to the caller.
 *
 * Currency: the credit is USD-denominated ($1.00). A settled charge in any
 * other currency grants nothing ('unsupported-currency') — crediting $1.00
 * for a non-USD fee would misstate the amount paid. The caller passes the
 * event currency (defaulting to 'USD' when the event omits it, matching the
 * payments-row default); a skipped grant is logged by the webhook so it can
 * be reviewed by hand.
 */
export async function grantVpcCredit(
  sql: VpcCreditSql,
  input: { userId: string; sourceOrderId: string; amountCents: number; currency?: string },
): Promise<GrantVpcCreditResult> {
  const { userId, sourceOrderId } = input
  if (!userId || !sourceOrderId) {
    throw new Error('grantVpcCredit requires userId and sourceOrderId')
  }

  // USD-only ledger: never mint a $1.00 credit for a charge settled in
  // another currency. Missing currency defaults to USD (same default the
  // webhook uses when recording the payment row). Compared case-insensitively:
  // a provider that reports 'usd' must not be treated as a foreign currency.
  if ((input.currency ?? 'USD').toUpperCase() !== 'USD') {
    return { granted: false, credit: null, reason: 'unsupported-currency' }
  }

  // The credit is the fee that was actually paid, capped at $1.00, never negative.
  // Callers (webhook, backfill) apply the product-price fallback first: a
  // zero/unknown settled amount on a settled VPC charge is passed in as $1.00,
  // because the VPC product is fixed at $1.00. This zero-guard is only the
  // last-resort safety net for a direct caller that passes 0 — it must never
  // mint a credit out of nothing on its own.
  // Non-finite input (NaN) is treated as zero: without this guard NaN would slip
  // past the clamp (Math.min/Math.max propagate NaN, and NaN <= 0 is false) and
  // reach the INSERT.
  const settledCents = Number.isFinite(input.amountCents) ? Math.floor(input.amountCents) : 0
  const creditCents = Math.min(Math.max(settledCents, 0), VPC_CREDIT_CENTS)
  if (creditCents <= 0) {
    return { granted: false, credit: null, reason: 'non-positive-amount' }
  }

  const pending = await sql`
    SELECT * FROM vpc_credits
    WHERE user_id = ${userId} AND status = 'granted'
    ORDER BY granted_at ASC
    LIMIT 1
  `
  if (pending[0]) {
    return { granted: false, credit: mapRow(pending[0]), reason: 'already-granted' }
  }

  const inserted = await sql`
    INSERT INTO vpc_credits (id, user_id, amount_cents, status, source_order_id)
    VALUES (${randomUUID()}, ${userId}, ${creditCents}, 'granted', ${sourceOrderId})
    ON CONFLICT (source_order_id) DO NOTHING
    RETURNING *
  `
  if (inserted[0]) {
    return { granted: true, credit: mapRow(inserted[0]), reason: 'granted' }
  }

  // Lost the insert race, or this order already funded a (now consumed/void) credit.
  const existing = await sql`
    SELECT * FROM vpc_credits
    WHERE source_order_id = ${sourceOrderId}
    LIMIT 1
  `
  return {
    granted: false,
    credit: existing[0] ? mapRow(existing[0]) : null,
    reason: 'duplicate-order',
  }
}

/** The user's pending (unconsumed) VPC credit, if any. */
export async function getPendingVpcCredit(
  sql: VpcCreditSql,
  userId: string,
): Promise<VpcCreditRecord | null> {
  if (!userId) return null
  const rows = await sql`
    SELECT * FROM vpc_credits
    WHERE user_id = ${userId} AND status = 'granted'
    ORDER BY granted_at ASC
    LIMIT 1
  `
  return rows[0] ? mapRow(rows[0]) : null
}

/**
 * First-order detection: stamp `orderId` onto the user's pending credit as the
 * first paid order completed after the grant. Atomic — exactly one order wins
 * the stamp, because the UPDATE only matches rows with no stamp yet. Returns
 * the stamped credit, or null when there is no pending unstamped credit.
 *
 * Stamping is NOT consumption: it only records that the first order happened
 * while a credit was pending. See the module header for the Waffo-side gap.
 */
export async function stampFirstOrder(
  sql: VpcCreditSql,
  input: { userId: string; orderId: string },
): Promise<VpcCreditRecord | null> {
  const { userId, orderId } = input
  if (!userId || !orderId) return null
  const rows = await sql`
    UPDATE vpc_credits
    SET first_order_id = ${orderId}, first_order_at = NOW()
    WHERE user_id = ${userId} AND status = 'granted' AND first_order_id IS NULL
    RETURNING *
  `
  return rows[0] ? mapRow(rows[0]) : null
}

/**
 * Pure clamp math for applying a credit to a charge. The charged amount can
 * never go below zero; any credit left over after covering the charge is
 * reported so the caller can decide what to do with it (the current ledger
 * consumes the whole credit on first use — see {@link consumeVpcCredit}).
 * Non-finite inputs are treated as zero (NaN must never reach the arithmetic:
 * Math.floor/Math.max propagate it).
 */
export function applyCreditToAmount(
  amountCents: number,
  creditCents: number,
): { chargedCents: number; appliedCents: number; creditRemainingCents: number } {
  const amount = Number.isFinite(amountCents) ? Math.max(Math.floor(amountCents), 0) : 0
  const credit = Number.isFinite(creditCents) ? Math.max(Math.floor(creditCents), 0) : 0
  const appliedCents = Math.min(credit, amount)
  return {
    chargedCents: amount - appliedCents,
    appliedCents,
    creditRemainingCents: credit - appliedCents,
  }
}

/**
 * Atomically consume the user's pending credit against `orderId`. Single-use:
 * the UPDATE only matches a 'granted' row, so a second call finds nothing and
 * returns null. Returns the consumed credit, or null when there was no pending
 * credit to consume.
 *
 * CALLED ONLY BY THE MANUAL REDEMPTION TOOL
 * (scripts/mark-vpc-credit-consumed.cjs), after an operator has refunded the
 * $1.00 in the Waffo dashboard — see docs/vpc-credit-manual-redemption.md.
 * No route calls it: checkout charges full price and the automatic Waffo
 * discount is deferred (see the module header). Do not wire it from a route
 * until checkout provably charges the discounted amount.
 */
export async function consumeVpcCredit(
  sql: VpcCreditSql,
  input: { userId: string; orderId: string },
): Promise<VpcCreditRecord | null> {
  const { userId, orderId } = input
  if (!userId || !orderId) return null
  const rows = await sql`
    UPDATE vpc_credits
    SET status = 'consumed', consumed_order_id = ${orderId}, consumed_at = NOW()
    WHERE user_id = ${userId} AND status = 'granted'
    RETURNING *
  `
  return rows[0] ? mapRow(rows[0]) : null
}
