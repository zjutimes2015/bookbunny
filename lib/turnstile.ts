import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * 人机校验（Cloudflare Turnstile）。
 *
 * Turnstile token 是一次性的，而一次创作会连续调用 create-character /
 * create-story / generate-pages。因此这里把「token 校验通过」换成一张短时
 * 有效的签名通行证（httpOnly cookie），后续接口只认这张通行证：
 *
 *   客户端拿到 token → POST /api/verify-turnstile → 服务端验签 → 下发 bb_human
 *   三个生成接口 → requireHuman() → 优先看 bb_human，其次看请求里直接带的 token
 *
 * 通行证用 HMAC 自签，不落库；密钥缺失时生产环境一律拒绝（fail-closed）。
 */

export const HUMAN_COOKIE = 'bb_human'

/** 通行证有效期：覆盖一次完整的「角色 → 大纲 → 分批生图」流程 */
const PASS_TTL_SEC = 2 * 60 * 60

/** 仅本地开发使用：没有 secret 时也要能跑通完整创作流程 */
const DEV_PASS_SECRET = 'sprouttales-dev-human-pass'

function passSecret(): string | null {
  const configured = process.env.TURNSTILE_SECRET_KEY
  if (configured) return configured
  if (process.env.NODE_ENV === 'production') return null
  return DEV_PASS_SECRET
}

export function isTurnstileConfigured(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/** 生成通行证值：`<过期时间戳>.<HMAC>` */
export function issuePassValue(now = Date.now()): string {
  const secret = passSecret()
  if (!secret) return ''
  const exp = Math.floor(now / 1000) + PASS_TTL_SEC
  return `${exp}.${sign(String(exp), secret)}`
}

/** 校验通行证值（签名 + 未过期） */
export function verifyPassValue(value: string | undefined | null, now = Date.now()): boolean {
  const secret = passSecret()
  if (!secret || !value) return false

  const [expRaw, sig] = value.split('.')
  if (!expRaw || !sig) return false

  const exp = Number(expRaw)
  if (!Number.isFinite(exp) || exp * 1000 <= now) return false

  const expected = sign(expRaw, secret)
  if (expected.length !== sig.length) return false
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  } catch {
    return false
  }
}

/** 给响应写入通行证 cookie */
export function attachPassCookie(res: NextResponse): NextResponse {
  const value = issuePassValue()
  if (!value) return res
  res.cookies.set(HUMAN_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PASS_TTL_SEC,
    path: '/',
  })
  return res
}

/**
 * 调用 Cloudflare siteverify。
 * 未配置 secret 时：非生产环境放行测试 token（1x/2x/3x 开头），生产环境拒绝。
 */
export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  if (!token) return false

  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return false
    return /^[123]x/.test(token)
  }

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip && ip !== 'unknown') body.set('remoteip', ip)

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = (await res.json()) as { success?: boolean }
    return !!data.success
  } catch {
    return false
  }
}

export interface HumanCheck {
  ok: boolean
  /** 本次是通过 token 校验换来的新通行证，调用方应把 cookie 写回响应 */
  issued: boolean
}

/**
 * 生成接口的人机校验入口。
 * 已有有效通行证 → 直接通过；否则用请求携带的 token 换一张。
 */
export async function requireHuman(
  req: NextRequest,
  token?: string | null,
): Promise<HumanCheck> {
  if (verifyPassValue(req.cookies.get(HUMAN_COOKIE)?.value)) {
    return { ok: true, issued: false }
  }

  if (token) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    if (await verifyTurnstileToken(token, ip)) {
      return { ok: true, issued: true }
    }
  }

  return { ok: false, issued: false }
}

/** 统一的 403 响应体（客户端据此提示「请完成人机验证」） */
export function humanCheckFailedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Human verification required. Please refresh and try again.', code: 'bot_check_required' },
    { status: 403 },
  )
}
