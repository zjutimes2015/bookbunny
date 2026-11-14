# VPC credit: manual redemption manual

The $1.00 parental-consent verification fee is refunded **by hand**. There is
no automatic discount: checkout charges the product's full price, and the
`vpc_credits` ledger exists so an operator can verify a pending credit, refund
$1.00 in the Waffo dashboard, and record the consumption. User-facing copy
(`components/ParentalConsentGate.tsx`) describes exactly this process and must
never promise an automatic credit at checkout.

Code: `lib/payments/vpc-credit.ts` (ledger), `app/api/payments/waffo-webhook/route.ts`
(grant + first-order stamp), `scripts/migrate-vpc-credit.cjs` (DDL),
`scripts/backfill-vpc-credits.cjs` (gap recovery),
`scripts/mark-vpc-credit-consumed.cjs` (consumption marking).

## 1. Deploy sequence (order matters)

1. **Run the migration first**, against the production database, before the
   code that grants credits is deployed:
   `node scripts/migrate-vpc-credit.cjs` (needs `NEON_DATABASE_URL`).
   Verify the three indexes exist (`vpc_credits_source_order_uidx`,
   `vpc_credits_user_idx`, `vpc_credits_pending_uidx`).
2. **Then deploy** the code. If the code deploys first, every grant fails
   inside the webhook's try/catch, is only logged, and Waffo does not retry —
   those credits are silently lost until backfilled.
3. **If any verification charge settled before the table existed** (the gap
   window), run the backfill dry run, review it, then apply:
   `node scripts/backfill-vpc-credits.cjs` then
   `node scripts/backfill-vpc-credits.cjs --apply`.
   The backfill is idempotent and safe to re-run.

## 2. How a credit is granted

When a VPC card charge settles, the Waffo webhook writes the consent record
first, then calls `grantVpcCredit`: one pending credit per user, amount = the
fee actually paid capped at $1.00, idempotent on the VPC order id. A failed
grant never breaks consent handling or payment handling — it is logged (with
user/order fields) and can be backfilled later.

Rules the ledger enforces:

- One pending (`granted`) credit per user. Re-verification while one is
  pending grants nothing.
- USD only. A charge settled in another currency grants nothing and is logged
  for manual review. The comparison is case-insensitive (`usd` counts as USD).
- A zero/unknown settled amount falls back to the $1.00 product price: the VPC
  product is fixed at $1.00, so a $0/missing amount on a settled charge means
  the amount was not recorded, not that nothing was paid. The webhook applies
  `amount || VPC_PRICE_CENTS`, the backfill mirrors the same rule, and either
  path notes when the fallback was used. (The ledger's own zero-guard stays as
  a last-resort safety net for direct callers; it never mints a credit on its
  own.)
- Withdrawing consent does **not** void the credit (the parent paid the fee).
- The development simulated-consent path grants no credit (no real charge).

## 3. Manual redemption procedure

When a parent emails `support@sprouttales.com` asking for the $1.00 back —
also check the `privacy@sprouttales.com` inbox: the pricing-page refund FAQ
directs refund requests there, so a $1.00 request can land in either mailbox:

1. **Find the pending credit.** Check the ledger for the user's account
   (the marking tool's dry run shows it):
   `node scripts/mark-vpc-credit-consumed.cjs --user-id <userId> --order-id <placeholder>`
   No pending credit → **do not refuse yet.** First check whether the VPC
   charge actually settled: look in `payments` (a `completed`
   `vpc_verification` row for the user) and `parental_consents` (a matching
   `vpc_reference`). If a settled charge exists but the ledger has no row,
   the grant was lost (e.g. it settled while the table did not exist) — run
   the backfill dry run and review it
   (`node scripts/backfill-vpc-credits.cjs`), then apply if it recovers the
   credit. Only if there is still no credit row after that re-check may you
   tell the parent the verification fee is not refundable for their account —
   and check the ledger history before saying more (step 2).
2. **Check the order history — do not trust `first_order_id` alone.**
   - `first_order_id` can be **empty** even though the user has paid: if a
     paid order completed *before* the grant existed (e.g. subscribed first,
     verified later, or the credit was backfilled), the stamp never fired
     and the field stays empty until the *next* paid order. An empty stamp
     does **not** mean "no purchase yet".
   - The stamped order can be a **renewal**, not the first purchase: the
     stamp fires on any non-VPC completed order, including subscription
     renewals and historical allowance orders. The stamp is only a record
     of "a paid order completed while a credit was pending".
   - So: confirm in the `payments` table (or the Waffo dashboard) that the
     user has at least one completed paid order besides the verification
     charge. The refund is owed once they have paid for something; the exact
     order it is "for" does not change the $1.00.
3. **Refund $1.00 in the Waffo dashboard** against the verification charge.
   Keep the refund/order reference: it goes into the ledger as
   `consumed_order_id`.
4. **Record the consumption** (this is what prevents a second refund):
   `node scripts/mark-vpc-credit-consumed.cjs --user-id <userId> --order-id <refundReference> --apply`
   The tool only marks a `granted` row, so running it twice cannot
   double-consume; a second run reports "no pending credit". Pass
   `--credit-id <id>` with the id the dry run displayed to pin the mark to
   that exact row — without it, a re-verification between the dry run and
   `--apply` could leave the tool marking a newer credit than the one you
   verified.
5. **Reply to the parent** confirming the $1.00 refund.

If two people work the queue at once, the ledger is the arbiter: whoever
marks the row first wins, and the other run finds nothing pending. Always
re-check the row before issuing a refund, never refund from memory.

## 4. Useful checks (SQL)

Pending credits awaiting a manual refund:

```sql
SELECT user_id, amount_cents, source_order_id, first_order_id, granted_at
FROM vpc_credits WHERE status = 'granted' ORDER BY granted_at ASC;
```

A user's full credit history:

```sql
SELECT * FROM vpc_credits WHERE user_id = '<userId>' ORDER BY granted_at ASC;
```

A user's paid orders (for the step-2 history check):

```sql
SELECT id, plan, amount, currency, status, created_at FROM payments
WHERE user_id = '<userId>' AND status = 'completed' ORDER BY created_at ASC;
```

## 5. Open items (not this build)

- **Automatic discount deferred.** Wiring the Waffo `priceSnapshot` override
  needs a verified `taxCategory` for the live products and proof that a
  subscription override touches the first period only. Until both are
  verified against Waffo docs and a test-mode checkout, do not wire
  `consumeVpcCredit` from any route.
- **Real-Postgres concurrency check open.** The unit-test fake emulates the
  partial unique index and the check-then-insert race at JS await boundaries;
  a concurrent-grant check against real Postgres has not been run. The DDL
  index itself is covered by review of `scripts/migrate-vpc-credit.cjs`.
