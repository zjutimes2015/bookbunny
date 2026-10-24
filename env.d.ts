/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    // 基础
    NEON_DATABASE_URL: string
    OPENROUTER_API_KEY: string
    SITE_URL: string

    // 后台管理白名单（逗号分隔）
    ADMIN_EMAILS?: string

    // 人机校验（Turnstile）
    TURNSTILE_SECRET_KEY?: string
    NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string

    // 登录（Google OAuth）
    GOOGLE_CLIENT_ID?: string
    GOOGLE_CLIENT_SECRET?: string

    // 对象存储（Cloudflare R2）
    R2_ACCOUNT_ID?: string
    R2_ACCESS_KEY?: string
    R2_SECRET_KEY?: string
    R2_BUCKET?: string
    R2_PUBLIC_URL?: string

    // 支付：Waffo
    WAFFO_MERCHANT_ID?: string
    WAFFO_PRIVATE_KEY?: string
    WAFFO_TEST_MODE?: string
    WAFFO_STARTER_MONTHLY_PRODUCT_ID?: string
    WAFFO_STARTER_ANNUAL_PRODUCT_ID?: string
    WAFFO_CREATOR_MONTHLY_PRODUCT_ID?: string
    WAFFO_CREATOR_ANNUAL_PRODUCT_ID?: string
    WAFFO_STUDIO_MONTHLY_PRODUCT_ID?: string
    WAFFO_STUDIO_ANNUAL_PRODUCT_ID?: string
    WAFFO_CREDITS_PRODUCT_ID?: string

    // 支付：Creem（旧通道）
    CREEM_API_KEY?: string
    CREEM_TEST_MODE?: string
    CREEM_WEBHOOK_SECRET?: string
    CREEM_PRO_PRODUCT_ID?: string
    CREEM_COMMERCIAL_PRODUCT_ID?: string
    CREEM_VPC_PRODUCT_ID?: string

    // 邮件（Resend）
    RESEND_API_KEY?: string
    EMAIL_FROM?: string

    // 定时任务
    CRON_SECRET?: string

    // 运营与法务
    DISCORD_WEBHOOK_URL?: string
    NEXT_PUBLIC_GA_ID?: string
    NEXT_PUBLIC_CRISP_WEBSITE_ID?: string
    LEGAL_ENTITY?: string
    LEGAL_CONTACT_EMAIL?: string
    LEGAL_JURISDICTION?: string
  }
}
