/**
 * Mark a manually redeemed VPC credit as consumed.
 *
 * The $1.00 verification fee is refunded by hand: an operator verifies the
 * pending credit, issues the $1.00 refund in the Waffo dashboard, then runs
 * this tool to record the consumption in the vpc_credits ledger so the same
 * credit can never be refunded twice. The UPDATE only matches a 'granted'
 * row, so re-running after a successful mark finds nothing and changes
 * nothing.
 *
 * Usage:
 *   node scripts/mark-vpc-credit-consumed.cjs --user-id <userId> --order-id <refundOrderId>
 *       Dry run (default): show the pending credit, write nothing.
 *   node scripts/mark-vpc-credit-consumed.cjs --user-id <userId> --order-id <refundOrderId> --apply
 *       Record the consumption. --order-id is the Waffo refund/order reference
 *       for the $1.00 refund, stored as consumed_order_id for audit.
 *   Optional --credit-id <id>: pin the operation to the exact credit row the
 *   dry run displayed (its id is printed as "credit <id>"). Without it, the
 *   tool marks the user's earliest pending credit; in the narrow window
 *   between the dry run and --apply, a re-verification could grant a new
 *   credit, and the unpinned update would mark that newer row instead of the
 *   one the operator verified. Pinning closes that window.
 *
 * Confirm the refund was actually issued in Waffo BEFORE running with --apply.
 * Before refunding, check the user's order history: first_order_id may be
 * empty (order completed before the grant) or may point at a renewal rather
 * than the first purchase — see docs/vpc-credit-manual-redemption.md (L3/L4).
 *
 * Requires NEON_DATABASE_URL (or .env.local).
 */
const { neon } = require('@neondatabase/serverless')
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

function usage() {
  console.log('Usage: node scripts/mark-vpc-credit-consumed.cjs --user-id <userId> --order-id <refundOrderId> [--credit-id <creditId>] [--apply]')
  console.log('  Default (no --apply): dry run — show the pending credit, write nothing.')
  console.log('  --apply: mark the pending credit consumed with the given refund order reference.')
  console.log('  --credit-id: pin the operation to one credit row (the id the dry run displayed).')
}

function parseArgs(argv) {
  const out = { userId: '', orderId: '', creditId: '', apply: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--apply') out.apply = true
    else if (arg === '--user-id') out.userId = argv[++i] || ''
    else if (arg === '--order-id') out.orderId = argv[++i] || ''
    else if (arg === '--credit-id') out.creditId = argv[++i] || ''
    else if (arg === '--help' || arg === '-h') {
      usage()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg} (see --help)`)
    }
  }
  if (!out.userId || !out.orderId) {
    usage()
    throw new Error('--user-id and --order-id are both required')
  }
  return out
}

function describe(row) {
  return (
    `  credit ${row.id}\n` +
    `  user: ${row.user_id} | amount: $${(Number(row.amount_cents) / 100).toFixed(2)} | status: ${row.status}\n` +
    `  funded by VPC order: ${row.source_order_id} (granted ${row.granted_at})\n` +
    `  first order stamped: ${row.first_order_id || '(none yet — check order history before refunding)'}\n` +
    `  consumed: ${row.consumed_order_id ? `${row.consumed_order_id} at ${row.consumed_at}` : '(not consumed)'}`
  )
}

async function main() {
  const { userId, orderId, creditId, apply } = parseArgs(process.argv.slice(2))

  loadEnv()
  if (!process.env.NEON_DATABASE_URL) {
    throw new Error('NEON_DATABASE_URL is not set (and no .env.local provided it)')
  }
  const sql = neon(process.env.NEON_DATABASE_URL)

  const table = await sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vpc_credits'
    LIMIT 1
  `
  if (table.length === 0) {
    throw new Error(
      'vpc_credits table does not exist — run scripts/migrate-vpc-credit.cjs first.',
    )
  }

  // With --credit-id, pin to the exact row the dry run displayed; without it,
  // take the user's earliest pending credit.
  const pending = creditId
    ? await sql`
        SELECT * FROM vpc_credits
        WHERE id = ${creditId} AND user_id = ${userId} AND status = 'granted'
        LIMIT 1
      `
    : await sql`
        SELECT * FROM vpc_credits
        WHERE user_id = ${userId} AND status = 'granted'
        ORDER BY granted_at ASC
        LIMIT 1
      `

  if (pending.length === 0) {
    if (creditId) {
      const pinned = await sql`
        SELECT * FROM vpc_credits WHERE id = ${creditId} AND user_id = ${userId} LIMIT 1
      `
      if (pinned.length > 0) {
        console.log(`Credit ${creditId} is no longer pending. Its current row:`)
        console.log(describe(pinned[0]))
      } else {
        console.log(`No vpc_credits row ${creditId} exists for user ${userId} — nothing to mark.`)
      }
    } else {
      const any = await sql`
        SELECT * FROM vpc_credits WHERE user_id = ${userId} ORDER BY granted_at DESC LIMIT 1
      `
      if (any.length > 0) {
        console.log('No pending credit for this user. Most recent credit row:')
        console.log(describe(any[0]))
      } else {
        console.log(`No vpc_credits row exists for user ${userId} — nothing to mark.`)
      }
    }
    if (apply) {
      // The operator expected to record a redemption; a silent no-op would
      // hide a wrong user id or an already-consumed credit.
      process.exitCode = 1
    }
    return
  }

  console.log(`Pending credit for user ${userId}:`)
  console.log(describe(pending[0]))

  if (!apply) {
    console.log(
      `\nDry run — nothing was written. After confirming the $1.00 refund was issued in Waffo, re-run with --apply to record consumed_order_id = ${orderId}.` +
        `\nTip: pass --credit-id ${pending[0].id} to pin the mark to this exact row.`,
    )
    return
  }

  const updated = creditId
    ? await sql`
        UPDATE vpc_credits
        SET status = 'consumed', consumed_order_id = ${orderId}, consumed_at = NOW()
        WHERE id = ${creditId} AND user_id = ${userId} AND status = 'granted'
        RETURNING *
      `
    : await sql`
        UPDATE vpc_credits
        SET status = 'consumed', consumed_order_id = ${orderId}, consumed_at = NOW()
        WHERE user_id = ${userId} AND status = 'granted'
        RETURNING *
      `
  if (updated.length === 0) {
    console.log('Nothing was marked: the credit was consumed by another run in the meantime.')
    process.exitCode = 1
    return
  }
  console.log(`\nMarked consumed with refund reference ${orderId}:`)
  console.log(describe(updated[0]))
}

main()
  .then(() => process.exit(process.exitCode || 0))
  .catch((e) => {
    console.error(e.message || e)
    process.exit(1)
  })
