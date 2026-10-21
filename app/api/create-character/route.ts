import { NextRequest, NextResponse } from 'next/server'
import { generateCharacterCard } from '@/lib/api/character'
import { hasConsent } from '@/lib/compliance/consent'
import { getSessionUser, getClientIp } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { isR2Configured, uploadBase64Image } from '@/lib/r2'
import type { CharacterCard, StyleLexicon, BookLanguage } from '@/lib/types/book'

const PHOTO_USAGES: CharacterCard['photoUsage'][] = ['illustrated', 'photo-family', 'photo-public']

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const name = (formData.get('name') as string) || 'Hero'
    const photo = formData.get('photo') as File | null
    const theme = (formData.get('theme') as string) || ''
    const ageGroup = (formData.get('ageGroup') as string) || '3-5'
    const styleName = (formData.get('styleName') as string) || ''
    const usageRaw = (formData.get('photoUsage') as string) || 'illustrated'
    const photoUsage = (PHOTO_USAGES as string[]).includes(usageRaw)
      ? (usageRaw as CharacterCard['photoUsage'])
      : 'illustrated'
    const lexiconRaw = formData.get('styleLexicon') as string | null
    // 可选：内容语言（缺省英语）；非法值交由 lib 兜底为英语
    const language = ((formData.get('language') as string) || undefined) as BookLanguage | undefined

    let styleLexicon: StyleLexicon | undefined
    if (lexiconRaw) {
      try { styleLexicon = JSON.parse(lexiconRaw) as StyleLexicon } catch { /* ignore */ }
    }

    // 鉴权 + 限流：角色卡会消耗 LLM 与生图额度
    const user = await getSessionUser(req)
    const limit = user ? (user.isPaid || user.tier !== 'free' ? 30 : 10) : 1
    const rateKey = user ? `char:user:${user.id}:day` : `char:ip:${getClientIp(req)}:day`
    const rate = await checkRateLimit(rateKey, limit, 86400)
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: user
            ? 'Daily character limit reached. Try again tomorrow.'
            : 'Free trial limit reached. Sign in to keep creating characters.',
          code: 'rate_limited',
        },
        { status: 429 },
      )
    }

    // 儿童照片属于个人信息：没有生效的家长同意就绝不处理。
    if (photo && typeof photo.size === 'number' && photo.size > 0) {
      if (!user) {
        return NextResponse.json(
          { error: 'A parent or guardian account is required before a child\u2019s photograph can be used' },
          { status: 401 },
        )
      }
      if (!(await hasConsent(user.id))) {
        return NextResponse.json(
          { error: 'Parental consent is required before a child\u2019s photograph can be used' },
          { status: 403 },
        )
      }
    }

    // 宝宝照片（方案B）转 base64 作 FLUX reference；无照片（方案A）走纯插画
    let photoDataUri: string | undefined
    if (photo && typeof photo.arrayBuffer === 'function' && photo.size > 0) {
      const bytes = await photo.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      photoDataUri = `data:${photo.type || 'image/png'};base64,${base64}`
    }

    const result = await generateCharacterCard({
      name,
      photoDataUri,
      styleLexicon,
      styleName,
      ageGroup,
      theme,
      photoUsage,
      language, // 可选：内容语言（缺省英语）
    })

    // 角色参考图落 R2（未配置时跳过，客户端仍可拿到 base64 参考图）
    let imageUrl: string | undefined
    if (result.imageB64 && isR2Configured()) {
      try {
        imageUrl = await uploadBase64Image(
          `characters/${globalThis.crypto.randomUUID()}/portrait.png`,
          `data:image/png;base64,${result.imageB64}`,
        )
      } catch (err) {
        console.error('Character upload to R2 failed:', err)
      }
    }

    return NextResponse.json({ name, ...result, imageUrl })
  } catch (err) {
    console.error('Character creation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
