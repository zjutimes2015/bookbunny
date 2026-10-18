import { NextRequest, NextResponse } from 'next/server'
import { generateStory } from '@/lib/api/story'

export async function POST(req: NextRequest) {
  try {
    const { theme, ageGroup, characterName, pages, level } = await req.json()

    if (!theme || !ageGroup || !characterName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const story = await generateStory({
      theme,
      ageGroup,
      characterName,
      pages: pages || 20,
      level, // 可选：GRL 分级（'A' - 'E'）
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
