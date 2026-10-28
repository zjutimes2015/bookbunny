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

export type SubscriptionTier = 'free' | 'creator' | 'studio' | 'teacher' | 'credits' | 'pro-anim'

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
 * 订阅：Creator $29/月 · $261/年；Studio $79/月 · $711/年；Teacher $99/月 · $891/年
 * 一次性：Pro Animation Pack $55 / 5 本 · $100 / 10 本
 *
 * 定价按「满额使用仍有 80% 毛利」反推，改动前先核对成本：
 * 普通书 ≈ 页数 × $0.06（FLUX.2 flex）；Pro 动画 ≈ 页数 × $0.25（Wan 3 480p 5s）。
 *
 * productId 用 getter 读取：环境变量在模块加载时未必就绪（脚本、测试、
 * 生产部署的注入时机不同），懒读取保证「配置变了立即生效」。
 */
export const WAFFO_PLANS = {
  creator_monthly: {
    get productId() { return process.env.WAFFO_CREATOR_MONTHLY_PRODUCT_ID || '' },
    name: 'Creator',
    tier: 'creator',
    price: 29,
    currency: 'USD',
    cycle: 'month',
    description: '8 books per month, up to 16 pages, KDP dual PDF, commercial license',
  },
  creator_annual: {
    get productId() { return process.env.WAFFO_CREATOR_ANNUAL_PRODUCT_ID || '' },
    name: 'Creator',
    tier: 'creator',
    price: 261,
    currency: 'USD',
    cycle: 'year',
    description: '6 books per month, up to 16 pages, KDP dual PDF, commercial license',
  },
  studio_monthly: {
    get productId() { return process.env.WAFFO_STUDIO_MONTHLY_PRODUCT_ID || '' },
    name: 'Studio',
    tier: 'studio',
    price: 79,
    currency: 'USD',
    cycle: 'month',
    description: '22 books per month, up to 24 pages, KDP dual PDF, batch generation',
  },
  studio_annual: {
    get productId() { return process.env.WAFFO_STUDIO_ANNUAL_PRODUCT_ID || '' },
    name: 'Studio',
    tier: 'studio',
    price: 711,
    currency: 'USD',
    cycle: 'year',
    description: '16 books per month, up to 24 pages, KDP dual PDF, batch generation',
  },
  teacher_monthly: {
    get productId() { return process.env.WAFFO_TEACHER_MONTHLY_PRODUCT_ID || '' },
    name: 'Teacher',
    tier: 'teacher',
    price: 99,
    currency: 'USD',
    cycle: 'month',
    description: '40 books per month, up to 24 pages, GRL leveled vocabulary lists, classroom sheets',
  },
  teacher_annual: {
    get productId() { return process.env.WAFFO_TEACHER_ANNUAL_PRODUCT_ID || '' },
    name: 'Teacher',
    tier: 'teacher',
    price: 891,
    currency: 'USD',
    cycle: 'year',
    description: '30 books per month, up to 24 pages, GRL leveled vocabulary lists, classroom sheets',
  },
  pro_anim_5: {
    get productId() { return process.env.WAFFO_PRO_ANIM_5_PRODUCT_ID || '' },
    name: 'Pro Animation Pack · 5',
    tier: 'pro-anim',
    price: 55,
    currency: 'USD',
    cycle: 'once',
    description: '5 Pro animated books (video + voice + music), never expire',
    grant: 5,
  },
  pro_anim_10: {
    get productId() { return process.env.WAFFO_PRO_ANIM_10_PRODUCT_ID || '' },
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

/**
 * 该套餐是否已开售。
 *
 * 订阅档位必须在 Waffo 后台先建好商品（productId），否则结账会话会失败。
 * productId 来自环境变量，缺失时前端就把购买按钮置灰，
 * 避免用户点下去撞到一个必然失败的结账页。
 */
export function isPlanPurchasable(planKey: string): boolean {
  const plan = WAFFO_PLANS[planKey as WaffoPlanKey]
  if (!plan) return false
  if (!plan.productId) return false
  // Pro 动画面包另有「交付是否上线」的总闸
  if (plan.tier === 'pro-anim') return PRO_DELIVERY_READY
  return true
}
