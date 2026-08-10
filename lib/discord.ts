type DiscordEvent = 'new_user' | 'book_created' | 'error' | 'feedback'

interface DiscordPayload {
  content?: string
  embeds?: Array<{
    title?: string
    description?: string
    color?: number
    fields?: Array<{ name: string; value: string; inline?: boolean }>
    timestamp?: string
    footer?: { text: string }
  }>
}

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

const COLORS = {
  new_user: 0x98D8C8,    // mint
  book_created: 0xFF6B8A, // pink
  error: 0xFF4444,         // red
  feedback: 0xC8A2E8,      // lavender
}

export async function notifyDiscord(
  event: DiscordEvent,
  data: Record<string, unknown> = {},
) {
  if (!WEBHOOK_URL) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DISCORD DEV] ${event}:`, data)
    }
    return { success: true, devMode: true }
  }

  const embeds: DiscordPayload['embeds'] = [
    {
      color: COLORS[event] || 0x8E8E93,
      timestamp: new Date().toISOString(),
      footer: { text: 'BookBunny' },
    },
  ]

  switch (event) {
    case 'new_user':
      embeds[0].title = '🐰 New User Joined!'
      embeds[0].description = `**${data.name || 'Someone'}** just joined BookBunny`
      embeds[0].fields = [
        { name: 'Email', value: (data.email as string) || 'N/A', inline: true },
        { name: 'Time', value: new Date().toLocaleString(), inline: true },
      ]
      break

    case 'book_created':
      embeds[0].title = '📖 New Book Created!'
      embeds[0].description = `**"${data.title}"** by ${data.author || 'Unknown'}`
      embeds[0].fields = [
        { name: 'Pages', value: String(data.pages || 0), inline: true },
        { name: 'Age Group', value: (data.ageGroup as string) || 'N/A', inline: true },
      ]
      break

    case 'error':
      embeds[0].title = '⚠️ Error Alert'
      embeds[0].description = (data.message as string) || 'Unknown error'
      embeds[0].fields = [
        { name: 'Route', value: (data.route as string) || 'N/A', inline: true },
      ]
      break

    case 'feedback':
      embeds[0].title = '💬 User Feedback'
      embeds[0].description = (data.message as string) || 'No message'
      if (data.email) {
        embeds[0].fields = [{ name: 'From', value: data.email as string, inline: true }]
      }
      break
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds }),
    })
    if (!res.ok) throw new Error(`Discord webhook error: ${res.status}`)
    return { success: true }
  } catch (err) {
    console.error('Discord notification failed:', err)
    return { success: false, error: err }
  }
}
