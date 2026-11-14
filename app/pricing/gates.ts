/**
 * 定价页功能开关（pricing page feature gates）。
 *
 * 两个开关都是客户端变量（NEXT_PUBLIC_ 前缀），由 'use client' 的定价页直接
 * 读取——与 NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_TURNSTILE_SITE_KEY 的既有惯例一致，
 * 没有服务端镜像变量。默认全部关闭：未设置（或任何非 'true' 值）= 关闭。
 *
 * - NEXT_PUBLIC_ANNUAL_BILLING_ENABLED=true：开启新的 5 折年付价
 *   （年付总额 = 月付 × 12 × 0.5），且默认选中 Yearly。注意：5 折价的新 Waffo
 *   年付商品尚未创建，开启后年付按钮显示 Coming soon 且不可下单，避免用户
 *   被旧商品价收费；关闭时页面保持现有 25% 年付价与月付默认（即今天的页面）。
 * - NEXT_PUBLIC_BOOK_PACKS_ENABLED=true：在订阅档位下方显示单本 / 3 本书包
 *   卡片。书包尚无 Waffo 商品与定价，卡片只显示 coming soon，不显示价格、
 *   不可下单；关闭时卡片完全不存在，页面与今天一致。
 *
 * 纯函数：测试不依赖真实环境变量注入方式，可直接断言。
 */

export interface PricingGates {
  /** 5 折年付价 + 默认 Yearly */
  annualBilling50: boolean
  /** 书包卡片（coming soon 占位） */
  bookPacks: boolean
}

/** 只有显式 'true' 才开启；未设置、空串、'false'、'1' 一律关闭。 */
export function isGateOn(value: string | undefined): boolean {
  return value === 'true'
}

/**
 * Read the two pricing gates from their raw env values. The caller passes
 * `process.env.NEXT_PUBLIC_*` (Next inlines NEXT_PUBLIC_ vars at build time);
 * keeping the raw values as the input keeps this helper pure and testable
 * without depending on how the caller obtained them.
 */
export function readPricingGates(values: {
  annualBillingEnabled?: string
  bookPacksEnabled?: string
}): PricingGates {
  return {
    annualBilling50: isGateOn(values.annualBillingEnabled),
    bookPacks: isGateOn(values.bookPacksEnabled),
  }
}
