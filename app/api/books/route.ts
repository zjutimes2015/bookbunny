import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { outlineToPages, type CharacterCard, type PageOutline, type StyleLexicon } from '@/lib/types/book'
import { consumeBookAllocation, bookCostUnits } from '@/lib/allocation'
import { createSeries } from '@/lib/series'
import { getWorld, toWorldSnapshot } from '@/lib/worlds'
import { isR2Configured, uploadBase64Image, characterKey } from '@/lib/r2'

const sql = neon(process.env.NEON_DATABASE_URL!)

/** 主角档案：只在创建者账户内保存，绝不进入共享池 */
interface CharacterPayload {
  name?: string
  card?: CharacterCard
  consistencyLine?: string
  imageB64?: string
  style?: string
  styleLexicon?: StyleLexicon
}

interface SaveBookBody {
  title: string
  pages?: string[]
  outline?: PageOutline[]
  ageGroup: string
  theme: string
  level?: string | null
  quiz?: unknown | null
  aspect?: string | null
  character?: CharacterPayload | null
  /** 官方世界（第 1 集从世界库进入时带上）：服务端按 id 取档案并冻结成快照 */
  worldId?: string | null
  /** 这一集要教的寓意（家长在世界详情页挑的那条） */
  moral?: string | null
}

// 从 cookie 解析当前用户 + 其 credits / allowance 状态
async function getUserId(req: NextRequest): Promise<{
  id: string | null
  credits: number
  tier: string
  isPaid: boolean
  allowanceRemaining: number | null
  allowanceResetAt: Date | null
} | null> {
  const token = req.cookies.get('auth_token')?.value
  if (!token) return null
  try {
    const rows = await sql`
      SELECT u.id, u.credits, u.subscription_tier, u.is_paid,
             u.monthly_allowance_remaining, u.allowance_reset_at
      FROM bookbunny_users u
      JOIN auth_sessions s ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
      LIMIT 1
    `
    const row = rows[0]
    if (!row) return null
    return {
      id: row.id as string,
      credits: (row.credits as number) ?? 0,
      tier: (row.subscription_tier as string) || 'free',
      isPaid: Boolean(row.is_paid),
      allowanceRemaining: row.monthly_allowance_remaining as number | null,
      allowanceResetAt: row.allowance_reset_at as Date | null,
    }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SaveBookBody

    const hasOutline = Array.isArray(body.outline) && body.outline.length > 0
    const hasPages = Array.isArray(body.pages) && body.pages.length > 0

    if (!body.title || (!hasOutline && !hasPages)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // content = 页面文字投影（优先从 outline 提取，回退到旧的 pages）
    const content = hasOutline ? outlineToPages(body.outline!) : (body.pages as string[])
    const outlineJson = hasOutline ? JSON.stringify(body.outline) : null

    const user = await getUserId(req)

    // 1. 保存 story（含 outline jsonb + level + quiz JSON）
    const quizJson = body.quiz ? JSON.stringify(body.quiz) : null
    const storyResult = await sql`
      INSERT INTO stories (title, content, outline, age_group, theme, level, quiz)
      VALUES (${body.title}, ${content}, ${outlineJson}::jsonb, ${body.ageGroup}, ${body.theme}, ${body.level || null}, ${quizJson})
      RETURNING id
    `
    const storyId = storyResult[0]?.id
    if (!storyId) throw new Error('Failed to insert story')

    // 2. 保存 book（关联 story + 用户，冗余 level 便于列表查询）
    const bookResult = await sql`
      INSERT INTO books (title, story_id, user_id, status, format, level, aspect)
      VALUES (${body.title}, ${storyId}, ${user?.id ?? null}, 'ready', 'ebook', ${body.level || null}, ${body.aspect || null})
      RETURNING id
    `
    const bookId = bookResult[0]?.id
    if (!bookId) throw new Error('Failed to insert book')

    // 3. 扣减 credits / 月度 allowance（游客 user.id 为 null 时跳过，免费游客不扣费）
    //    A4 画幅生图成本翻倍（FLUX 按 MP 计费），扣 2 个额度单位
    if (user?.id) {
      const alloc = await consumeBookAllocation(user.id, bookCostUnits(body.aspect))
      if (!alloc.ok) {
        // book 已经保存了，但 allocation 扣减失败。我们已经初始化过 free tier 的 allowance，
        // 所以走到这里说明 credits=0 且 allowance=0。返回 402 让前端引导用户升级。
        return NextResponse.json(
          { error: 'No credits or allowance left. Upgrade or buy credits to make more books.', code: 'no_allocation' },
          { status: 402 },
        )
      }
    }

    // 4. 家庭连续剧：有主角档案时建 series，供「再来一集」复用同一个孩子。
    //    series.user_id 是隔离边界：世界作者与其它家庭永远读不到这张主角卡。
    let seriesId: string | null = null
    const character = body.character
    if (user?.id && character?.name) {
      let protagonistImageUrl: string | null = null
      if (character.imageB64 && isR2Configured()) {
        try {
          protagonistImageUrl = await uploadBase64Image(
            characterKey(globalThis.crypto.randomUUID()),
            `data:image/png;base64,${character.imageB64}`,
          )
        } catch (err) {
          console.error('Protagonist upload to R2 failed:', err)
        }
      }
      try {
        // 世界档案以服务端读取为准，不信任客户端传来的快照
        const world = body.worldId ? await getWorld(body.worldId) : null
        seriesId = await createSeries({
          userId: user.id,
          title: body.title,
          protagonistName: character.name,
          protagonistCard: character.card ?? null,
          consistencyLine: character.consistencyLine ?? null,
          protagonistImageUrl,
          style: character.style ?? null,
          styleLexicon: character.styleLexicon ?? null,
          theme: body.theme,
          ageGroup: body.ageGroup,
          level: body.level ?? null,
          worldId: world?.id ?? null,
          worldSnapshot: world ? toWorldSnapshot(world) : null,
        })
        await sql`
          UPDATE stories
          SET series_id = ${seriesId}, episode_number = 1, moral = ${body.moral ?? null}
          WHERE id = ${storyId}
        `
      } catch (err) {
        // 连续剧建不起来不该挡住这本书的保存，降级为「不可续集」
        console.error('Series creation failed:', err)
        seriesId = null
      }
    }

    return NextResponse.json({ bookId, storyId, seriesId })
  } catch (err) {
    console.error('Save book error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
