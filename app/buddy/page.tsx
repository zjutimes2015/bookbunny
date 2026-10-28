import type { Metadata } from 'next'
import StoryBuddy from '@/components/StoryBuddy'

export const metadata: Metadata = {
  title: 'Make a book with Lila or Kai',
  description:
    'Talk to Lila or Kai and they will write, save, and illustrate a leveled picture book in your SproutTales library.',
  robots: { index: false, follow: false },
}

export default function BuddyPage() {
  return <StoryBuddy />
}
