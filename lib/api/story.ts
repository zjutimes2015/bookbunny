const OR_KEY = process.env.OPENROUTER_API_KEY
const OR_BASE = 'https://openrouter.ai/api/v1'

interface StoryOptions {
  theme: string
  ageGroup: string
  characterName: string
  pages?: number
}

export async function generateStory(options: StoryOptions): Promise<{
  title: string
  pages: string[]
}> {
  const pageCount = options.pages || 20

  const prompt = `You are a professional children's book author. Write a children's story with the following parameters:

- Theme: ${options.theme}
- Target Age: ${options.ageGroup}
- Main Character: ${options.characterName}
- Number of pages: ${pageCount}

Write EXACTLY ${pageCount} short sentences, one per page. Each sentence should be 10-20 words, simple, engaging, and age-appropriate.

Format: Return ONLY a JSON object with:
{
  "title": "The story title",
  "pages": ["Page 1 text", "Page 2 text", ...]
}

The story should have a clear beginning, middle, and end. Each page should be visually descriptive so an illustrator can draw it.`

  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a children\'s book author. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Story API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''

  // Parse JSON from response
  try {
    // Find JSON in the response (it might be wrapped in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(content)
  } catch {
    throw new Error('Failed to parse story JSON from AI response')
  }
}
