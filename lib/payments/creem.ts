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
