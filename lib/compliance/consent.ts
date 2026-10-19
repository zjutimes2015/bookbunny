/**
 * Parental-consent layer.
 *
 * A parent must clear a verifiable-parental-consent (VPC) step before we accept a
 * child's photograph. Everything about that decision lives in this file, so the
 * verification method can be swapped without touching the rest of the product.
 *
 * A consent record is only ever written by a server-side route, never by the browser.
 */
import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'node:crypto'
import { POLICY_VERSION } from '@/lib/site'

/** Purposes for which a child's personal information may be processed. */
export type ConsentPurpose = 'photo-processing'

export interface ConsentPurposeInfo {
  id: ConsentPurpose
  /** Short title shown next to the checkbox in the consent notice. */
  label: string
  /** Plain-English explanation of what actually happens to the data. */
  description: string
}

export const CONSENT_PURPOSES: ConsentPurposeInfo[] = [
  {
    id: 'photo-processing',
    label: "Use my child's photograph to build an illustrated character",
    description:
      'The photograph is sent to our image-generation provider to derive an illustrated character, then used as a visual reference for the pages of the book. The photograph itself is not written to our database or object storage and is not kept after the character has been generated.',
  },
]

export type VpcMethodId = 'card-charge' | 'gov-id' | 'email-plus' | 'signed-form'

export interface VpcMethod {
  id: VpcMethodId
  label: string
  description: string
  /** What the parent has to have at hand before starting. */
  requires: string
  /** True when the parent can complete the step on their own, with no staff involvement. */
  automated: boolean
  /** True when this build can actually complete the method. */
  available: boolean
}

export const VPC_METHODS: VpcMethod[] = [
  {
    id: 'card-charge',
    label: 'Payment-card verification',
    description:
      'We place a small charge on your payment card through our payment provider, then refund it. A card held in your own name is one of the verification methods recognised for obtaining verifiable parental consent.',
    requires: 'A credit or debit card in your name',
    automated: true,
    available: true,
  },
  {
    id: 'gov-id',
    label: 'Government-issued ID check',
    description:
      'You upload a government-issued photo ID. It is checked against a records database to confirm you are an adult, and the ID image is deleted immediately afterwards.',
    requires: 'A passport or driving licence, plus an identity-verification vendor',
    automated: true,
    available: false,
  },
  {
    id: 'email-plus',
    label: 'Email plus a second step',
    description:
      'You confirm by email and then complete a second step over SMS or a live call, so that an adult — not the child — is the person who agrees.',
    requires: 'A phone number, plus an SMS or telephony provider',
    automated: true,
    available: false,
  },
  {
    id: 'signed-form',
    label: 'Signed consent form',
    description:
      'You download, sign and return a written consent form. Our team reviews the returned form by hand before your child\u2019s photograph is accepted.',
    requires: 'A printer or a scanned signature, plus manual review by our team',
    automated: false,
    available: false,
  },
]

export interface ConsentRecord {
  id: string
  userId: string
  policyVersion: string
  purposes: ConsentPurpose[]
  vpcMethod: VpcMethodId
  vpcReference: string | null
  vpcAmountCents: number | null
  vpcVerifiedAt: string | null
  grantedAt: string
  revokedAt: string | null
}

const sql = neon(process.env.NEON_DATABASE_URL!)

function mapRow(row: Record<string, unknown>): ConsentRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    policyVersion: String(row.policy_version),
    purposes: (row.purposes ?? []) as ConsentPurpose[],
    vpcMethod: row.vpc_method as VpcMethodId,
    vpcReference: (row.vpc_reference as string) ?? null,
    vpcAmountCents: (row.vpc_amount_cents as number) ?? null,
    vpcVerifiedAt: (row.vpc_verified_at as string) ?? null,
    grantedAt: String(row.granted_at),
    revokedAt: (row.revoked_at as string) ?? null,
  }
}

/** The parent's live consent, if any. Returns null when never granted or already revoked. */
export async function getActiveConsent(userId: string): Promise<ConsentRecord | null> {
  if (!userId) return null
  const rows = await sql`
    SELECT * FROM parental_consents
    WHERE user_id = ${userId} AND revoked_at IS NULL
    LIMIT 1
  `
  return rows[0] ? mapRow(rows[0]) : null
}

/**
 * True only when a live consent exists, it was granted under the current policy
 * version, and it covers the requested purpose. A policy-version bump therefore
 * invalidates every older consent and forces a fresh agreement.
 */
export async function hasConsent(
  userId: string,
  purpose: ConsentPurpose = 'photo-processing',
): Promise<boolean> {
  const record = await getActiveConsent(userId)
  if (!record) return false
  if (record.policyVersion !== POLICY_VERSION) return false
  return record.purposes.includes(purpose)
}

export interface GrantConsentInput {
  userId: string
  purposes?: ConsentPurpose[]
  vpcMethod: VpcMethodId
  /** Provider-side identifier for the verification step (order id, verification id). */
  vpcReference?: string | null
  vpcAmountCents?: number | null
  consentIp?: string | null
  consentUserAgent?: string | null
}

/**
 * Write a verified consent. Call this only after the VPC step actually succeeded —
 * it is the moment the parent becomes allowed to upload a child's photograph.
 */
export async function recordConsent(input: GrantConsentInput): Promise<ConsentRecord> {
  const id = randomUUID()
  const purposes = input.purposes?.length ? input.purposes : (['photo-processing'] as ConsentPurpose[])

  // Retire any older live record first so the unique partial index cannot collide.
  await sql`
    UPDATE parental_consents
    SET revoked_at = NOW(), revoked_reason = 'superseded'
    WHERE user_id = ${input.userId} AND revoked_at IS NULL
  `

  await sql`
    INSERT INTO parental_consents
      (id, user_id, policy_version, purposes, vpc_method, vpc_reference, vpc_amount_cents,
       vpc_verified_at, consent_ip, consent_user_agent)
    VALUES
      (${id}, ${input.userId}, ${POLICY_VERSION}, ${purposes}, ${input.vpcMethod},
       ${input.vpcReference ?? null}, ${input.vpcAmountCents ?? null}, NOW(),
       ${input.consentIp ?? null}, ${input.consentUserAgent ?? null})
  `

  const record = await getActiveConsent(input.userId)
  if (!record) throw new Error('Consent insert did not persist')
  return record
}

/** Withdraw consent. Photo uploads are blocked again immediately. */
export async function revokeConsent(userId: string, reason = 'parent-request'): Promise<void> {
  await sql`
    UPDATE parental_consents
    SET revoked_at = NOW(), revoked_reason = ${reason}
    WHERE user_id = ${userId} AND revoked_at IS NULL
  `
}

/** Methods this build can actually complete, for rendering the chooser. */
export function availableVpcMethods(): VpcMethod[] {
  return VPC_METHODS.filter((m) => m.available)
}
