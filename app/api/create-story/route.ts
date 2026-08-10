import { NextRequest, NextResponse } from 'next/server'
import { generateStory } from '@/lib/api/story'

export async function POST(req: NextRequest) {
  try {
    const { theme, ageGroup, characterName } = await req.json()

    if (!theme || !ageGroup || !characterName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const story = await generateStory({
      theme,
      ageGroup,
      characterName,
      pages: 20,
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
