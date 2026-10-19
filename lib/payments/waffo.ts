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

// 套餐配置 —— productId 需与 Waffo 后台创建的 Product 对应
export const WAFFO_PLANS = {
  pro: {
    productId: process.env.WAFFO_PRO_PRODUCT_ID || '',
    name: 'Pro',
    price: 9.99,
    currency: 'USD',
    description: 'Unlimited books, photo-to-character, KDP export',
  },
  commercial: {
    productId: process.env.WAFFO_COMMERCIAL_PRODUCT_ID || '',
    name: 'Commercial',
    price: 49,
    currency: 'USD',
    description: 'Everything in Pro + commercial rights + multi-character',
  },
} as const

export type WaffoPlanKey = keyof typeof WAFFO_PLANS
