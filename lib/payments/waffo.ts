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

export type SubscriptionTier = 'free' | 'creator' | 'studio' | 'credits' | 'pro-anim'

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
  /** 购买/续期时发放的额度数（Pro 包：Pro 动画额度；订阅档位不用此字段） */
  grant?: number
}

/**
 * 产品矩阵（productId 需与 Waffo 后台 SproutTales 店铺一一对应）
 *
 * 订阅：Creator $29/月 · $261/年；Studio $79/月 · $711/年
 * 一次性：Pro Animation Pack $55 / 5 本 · $100 / 10 本
 *
 * 定价按「满额使用仍有 80% 毛利」反推，改动前先核对成本：
 * 普通书 ≈ 页数 × $0.06（FLUX.2 flex）；Pro 动画 ≈ 页数 × $0.25（Wan 3 480p 5s）。
 */
export const WAFFO_PLANS = {
  creator_monthly: {
    productId: process.env.WAFFO_CREATOR_MONTHLY_PRODUCT_ID || '',
    name: 'Creator',
    tier: 'creator',
    price: 29,
    currency: 'USD',
    cycle: 'month',
    description: '8 books per month, up to 12 pages, KDP dual PDF, commercial license',
  },
  creator_annual: {
    productId: process.env.WAFFO_CREATOR_ANNUAL_PRODUCT_ID || '',
    name: 'Creator',
    tier: 'creator',
    price: 261,
    currency: 'USD',
    cycle: 'year',
    description: '6 books per month, up to 12 pages, KDP dual PDF, commercial license',
  },
  studio_monthly: {
    productId: process.env.WAFFO_STUDIO_MONTHLY_PRODUCT_ID || '',
    name: 'Studio',
    tier: 'studio',
    price: 79,
    currency: 'USD',
    cycle: 'month',
    description: '22 books per month, up to 12 pages, KDP dual PDF, batch generation',
  },
  studio_annual: {
    productId: process.env.WAFFO_STUDIO_ANNUAL_PRODUCT_ID || '',
    name: 'Studio',
    tier: 'studio',
    price: 711,
    currency: 'USD',
    cycle: 'year',
    description: '16 books per month, up to 12 pages, KDP dual PDF, batch generation',
  },
  pro_anim_5: {
    productId: process.env.WAFFO_PRO_ANIM_5_PRODUCT_ID || '',
    name: 'Pro Animation Pack · 5',
    tier: 'pro-anim',
    price: 55,
    currency: 'USD',
    cycle: 'once',
    description: '5 Pro animated books (video + voice + music), never expire',
    grant: 5,
  },
  pro_anim_10: {
    productId: process.env.WAFFO_PRO_ANIM_10_PRODUCT_ID || '',
    name: 'Pro Animation Pack · 10',
    tier: 'pro-anim',
    price: 100,
    currency: 'USD',
    cycle: 'once',
    description: '10 Pro animated books (video + voice + music), never expire',
    grant: 10,
  },
} as const satisfies Record<string, WaffoPlan>

export type WaffoPlanKey = keyof typeof WAFFO_PLANS

/** 每本 Pro 动画消耗的 Pro 额度。
 * 用户看到的是「本数」，数据库里存的是 credits（1 本 = 3 credits）。
 */
export const PRO_CREDITS_PER_BOOK = 3

/**
 * Pro 动画视频交付是否已上线。
 * 已用一本 8 页的真实书在生产跑通：逐页动画 + 配音 → R2 → ffmpeg 合成 → 成品 MP4。
 */
export const PRO_DELIVERY_READY = true

/** 套餐 key 对应的订阅档位；未知 plan（如已下架的历史套餐）返回 null */
export function planTier(planKey: string): SubscriptionTier | null {
  const plan = WAFFO_PLANS[planKey as WaffoPlanKey]
  return plan ? plan.tier : null
}

/** 一次性商品发放的额度数；订阅档位返回 0 */
export function planGrant(planKey: string): number {
  const plan = WAFFO_PLANS[planKey as WaffoPlanKey] as WaffoPlan | undefined
  return plan?.grant ?? 0
}

/**
 * 套餐的计费周期：年付 / 月付 / 一次性。
 * 用于区分月度 allowance——年付价格只有月付的 75%，额度必须同步下调。
 */
export function planCycle(planKey: string): 'month' | 'year' {
  const plan = WAFFO_PLANS[planKey as WaffoPlanKey] as WaffoPlan | undefined
  return plan?.cycle === 'year' ? 'year' : 'month'
}

export function getPlan(planKey: string): WaffoPlan | null {
  return WAFFO_PLANS[planKey as WaffoPlanKey] || null
}
