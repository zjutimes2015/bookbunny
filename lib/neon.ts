import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

type Sql = NeonQueryFunction<false, false>

let cached: Sql | undefined

function client(): Sql {
  if (!cached) cached = neon(process.env.NEON_DATABASE_URL!)
  return cached
}

/**
 * Tagged-template SQL client. The Neon connection is opened on the first query,
 * not at import, so `next build` can load route modules when the database URL
 * is only present at runtime.
 */
export const sql: Sql = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  client()(strings, ...values)) as Sql
