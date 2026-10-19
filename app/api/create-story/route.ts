import { NextRequest, NextResponse } from 'next/server'
import { generateStory } from '@/lib/api/story'

export async function POST(req: NextRequest) {
  try {
    const { theme, ageGroup, characterName, pages, level, styleLexicon, styleCard, characterCards, language } = await req.json()

    if (!theme || !ageGroup || !characterName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const story = await generateStory({
      theme,
      ageGroup,
      characterName,
      pages: pages || 20,
      level, // 可选：GRL 分级（'A' - 'E'）
      styleLexicon, // 可选：风格层（固定风格词库）
      styleCard, // 可选：风格设定卡
      characterCards, // 可选：角色设定卡（一致性）
      language, // 可选：内容语言（缺省英语）
    })

    return NextResponse.json(story)
  } catch (err) {
    console.error('Story generation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
