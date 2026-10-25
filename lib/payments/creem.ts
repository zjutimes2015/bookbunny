import { Creem } from 'creem'

/**
 * Creem is used only for the parental-consent verification charge (VPC).
 * Subscriptions and credit packs are sold through Waffo — see lib/payments/waffo.ts.
 */
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

/**
 * Verifiable-parental-consent charge: a small card charge placed on the parent's own
 * instrument, which is one of the recognised ways to obtain verifiable parental consent.
 * This is NOT a subscription and never grants plan entitlements.
 */
export const VPC_VERIFICATION = {
  productId: process.env.CREEM_VPC_PRODUCT_ID || 'prod_vpc_verification',
  priceCents: 50,
  name: 'Parental Consent Verification',
} as const
