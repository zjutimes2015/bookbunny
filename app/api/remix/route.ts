import { NextRequest, NextResponse } from 'next/server'
import { generateStory } from '@/lib/api/story'
import { getSessionUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { requireHuman, attachPassCookie, humanCheckFailedResponse } from '@/lib/turnstile'
import { consumeBookAllocation, bookCostUnits } from '@/lib/allocation'
import { maxPagesFor } from '@/lib/tier-limits'
import { loadRemixSource, insertEpisode } from '@/lib/series'
import { buildSequelBrief, endingLine, isRemixKind, nextMoral } from '@/lib/remix'
import { outlineToPages } from '@/lib/types/book'

/**
 * 家庭内改写（remix）：同一主角 + 同一世界，再演一集。
 *
 * 三条硬边界：
 * 1. 必须登录 —— 主角只在家庭账户内存在，没有账户就没有可复用的孩子；
 * 2. 来源书必须属于当前用户 —— 这是「主角绝不共享」的架构落点，不是提示语；
 * 3. 新一集只写 series 关联，不产出任何可外传的合成资产。
 */
export async function POST(req: NextRequest) {
  try {
    const { bookId, kind, turnstileToken } = await req.json()

    if (typeof bookId !== 'string' || !bookId || !isRemixKind(kind)) {
      return NextResponse.json({ error: 'Invalid remix request' }, { status: 400 })
    }

    // 人机校验：续集会同时消耗 LLM 与生图额度，和创作走同一道门
    const human = await requireHuman(req, turnstileToken)
    if (!human.ok) return humanCheckFailedResponse()

    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Sign in to continue this series', code: 'auth_required' },
        { status: 401 },
      )
    }

    const source = await loadRemixSource(bookId)
    if (!source) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // 家庭隔离：这本书必须属于当前账户，且 series 归属一致
    if (!source.bookUserId || source.bookUserId !== user.id) {
      return NextResponse.json({ error: 'This book belongs to another family' }, { status: 403 })
    }
    if (!source.series) {
      return NextResponse.json(
        {
          error: 'This book has no saved protagonist yet. Create a new book to start a series.',
          code: 'no_series',
        },
        { status: 400 },
      )
    }
    if (source.series.userId !== user.id) {
      return NextResponse.json({ error: 'This series belongs to another family' }, { status: 403 })
    }

    const limit = user.isPaid || user.tier !== 'free' ? 100 : 30
    const rate = await checkRateLimit(`remix:user:${user.id}:day`, limit, 86400)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Daily episode limit reached. Try again tomorrow.', code: 'rate_limited' },
        { status: 429 },
      )
    }

    const series = source.series
    const world = series.worldSnapshot
    const episodeNumber = source.latestEpisode + 1
    const moral = nextMoral(world?.moralPool, source.moral, episodeNumber) ?? source.storyTheme
    const sequelBrief = buildSequelBrief({
      kind,
      episodeNumber,
      protagonistName: series.protagonistName,
      previousTitle: source.storyTitle,
      previousEnding: endingLine(source.content),
      worldName: world?.name,
      worldScene: world?.scene,
      cast: world?.characters,
      moral,
      forbidden: world?.forbiddenZones,
    })

    // 续集页数必须同时受两个约束：
    // 1. 上一集的实际页数（续集要跟原书一样长）
    // 2. 当前套餐的页数上限（Free 8 / 付费 12）
    // 不传 pages 会回退到 GRL 自带的页数（C=14 / D=16 / E=18），
    // 直接越过套餐上限，把生图成本顶穿毛利。
    const maxPages = maxPagesFor(user.tier, user.isPaid)
    const sequelPages = Math.min(
      Math.max(source.content.length || 8, 4),
      maxPages,
    )

    const story = await generateStory({
      theme: source.storyTheme || series.theme,
      ageGroup: source.ageGroup || series.ageGroup,
      characterName: series.protagonistName,
      pages: sequelPages,
      level: source.level ?? series.level ?? undefined,
      characterCards: series.protagonistCard ? [series.protagonistCard] : undefined,
      styleLexicon: series.styleLexicon ?? undefined,
      sequelBrief,
    })

    // 生成成功后才扣额度，避免 LLM 失败也扣掉一本
    // A4 画幅或 13 页以上的长书生图成本翻倍（FLUX 按 MP / 张数计费），扣 2 个额度单位
    const allocation = await consumeBookAllocation(user.id, bookCostUnits(source.aspect, sequelPages))
    if (!allocation.ok) {
      return NextResponse.json(
        { error: 'No credits or allowance left. Upgrade or buy credits to make more books.', code: 'no_allocation' },
        { status: 402 },
      )
    }

    const { storyId, bookId: newBookId } = await insertEpisode({
      userId: user.id,
      title: story.title,
      content: outlineToPages(story.outline),
      outline: story.outline,
      ageGroup: source.ageGroup || series.ageGroup,
      theme: source.storyTheme || series.theme,
      level: story.level ?? source.level ?? series.level ?? null,
      quiz: story.quiz ?? null,
      seriesId: series.id,
      episodeNumber,
      remixKind: kind,
      moral,
      aspect: source.aspect,
    })

    const res = NextResponse.json({
      bookId: newBookId,
      storyId,
      seriesId: series.id,
      episodeNumber,
      title: story.title,
      outline: story.outline,
      level: story.level ?? source.level ?? series.level,
      aspect: source.aspect,
      // 生图需要的复用资产（只在本人请求里返回）
      consistencyLine: series.protagonistConsistencyLine,
      style: series.style,
      protagonistImageUrl: series.protagonistImageUrl,
      moral,
    })
    return human.issued ? attachPassCookie(res) : res
  } catch (err) {
    console.error('Remix error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
