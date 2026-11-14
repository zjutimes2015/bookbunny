/**
 * SERVER ONLY — never import from client components. Credentials are read
 * from server-side env vars (DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD) and
 * must never enter a NEXT_PUBLIC_ var or the browser bundle.
 *
 * Third-party API client (DataForSEO Labs, Amazon). Only the official API is
 * called; Amazon pages are never requested directly (SPEC §5).
 *
 * --- C6 verification, 2026-11-14 (checked against official docs) -----------
 * Verified:
 * - Bulk search volume: POST https://api.dataforseo.com/v3/dataforseo_labs/amazon/bulk_search_volume/live
 *   Doc: https://docs.dataforseo.com/v3/dataforseo_labs/amazon/bulk_search_volume/live/
 *   Body: JSON array with one task [{keywords[], location_code, language_code}];
 *   location_code 2840 = United States; language_code "en". Response:
 *   tasks[0].result[0].items[] = {keyword, search_volume}. Max 1000 keywords.
 * - Related keywords: POST https://api.dataforseo.com/v3/dataforseo_labs/amazon/related_keywords/live
 *   Doc: https://docs.dataforseo.com/v3/dataforseo_labs/amazon/related_keywords/live/
 *   Body: [{keyword, location_code, language_name, limit, include_seed_keyword}].
 *   Response items[] = {keyword_data: {keyword, keyword_info: {search_volume,
 *   last_updated_time}}, depth, related_keywords}.
 * - Auth: HTTP Basic with the API login/password from
 *   https://app.dataforseo.com/api-access (both endpoint docs' curl examples).
 * - Pricing: all Labs Amazon endpoints $0.012 per task + $0.00012 per item.
 *   Source: https://dataforseo.com/pricing/dataforseo-labs/dataforseo-amazon-api
 *   (read 2026-11-14). Responses also carry a `cost` field (task cost, USD);
 *   the response cost is preferred when present, the formula is the fallback.
 * - Minimum top-up $50, balance never expires, $1 trial credit (official Help
 *   Center: https://dataforseo.com/help-center/dfs-dashboard-how-to-find-everything).
 * - Data refresh cycle 30–90 days (Labs Amazon pricing FAQ).
 * UNVERIFIED:
 * - Competition/difficulty field: NEITHER endpoint documents one. The
 *   competition label therefore has no data source; see lib/demand/score.ts.
 * - Sandbox response shape: not exercised (no account/key, C1). Endpoints are
 *   configurable constants and the base URL can be overridden with
 *   DATAFORSEO_BASE_URL for sandbox runs.
 * - No live call has been made from this codebase (no key). First live call
 *   must be a small manual check after the key is configured.
 */

export const DATAFORSEO_BASE_URL = 'https://api.dataforseo.com'
export const DATAFORSEO_BULK_SEARCH_VOLUME_PATH =
  '/v3/dataforseo_labs/amazon/bulk_search_volume/live'
export const DATAFORSEO_RELATED_KEYWORDS_PATH =
  '/v3/dataforseo_labs/amazon/related_keywords/live'

/** Location code for United States (D9: amazon.com only). */
export const DATAFORSEO_LOCATION_CODE_US = 2840
export const DATAFORSEO_LANGUAGE_CODE = 'en'
/** Related-keywords docs show `language_name` ("English") in every example. */
export const DATAFORSEO_LANGUAGE_NAME = 'English'

/** Hard timeout per call (R4#5): 8 seconds, then fail isolated. */
export const DATAFORSEO_TIMEOUT_MS = 8000

/** Price table version recorded with every logged call (R5#3). */
export const DATAFORSEO_PRICE_VERSION = 'labs-amazon-2026-11-14'
export const DATAFORSEO_PRICE_PER_TASK_USD = 0.012
export const DATAFORSEO_PRICE_PER_ITEM_USD = 0.00012

export function estimateCallCostUsd(itemCount: number): number {
  const items = Math.max(0, Math.floor(itemCount) || 0)
  return DATAFORSEO_PRICE_PER_TASK_USD + DATAFORSEO_PRICE_PER_ITEM_USD * items
}

export interface DataForSeoCredentials {
  login: string
  password: string
}

/** Credentials from server env only. Missing/empty -> null (routes degrade silently). */
export function dataForSeoCredentials(
  env: NodeJS.ProcessEnv = process.env,
): DataForSeoCredentials | null {
  const login = env.DATAFORSEO_LOGIN?.trim()
  const password = env.DATAFORSEO_PASSWORD?.trim()
  if (!login || !password) return null
  return { login, password }
}

export function dataForSeoBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.DATAFORSEO_BASE_URL?.trim().replace(/\/+$/, '')
  return override || DATAFORSEO_BASE_URL
}

// ---------------------------------------------------------------------------
// Response parsing (pure, unit-tested against documented shapes)
// ---------------------------------------------------------------------------

export interface KeywordVolume {
  keyword: string
  searchVolume: number | null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function firstTask(body: unknown): Record<string, unknown> | null {
  if (!isRecord(body)) return null
  const tasks = body.tasks
  if (!Array.isArray(tasks) || tasks.length === 0) return null
  return isRecord(tasks[0]) ? tasks[0] : null
}

function taskCostUsd(task: Record<string, unknown>, body: Record<string, unknown>): number | null {
  const taskCost = task.cost
  if (typeof taskCost === 'number' && Number.isFinite(taskCost)) return taskCost
  const bodyCost = body.cost
  if (typeof bodyCost === 'number' && Number.isFinite(bodyCost)) return bodyCost
  return null
}

function firstResultItems(task: Record<string, unknown>): unknown[] {
  const result = task.result
  if (!Array.isArray(result) || result.length === 0) return []
  const first = result[0]
  if (!isRecord(first)) return []
  const items = first.items
  return Array.isArray(items) ? items : []
}

function readVolume(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null
}

/** Parse a bulk_search_volume response. Throws on a task-level error status. */
export function parseBulkSearchVolume(body: unknown): KeywordVolume[] {
  const task = firstTask(body)
  if (!task) return []
  if (task.status_code !== 20000) {
    throw new Error(
      `DataForSEO bulk_search_volume task failed: ${String(task.status_message ?? task.status_code)}`,
    )
  }
  const out: KeywordVolume[] = []
  for (const item of firstResultItems(task)) {
    if (!isRecord(item) || typeof item.keyword !== 'string') continue
    out.push({ keyword: item.keyword, searchVolume: readVolume(item.search_volume) })
  }
  return out
}

export interface RelatedKeyword {
  keyword: string
  searchVolume: number | null
}

/** Parse a related_keywords response. Throws on a task-level error status. */
export function parseRelatedKeywords(body: unknown): RelatedKeyword[] {
  const task = firstTask(body)
  if (!task) return []
  if (task.status_code !== 20000) {
    throw new Error(
      `DataForSEO related_keywords task failed: ${String(task.status_message ?? task.status_code)}`,
    )
  }
  const out: RelatedKeyword[] = []
  for (const item of firstResultItems(task)) {
    if (!isRecord(item)) continue
    const data = item.keyword_data
    if (!isRecord(data) || typeof data.keyword !== 'string') continue
    const info = data.keyword_info
    out.push({
      keyword: data.keyword,
      searchVolume: isRecord(info) ? readVolume(info.search_volume) : null,
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// HTTP calls (injectable fetch for tests; 8s timeout; failure isolation
// happens in the routes, which catch and fall back to cache/empty)
// ---------------------------------------------------------------------------

export interface DataForSeoCallOptions {
  fetchImpl?: typeof fetch
  baseUrl?: string
  timeoutMs?: number
}

async function postTask(
  path: string,
  task: Record<string, unknown>,
  creds: DataForSeoCredentials,
  opts: DataForSeoCallOptions = {},
): Promise<unknown> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const baseUrl = (opts.baseUrl ?? dataForSeoBaseUrl()).replace(/\/+$/, '')
  const timeoutMs = opts.timeoutMs ?? DATAFORSEO_TIMEOUT_MS
  const auth = Buffer.from(`${creds.login}:${creds.password}`, 'utf8').toString('base64')
  const res = await fetchImpl(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([task]),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) {
    throw new Error(`DataForSEO request failed: HTTP ${res.status} (${path})`)
  }
  return res.json()
}

function resolveCost(body: unknown, itemCount: number): number {
  if (isRecord(body)) {
    const task = firstTask(body)
    const reported = task ? taskCostUsd(task, body) : null
    if (reported !== null) return reported
  }
  return estimateCallCostUsd(itemCount)
}

export async function fetchBulkSearchVolumes(
  keywords: string[],
  creds: DataForSeoCredentials,
  opts: DataForSeoCallOptions = {},
): Promise<{ volumes: KeywordVolume[]; costUsd: number; itemCount: number }> {
  const body = await postTask(
    DATAFORSEO_BULK_SEARCH_VOLUME_PATH,
    { keywords, location_code: DATAFORSEO_LOCATION_CODE_US, language_code: DATAFORSEO_LANGUAGE_CODE },
    creds,
    opts,
  )
  const volumes = parseBulkSearchVolume(body)
  return { volumes, costUsd: resolveCost(body, volumes.length), itemCount: volumes.length }
}

export async function fetchRelatedKeywords(
  keyword: string,
  limit: number,
  creds: DataForSeoCredentials,
  opts: DataForSeoCallOptions = {},
): Promise<{ keywords: RelatedKeyword[]; costUsd: number; itemCount: number }> {
  const body = await postTask(
    DATAFORSEO_RELATED_KEYWORDS_PATH,
    {
      keyword,
      location_code: DATAFORSEO_LOCATION_CODE_US,
      language_name: DATAFORSEO_LANGUAGE_NAME,
      limit,
      include_seed_keyword: false,
    },
    creds,
    opts,
  )
  const keywords = parseRelatedKeywords(body)
  return { keywords, costUsd: resolveCost(body, keywords.length), itemCount: keywords.length }
}
