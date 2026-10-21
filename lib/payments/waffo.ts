import { WaffoPancake } from '@waffo/pancake-ts'

const merchantId = process.env.WAFFO_MERCHANT_ID || ''
const privateKey = process.env.WAFFO_PRIVATE_KEY || ''
const testMode = process.env.WAFFO_TEST_MODE !== 'false'

/** 当前环境（test / prod）：既用于创建客户端，也用于 webhook 验签 */
export const WAFFO_ENVIRONMENT: 'test' | 'prod' = testMode ? 'test' : 'prod'

let waffoInstance: WaffoPancake | null = null

/** 懒加载 Waffo 客户端（缺失密钥时请先用 isWaffoConfigured 判断） */
export function getWaffo(): WaffoPancake {
  if (!waffoInstance) {
    waffoInstance = new WaffoPancake({
      merchantId,
      privateKey,
      environment: WAFFO_ENVIRONMENT,
    })
  }
  return waffoInstance
}

export function isWaffoConfigured(): boolean {
  return !!merchantId && !!privateKey
}

export type SubscriptionTier = 'free' | 'starter' | 'creator' | 'studio' | 'credits'

export interface WaffoPlan {
  /** Waffo 后台创建的 Product ID */
  productId: string
  name: string
  /** 写入 bookbunny_users.subscription_tier 的档位 */
  tier: SubscriptionTier
  price: number
  currency: string
  cycle: 'month' | 'year' | 'once'
  description: string
}

/** 4 档订阅 + 额度包（productId 需与 Waffo 后台 Product 一一对应） */
export const WAFFO_PLANS = {
  starter_monthly: {
    productId: process.env.WAFFO_STARTER_MONTHLY_PRODUCT_ID || '',
    name: 'Starter',
    tier: 'starter',
    price: 12,
    currency: 'USD',
    cycle: 'month',
    description: '10 books per month, no watermark, PDF export',
  },
  starter_annual: {
    productId: process.env.WAFFO_STARTER_ANNUAL_PRODUCT_ID || '',
    name: 'Starter',
    tier: 'starter',
    price: 108,
    currency: 'USD',
    cycle: 'year',
    description: '10 books per month, no watermark, PDF export — 2 months free',
  },
  creator_monthly: {
    productId: process.env.WAFFO_CREATOR_MONTHLY_PRODUCT_ID || '',
    name: 'Creator',
    tier: 'creator',
    price: 29,
    currency: 'USD',
    cycle: 'month',
    description: '30 books per month, KDP dual PDF, commercial license',
  },
  creator_annual: {
    productId: process.env.WAFFO_CREATOR_ANNUAL_PRODUCT_ID || '',
    name: 'Creator',
    tier: 'creator',
    price: 261,
    currency: 'USD',
    cycle: 'year',
    description: '30 books per month, KDP dual PDF, commercial license — 3 months free',
  },
  studio_monthly: {
    productId: process.env.WAFFO_STUDIO_MONTHLY_PRODUCT_ID || '',
    name: 'Studio',
    tier: 'studio',
    price: 59,
    currency: 'USD',
    cycle: 'month',
    description: '100 books per month, 3 concurrent jobs, batch generation',
  },
  studio_annual: {
    productId: process.env.WAFFO_STUDIO_ANNUAL_PRODUCT_ID || '',
    name: 'Studio',
    tier: 'studio',
    price: 531,
    currency: 'USD',
    cycle: 'year',
    description: '100 books per month, 3 concurrent jobs, batch generation — 3 months free',
  },
  credits_5: {
    productId: process.env.WAFFO_CREDITS_PRODUCT_ID || '',
    name: '5-Book Credit Pack',
    tier: 'credits',
    price: 9,
    currency: 'USD',
    cycle: 'once',
    description: '5 book credits that never expire',
  },
} as const satisfies Record<string, WaffoPlan>

export type WaffoPlanKey = keyof typeof WAFFO_PLANS

/** 套餐 key 对应的订阅档位（webhook / checkout 共用，避免各处硬编码） */
export function planTier(planKey: string): SubscriptionTier {
  const plan = WAFFO_PLANS[planKey as WaffoPlanKey]
  return plan ? plan.tier : 'starter'
}

export function getPlan(planKey: string): WaffoPlan | null {
  return WAFFO_PLANS[planKey as WaffoPlanKey] || null
}
