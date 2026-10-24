import { NextRequest, NextResponse } from 'next/server'
import { generateStory } from '@/lib/api/story'
import { getSessionUser, getClientIp } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { requireHuman, attachPassCookie, humanCheckFailedResponse } from '@/lib/turnstile'

/** 套餐页数上限：游客/Free 8 / Starter 12 / Creator 20 / Studio 24 */
function maxPagesFor(tier: string | undefined, isPaid: boolean): number {
  if (!tier && !isPaid) return 8
  if (tier === 'studio' || tier === 'commercial') return 24
  if (tier === 'creator') return 20
  if (tier === 'starter') return 12
  return 8
}

export async function POST(req: NextRequest) {
  try {
    const { theme, ageGroup, characterName, pages, level, styleLexicon, styleCard, characterCards, language, turnstileToken } = await req.json()

    if (!theme || !ageGroup || !characterName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 人机校验：Turnstile 不是前端装饰，LLM 成本必须挡在服务端
    const human = await requireHuman(req, turnstileToken)
    if (!human.ok) return humanCheckFailedResponse()

    const user = await getSessionUser(req)
    const limit = user ? (user.isPaid || user.tier !== 'free' ? 100 : 30) : 10
    const rateKey = user ? `story:user:${user.id}:day` : `story:ip:${getClientIp(req)}:day`
    const rate = await checkRateLimit(rateKey, limit, 86400)
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: user
            ? 'Daily story limit reached. Try again tomorrow.'
            : 'Free trial limit reached. Sign in to keep creating books.',
          code: 'rate_limited',
        },
        { status: 429 },
      )
    }

    // 服务端兜底：页数不得超过当前套餐上限
    const maxPages = maxPagesFor(user?.tier, user?.isPaid ?? false)
    const pageCount = Math.min(Math.max(Number(pages) || 8, 4), maxPages)

    const story = await generateStory({
      theme,
      ageGroup,
      characterName,
      pages: pageCount,
      level, // 可选：GRL 分级（'A' - 'E'）
      styleLexicon, // 可选：风格层（固定风格词库）
      styleCard, // 可选：风格设定卡
      characterCards, // 可选：角色设定卡（一致性）
      language, // 可选：内容语言（缺省英语）
    })

    const res = NextResponse.json(story)
    // 本次是用 token 换来的通行证 → 写回 cookie，后续接口直接复用
    return human.issued ? attachPassCookie(res) : res
  } catch (err) {
    console.error('Story generation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
