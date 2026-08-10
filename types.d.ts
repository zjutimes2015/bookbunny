/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    NEON_DATABASE_URL: string
    OPENROUTER_API_KEY: string
    SITE_URL: string
  }
}

// Neon Database types
interface CharacterRecord {
  id: string
  name: string
  image_url: string
  style: string
  ref_seed: number
  created_at: Date
}

interface StoryRecord {
  id: string
  title: string
  content: string[]
  age_group: string
  theme: string
  created_at: Date
}

interface BookRecord {
  id: string
  title: string
  character_id: string
  story_id: string
  pages: string[]
  status: 'draft' | 'generating' | 'ready' | 'exported'
  created_at: Date
}
