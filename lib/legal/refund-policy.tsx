import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY,
  REFUND_WINDOW_DAYS,
  SITE_NAME,
} from '@/lib/site'

const LIST = 'space-y-2'
const ITEM = 'flex items-start gap-2'
const DOT = 'text-[#FF6B8A] mt-0.5'
const STRONG = 'text-[#2D2D2D] font-medium'

export type RefundPolicySection = {
  id: string
  title: string
  body: ReactNode
}

const refundMailto = `mailto:${LEGAL_CONTACT_EMAIL}?subject=Refund%20request`

/**
 * Canonical refund rules. The Terms payments section and /refunds both render this
 * list so the two pages cannot drift.
 *
 * Section ids are prefixed so they stay unique when embedded under the Terms page,
 * which already uses ids such as "eligibility" and "contact".
 */
export function refundPolicySections(options?: {
  includeTermsLink?: boolean
}): RefundPolicySection[] {
  const includeTermsLink = options?.includeTermsLink ?? true

  return [
  {
    id: 'refund-scope',
    title: 'What this policy covers',
    body: (
      <>
        <p>
          This Refund Policy is part of the Terms of Service between you and{' '}
          <span className={STRONG}>{LEGAL_ENTITY}</span>, the operator of {SITE_NAME}. It applies
          to paid subscriptions and to credit packs bought by the parent or guardian who holds the
          account. The free plan has no charge, so there is nothing to refund.
        </p>
        <p>
          Payments are processed by our payment processor. You agree to its terms when you make a
          purchase.
          {includeTermsLink ? (
            <>
              {' '}
              These rules also appear in the payments section of the{' '}
              <Link href="/terms#payments" className={STRONG}>
                Terms of Service
              </Link>
              .
            </>
          ) : null}
        </p>
      </>
    ),
  },
  {
    id: 'refund-eligibility',
    title: 'Refund eligibility and time limit',
    body: (
      <>
        <p>A refund is available when all of the following are true:</p>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              You are the parent or guardian who paid, and you write from the email address on the{' '}
              {SITE_NAME} account.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              You ask within {REFUND_WINDOW_DAYS} days of the charge date. This is the same{' '}
              {REFUND_WINDOW_DAYS}-day window we use before an affiliate commission can be approved.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>You have not used the purchase.</span> A subscription charge
              (Creator or Studio, billed monthly or yearly) is eligible only when you have
              not used any monthly book allowance from that billing period and have not generated a
              book during that period. A credit pack is eligible only when none of the credits in
              that pack have been used.
            </span>
          </li>
        </ul>
        <p>
          A charge that never becomes available on your account — you were charged, and the plan or
          the credits did not appear — can be refunded even after {REFUND_WINDOW_DAYS} days. Email
          us and we will return that charge.
        </p>
      </>
    ),
  },
  {
    id: 'refund-consumed',
    title: 'Consumed credits and generated books',
    body: (
      <ul className={LIST}>
        <li className={ITEM}>
          <span className={DOT}>•</span>
          <span>A credit that has already been used is not refundable.</span>
        </li>
        <li className={ITEM}>
          <span className={DOT}>•</span>
          <span>
            A book that has already been generated is not refundable, whether or not you later
            download, print, or publish it.
          </span>
        </li>
        <li className={ITEM}>
          <span className={DOT}>•</span>
          <span>
            If any credit in a pack has been used, that pack is not refundable. We do not refund the
            unused credits left in that pack.
          </span>
        </li>
        <li className={ITEM}>
          <span className={DOT}>•</span>
          <span>
            If you have generated a book during a paid billing period, or used any of that
            period&apos;s book allowance, that subscription charge is not refundable.
          </span>
        </li>
        <li className={ITEM}>
          <span className={DOT}>•</span>
          <span>
            We do not give a partial cash refund for a partly used subscription period or a partly
            used credit pack.
          </span>
        </li>
      </ul>
    ),
  },
  {
    id: 'refund-request',
    title: 'How to request a refund',
    body: (
      <>
        <p>
          Email{' '}
          <a href={refundMailto} className={STRONG}>
            {LEGAL_CONTACT_EMAIL}
          </a>{' '}
          with the subject line &ldquo;Refund request&rdquo;. Include:
        </p>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>the email address on your {SITE_NAME} account;</span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>the date of the charge;</span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>the plan (and whether it was monthly or annual) or the credit pack; and</span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>a short reason, so we can match the payment.</span>
          </li>
        </ul>
        <p>
          We acknowledge the request within two business days. If we approve the refund,{' '}
          {LEGAL_ENTITY} sends it back to the original payment method through the payment processor.
          Your bank or card issuer decides when the amount shows on your statement. If we cannot
          match the charge, we will ask you for the receipt.
        </p>
      </>
    ),
  },
  {
    id: 'refund-cancellation',
    title: 'Cancellation is not a refund',
    body: (
      <p>
        Paid plans renew automatically until you cancel. You may cancel at any time. Cancellation
        stops the next renewal, and you keep access until the end of the period you have already
        paid for. Cancelling does not, by itself, refund that period. A refund is available only
        when the eligibility rules above are met.
      </p>
    ),
  },
  {
    id: 'refund-statutory',
    title: 'Rights the law already gives you',
    body: (
      <p>
        If the law where you live gives you a stronger right to a refund, or a right to withdraw
        from a purchase of unused digital content, that right still applies. This policy does not
        limit those rights. Where the law allows a provider to treat consumed digital content as
        final, used credits and books that have already been generated stay non-refundable.
      </p>
    ),
  },
]
}
