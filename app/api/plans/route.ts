import { NextResponse } from 'next/server'
import { isPlanPurchasable, WAFFO_PLANS } from '@/lib/payments/waffo'

/**
 * 当前可购买的套餐列表。
 *
 * 订阅档位必须在 Waffo 后台先建好商品，productId 来自环境变量。
 * 定价页据此把「开售中」的按钮点亮、其余置灰，避免用户点到一个必然
 * 失败的结账页。接口不返回任何密钥，只有套餐 key 与价格。
 */
export function GET() {
  const plans = Object.entries(WAFFO_PLANS).map(([key, plan]) => ({
    key,
    name: plan.name,
    price: plan.price,
    cycle: plan.cycle,
    purchasable: isPlanPurchasable(key),
  }))
  return NextResponse.json({ plans })
}
