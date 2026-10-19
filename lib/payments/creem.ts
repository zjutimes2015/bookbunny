import { Creem } from 'creem'

const apiKey = process.env.CREEM_API_KEY || ''
const testMode = process.env.CREEM_TEST_MODE !== 'false'

let creemInstance: Creem | null = null

export function getCreem(): Creem {
  if (!creemInstance) {
    creemInstance = new Creem({
      apiKey,
      server: testMode ? 'test' : 'prod',
    })
  }
  return creemInstance
}

export function isCreemConfigured(): boolean {
  return !!process.env.CREEM_API_KEY
}

// Plan config — match these IDs to your Creem dashboard products
export const PLANS = {
  pro: {
    productId: process.env.CREEM_PRO_PRODUCT_ID || 'prod_pro',
    name: 'Pro',
    price: 9.99,
    description: 'Unlimited books, photo-to-character, KDP export',
  },
  commercial: {
    productId: process.env.CREEM_COMMERCIAL_PRODUCT_ID || 'prod_commercial',
    name: 'Commercial',
    price: 49,
    description: 'Everything in Pro + commercial rights + multi-character',
  },
} as const

export type PlanKey = keyof typeof PLANS

/**
 * Verifiable-parental-consent charge: a small card charge placed on the parent's own
 * instrument, which is one of the recognised ways to obtain verifiable parental consent.
 * This is NOT a subscription. The webhook branches on `metadata.purpose === 'vpc'` and
 * must never grant plan entitlements for it.
 */
export const VPC_VERIFICATION = {
  productId: process.env.CREEM_VPC_PRODUCT_ID || 'prod_vpc_verification',
  priceCents: 50,
  name: 'Parental Consent Verification',
} as const
