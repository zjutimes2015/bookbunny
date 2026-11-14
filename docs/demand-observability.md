# Demand observability handbook (R5)

The demand feature (theme demand score + KDP listing suggestions) logs every
lookup to the `demand_calls` table and caches results in `demand_cache`.
`/admin/analytics` shows the current-month totals (calls, cache-hit rate,
estimated spend) when the tables exist. This page collects the SQL for
deeper checks. Run with `node scripts/migrate-demand.cjs` first if the
tables do not exist yet (production migration is a manual step).

All money figures are estimates from the third-party price table
(`labs-amazon-2026-11-14`: $0.012 per task + $0.00012 per item). The API
response's own `cost` field is preferred when present.

## Monthly spend vs budget fuse

```sql
-- Current calendar month, estimated spend (the fuse trips at DEMAND_MONTHLY_BUDGET_USD, default $50)
SELECT COALESCE(SUM(estimated_cost_usd), 0) AS estimated_spend_usd,
       COUNT(*) AS calls
FROM demand_calls
WHERE created_at >= date_trunc('month', NOW());
```

The fuse resets automatically on the 1st of each month (the sum is scoped to
the current calendar month). A tripped fuse logs
`demand budget fuse tripped` to the server console.

## Cache hit rate

```sql
SELECT COUNT(*) AS calls,
       SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) AS cache_hits,
       ROUND(100.0 * SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) AS hit_rate_pct
FROM demand_calls
WHERE created_at >= date_trunc('month', NOW());
```

## Calls by route and theme

```sql
SELECT route, theme_key, COUNT(*) AS calls,
       SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) AS cache_hits,
       COALESCE(SUM(estimated_cost_usd), 0) AS estimated_spend_usd
FROM demand_calls
WHERE created_at >= date_trunc('month', NOW())
GROUP BY route, theme_key
ORDER BY calls DESC;
```

## Heaviest users (rate-limit context)

```sql
SELECT user_id, route, COUNT(*) AS calls, MAX(created_at) AS last_call
FROM demand_calls
WHERE created_at >= CURRENT_DATE
GROUP BY user_id, route
ORDER BY calls DESC
LIMIT 20;
```

Daily per-user limits: 10 score lookups, 5 listing-suggestion lookups
(`demand:score:user:*` / `demand:suggestions:user:*` keys in `rate_limits`).

## Cache contents

```sql
SELECT kind, theme_key, fetched_at, expires_at,
       payload ->> 'score' AS score, payload ->> 'version' AS version
FROM demand_cache
ORDER BY fetched_at DESC
LIMIT 50;
```

To force a refresh for one theme, delete its row; the next lookup refetches:

```sql
DELETE FROM demand_cache WHERE theme_key = '<normalized theme key>';
```

## Price table version

`demand_calls.price_version` records which price table each estimate used.
If the provider reprices, bump `DATAFORSEO_PRICE_VERSION` in
`lib/demand/client.ts` and re-check the docs (see the C6 comment block at
the top of that file).
