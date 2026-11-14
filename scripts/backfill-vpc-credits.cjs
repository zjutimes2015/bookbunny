/**
 * Backfill VPC credits for $1.00 verification charges that settled while the
 * vpc_credits table did not exist yet (or whose webhook grant failed).
 *
 * Source of truth: payments rows for the vpc_verification plan with a matching
 * parental_consents row (the consent record proves the charge went through the
 * VPC branch). For each settled charge this script recreates exactly the row
 * the webhook would have granted: same amount rule (settled amount capped at
 * $1.00, falling back to the $1.00 product price when the settled amount is
 * zero or unknown — the same `amount || VPC_PRICE_CENTS` fallback the webhook
 * applies, because the VPC product is fixed at $1.00), same one-pending-
 * credit-per-user rule, same idempotency on the VPC order id — plus the
 * first-order stamp, when a later paid order exists. Whenever the fallback is
 * used, the script prints a line saying so.
 *
 * Idempotent: re-running skips every charge that already has a credit row, and
 * the INSERT carries ON CONFLICT (source_order_id) DO NOTHING as a backstop.
 * Safe to run repeatedly.
 *
 * Usage:
 *   node scripts/backfill-vpc-credits.cjs              # dry run (default): report only, writes nothing
 *   node scripts/backfill-vpc-credits.cjs --apply      # actually insert the missing grants
 *
 * Requires NEON_DATABASE_URL (or .env.local). Run scripts/migrate-vpc-credit.cjs
 * FIRST — this script refuses to run when the vpc_credits table is missing.
 * See docs/vpc-credit-manual-redemption.md for the deploy sequence.
 */
const { neon } = require('@neondatabase/serverless')
const { randomUUID } = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

// Read .env.local (a directly-run script does not load it automatically).
function loadEnv() {
  if (process.env.NEON_DATABASE_URL) return
  const file = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const [, key, raw] = match
    if (!process.env[key]) process.env[key] = raw.replace(/^["']|["']$/g, '')
  }
}

const VPC_PLAN = 'vpc_verification'
const VPC_CREDIT_CENTS = 100

async function tableExists(sql, table) {
  const rows = await sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${table}
    LIMIT 1
  `
  return rows.length > 0
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node scripts/backfill-vpc-credits.cjs [--apply]')
    console.log('  Default (no flags): dry run — report what would be granted, write nothing.')
    console.log('  --apply: insert the missing grants (idempotent, safe to re-run).')
    process.exit(0)
  }
  const apply = args.includes('--apply')
  if (args.some((a) => a !== '--apply')) {
    throw new Error(`Unknown argument(s): ${args.filter((a) => a !== '--apply').join(' ')} (see --help)`)
  }

  loadEnv()
  if (!process.env.NEON_DATABASE_URL) {
    throw new Error('NEON_DATABASE_URL is not set (and no .env.local provided it)')
  }
  const sql = neon(process.env.NEON_DATABASE_URL)

  if (!(await tableExists(sql, 'vpc_credits'))) {
    throw new Error(
      'vpc_credits table does not exist — run scripts/migrate-vpc-credit.cjs first, then re-run this script.',
    )
  }

  // Settled VPC charges with a matching consent record. EXISTS (not JOIN) so a
  // charge is listed once even if consent rows were re-created for it.
  const charges = await sql`
    SELECT p.id AS order_id, p.user_id, p.amount, p.currency, p.created_at
    FROM payments p
    WHERE p.plan = ${VPC_PLAN}
      AND p.status = 'completed'
      AND p.user_id <> ''
      AND EXISTS (SELECT 1 FROM parental_consents c WHERE c.vpc_reference = p.id)
    ORDER BY p.created_at ASC
  `

  console.log(`Mode: ${apply ? 'APPLY (writing)' : 'DRY RUN (no writes)'}`)
  console.log(`Settled VPC charges with a consent record: ${charges.length}`)

  const counts = { granted: 0, alreadyRecorded: 0, pendingExists: 0, skippedCurrency: 0, fallbackUsed: 0, raceConflicts: 0 }
  const skipped = []

  for (const charge of charges) {
    const label = `order ${charge.order_id} (user ${charge.user_id})`
    const currency = (charge.currency || 'USD').toUpperCase()
    if (currency !== 'USD') {
      counts.skippedCurrency += 1
      skipped.push(`${label}: non-USD charge (${currency}) — needs manual review, no grant`)
      continue
    }
    // Same amount rule as the webhook: settled amount capped at $1.00, falling
    // back to the $1.00 product price when the settled amount is zero or
    // unknown (the VPC product is fixed at $1.00, so a $0/missing amount on a
    // settled charge means the amount was not recorded, not that nothing was
    // paid). The fallback is always noted in the output.
    const rawAmount = Number.isFinite(Number(charge.amount)) ? Math.floor(Number(charge.amount)) : 0
    const usedFallback = rawAmount <= 0
    const creditCents = Math.min(Math.max(rawAmount, 0), VPC_CREDIT_CENTS) || VPC_CREDIT_CENTS
    const fallbackNote = usedFallback
      ? ` (settled amount ${charge.amount} — used $1.00 product price fallback)`
      : ''
    if (usedFallback) counts.fallbackUsed += 1

    const existing = await sql`
      SELECT id FROM vpc_credits WHERE source_order_id = ${charge.order_id} LIMIT 1
    `
    if (existing.length > 0) {
      counts.alreadyRecorded += 1
      continue
    }

    const pending = await sql`
      SELECT id FROM vpc_credits
      WHERE user_id = ${charge.user_id} AND status = 'granted'
      LIMIT 1
    `
    if (pending.length > 0) {
      counts.pendingExists += 1
      skipped.push(`${label}: user already holds a pending credit (${pending[0].id}) — no second credit`)
      continue
    }

    if (!apply) {
      counts.granted += 1
      console.log(`  would grant: ${label} — $${(creditCents / 100).toFixed(2)}${fallbackNote}`)
      continue
    }

    let inserted
    try {
      inserted = await sql`
        INSERT INTO vpc_credits (id, user_id, amount_cents, status, source_order_id)
        VALUES (${randomUUID()}, ${charge.user_id}, ${creditCents}, 'granted', ${charge.order_id})
        ON CONFLICT (source_order_id) DO NOTHING
        RETURNING id
      `
    } catch (insertErr) {
      // A concurrent grant can win the one-pending-credit-per-user race and
      // trip the partial unique index (23505) — ON CONFLICT only arbitrates
      // source_order_id. Count it and move on instead of dying mid-run; the
      // winning grant already gave this user their pending credit.
      const code = insertErr?.code || (String(insertErr?.message || '').match(/23505/) ? '23505' : null)
      if (code === '23505') {
        counts.raceConflicts += 1
        skipped.push(`${label}: concurrent grant won the pending-credit race (23505) — no second credit`)
        continue
      }
      throw insertErr
    }
    if (inserted.length === 0) {
      // Lost a race with a concurrent grant (or a duplicate) — already recorded.
      counts.alreadyRecorded += 1
      continue
    }
    counts.granted += 1

    // Stamp the first paid non-VPC order completed after this charge, mirroring
    // what the webhook's stampFirstOrder would have recorded. No such order yet
    // is fine: first_order_id stays empty until a later order stamps it, and a
    // manual redemption must check the order history anyway (see the manual doc).
    const stamped = await sql`
      UPDATE vpc_credits
      SET first_order_id = sub.id, first_order_at = sub.created_at
      FROM (
        SELECT id, created_at FROM payments
        WHERE user_id = ${charge.user_id}
          AND plan <> ${VPC_PLAN}
          AND status = 'completed'
          AND created_at > ${charge.created_at}
        ORDER BY created_at ASC
        LIMIT 1
      ) sub
      WHERE vpc_credits.id = ${inserted[0].id} AND vpc_credits.first_order_id IS NULL
      RETURNING first_order_id
    `
    console.log(
      `  granted: ${label} — $${(creditCents / 100).toFixed(2)}${fallbackNote}` +
        (stamped.length > 0 ? `, first order stamped: ${stamped[0].first_order_id}` : ', no later paid order yet'),
    )
  }

  for (const line of skipped) console.log(`  skipped: ${line}`)
  console.log(
    `${apply ? 'Granted' : 'Would grant'}: ${counts.granted} | already recorded: ${counts.alreadyRecorded} | ` +
      `user already holds pending: ${counts.pendingExists} | skipped (currency): ${counts.skippedCurrency} | ` +
      `product-price fallback used: ${counts.fallbackUsed} | race conflicts (23505): ${counts.raceConflicts}`,
  )
  if (!apply && counts.granted > 0) {
    console.log('Dry run only — nothing was written. Re-run with --apply to insert the grants.')
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.message || e)
    process.exit(1)
  })
