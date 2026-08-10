/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    NEON_DATABASE_URL: string
    OPENROUTER_API_KEY: string
    SITE_URL: string
  }
}
