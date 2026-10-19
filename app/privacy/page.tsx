import type { Metadata } from 'next'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import {
  SITE_URL,
  SITE_NAME,
  LEGAL_ENTITY,
  LEGAL_CONTACT_EMAIL,
  POLICY_VERSION,
} from '@/lib/site'

const TITLE = 'Privacy Policy — Parent and Child Data at SproutTales'
const DESCRIPTION =
  'How SproutTales collects, uses, and protects parent and child personal information — verifiable parental consent, our service providers, retention limits, and how to withdraw consent.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/privacy`,
    siteName: SITE_NAME,
    type: 'website',
  },
}

const SUBHEAD = 'text-sm font-semibold text-[#2D2D2D] mt-5 mb-2'
const LIST = 'space-y-2'
const ITEM = 'flex items-start gap-2'
const DOT = 'text-[#FF6B8A] mt-0.5'
const STRONG = 'text-[#2D2D2D] font-medium'

type Section = {
  id: string
  title: string
  body: React.ReactNode
}

const SECTIONS: Section[] = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    body: (
      <>
        <p>
          SproutTales is an AI children&apos;s picture-book generator. The Service is operated by{' '}
          <span className={STRONG}>{LEGAL_ENTITY}</span>, which is the data controller responsible
          for the personal information described in this policy.
        </p>
        <p>
          This policy explains what personal information we collect, why we collect it, how we use
          and protect it, and the choices available to you. It applies to the SproutTales website,
          apps, and services (the &ldquo;Service&rdquo;), including the accounts parents use and the
          children depicted in the books they create.
        </p>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Operator:</span> {LEGAL_ENTITY}
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Privacy contact:</span> {LEGAL_CONTACT_EMAIL}
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Effective date:</span> {POLICY_VERSION}
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information we collect',
    body: (
      <>
        <p>We collect only the information needed to operate the Service.</p>

        <h3 className={SUBHEAD}>(a) Parent or guardian account data</h3>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>Your name and email address, provided when you create an account.</span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              Profile information returned by an OAuth provider (for example, Google) when you sign
              in with one — such as your name, email address, and provider account identifier.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              Subscription and billing status (plan and renewal date). Full payment-card details are
              collected and stored by our payment processor, not by us.
            </span>
          </li>
        </ul>

        <h3 className={SUBHEAD}>(b) Children&apos;s personal information</h3>
        <p>
          For this product, the child&apos;s personal information is limited to the following, and is
          only collected when a parent chooses to include it:
        </p>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>The child&apos;s first name, when the parent chooses to include it.</span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              A child&apos;s photograph — but only when the parent deliberately selects the
              photo-based character option (Option B). If the parent uses the description-based
              option (Option A) instead, no photograph is collected at all.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              Optionally, a recording of the parent&apos;s or the child&apos;s voice, when the
              read-aloud feature is used.
            </span>
          </li>
        </ul>
        <p>
          <span className={STRONG}>Important limits.</span> We do not collect the child&apos;s date
          of birth. A photograph you upload is used solely to derive an illustrated character; it is
          not retained as a standalone asset once character processing is complete.
        </p>

        <h3 className={SUBHEAD}>(c) Service and technical data</h3>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              Device, browser, IP address, and cookie or similar identifiers, and log and usage data
              needed to operate, secure, and debug the Service.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-it',
    title: 'How we use it',
    body: (
      <>
        <p>We use the information above only for the following purposes:</p>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Generating the illustrated character</span> from the
              parent&apos;s inputs, including a photograph where the parent chooses that option.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Generating the book pages</span> that make up the story.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Generating the read-aloud audio</span> for a book.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Keeping the parent&apos;s library</span> of books and
              characters available to the account.
            </span>
          </li>
        </ul>
        <p>
          We do not use children&apos;s personal information for any purpose beyond these.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-do-not-do',
    title: 'What we do NOT do',
    body: (
      <ul className={LIST}>
        <li className={ITEM}>
          <span className={DOT}>•</span>
          <span>
            We do not serve behavioral advertising to children, and we do not use children&apos;s
            personal information for targeted advertising of any kind.
          </span>
        </li>
        <li className={ITEM}>
          <span className={DOT}>•</span>
          <span>We do not sell or rent children&apos;s personal information.</span>
        </li>
        <li className={ITEM}>
          <span className={DOT}>•</span>
          <span>
            We do not disclose children&apos;s personal information to third parties for those third
            parties&apos; own purposes.
          </span>
        </li>
      </ul>
    ),
  },
  {
    id: 'childrens-privacy',
    title: 'Children’s Privacy',
    body: (
      <>
        <p>
          This section explains how we handle children&apos;s personal information. It is central to
          how the Service works, because the books a parent creates may depict their own child.
        </p>

        <h3 className={SUBHEAD}>Verifiable parental consent</h3>
        <p>
          We do not knowingly collect personal information from a child under 13 without{' '}
          <span className={STRONG}>verifiable parental consent</span> obtained before collection.
          The account holder must be the child&apos;s parent or legal guardian, and consent for the
          child&apos;s participation is captured before any child personal information is collected or
          used.
        </p>

        <h3 className={SUBHEAD}>How we obtain consent</h3>
        <p>
          Consent is obtained through a verification step that ties the consenting adult to their own
          identity or payment instrument — for example, a small verification charge or confirmation
          on a payment instrument the parent controls, a check of a government-issued ID, or an
          equivalent method designed to ensure the person consenting is the parent or guardian. We
          record the version of this policy under which consent was granted.
        </p>

        <h3 className={SUBHEAD}>Parental rights</h3>
        <p>At any time, a parent or guardian may:</p>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>review the personal information we hold about their child;</span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>refuse to permit further collection or use of that information;</span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>revoke consent at any time; and</span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>request deletion of the child&apos;s personal information.</span>
          </li>
        </ul>

        <h3 className={SUBHEAD}>Withdrawing consent</h3>
        <p>
          You can revoke consent using the &ldquo;Withdraw consent&rdquo; control in your account (or
          the equivalent in-product setting), or by contacting us at {LEGAL_CONTACT_EMAIL}.
          Withdrawal stops further collection and use and triggers deletion as described in the
          Retention section below.
        </p>

        <h3 className={SUBHEAD}>Retention limits</h3>
        <p>
          We keep children&apos;s personal information only for as long as needed to provide the
          features the parent enabled, and we delete it on revocation or account deletion, subject to
          the limited exceptions described in the Retention section.
        </p>
      </>
    ),
  },
  {
    id: 'service-providers',
    title: 'Service providers',
    body: (
      <>
        <p>
          We use a limited set of processors that act only on our instructions and under contracts
          that restrict how they may use the data:
        </p>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>OpenRouter</span> and{' '}
              <span className={STRONG}>Black Forest Labs</span> — model access and image generation.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Neon</span> — database hosting.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Cloudflare</span> — file storage.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Creem</span> — payment processing.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Resend</span> — transactional email.
            </span>
          </li>
        </ul>
        <p>
          Each processor handles personal information only to perform the service we have engaged it
          for, and not for its own purposes.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'Retention',
    body: (
      <>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Account data:</span> kept for as long as the account is
              active, then deleted or anonymized after closure, except where we must retain records
              (for example, billing or tax records) for a limited period required by law.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Uploaded photograph:</span> used only to derive the
              illustrated character and not kept as a standalone asset after processing.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Voice recordings:</span> retained only while needed to produce
              the read-aloud audio for the associated book.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Child&apos;s first name and generated assets:</span> kept for
              as long as the parent keeps the book or character in the library.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>On revocation:</span> we delete the child&apos;s personal
              information and stop further collection and use; generated books that depend on it are
              removed from the library.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>
        We use administrative, technical, and organizational measures to protect personal
        information, including encryption in transit, access controls, and least-privilege access.
        No method of transmission or storage is completely secure, but we work to protect the
        information we hold and to limit how long we keep it.
      </p>
    ),
  },
  {
    id: 'international-transfers',
    title: 'International transfers',
    body: (
      <p>
        We may process and store information in countries other than the one in which you live,
        including where our processors operate. Where required, we use appropriate safeguards for
        these transfers.
      </p>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    body: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>access the personal information we hold about you and your child;</span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>correct inaccurate information;</span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>delete the information;</span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>receive a portable copy of the information; and</span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>withdraw consent at any time.</span>
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact us at {LEGAL_CONTACT_EMAIL}.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this policy. When we do, we change the effective date shown on this page (the
        current version is {POLICY_VERSION}). If a change affects how we handle children&apos;s
        personal information, we will request renewed verifiable parental consent before the change
        takes effect for the child. A change to the policy version invalidates prior consent records
        and requires parents to re-consent.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <p>
        For questions, requests, or complaints about privacy, contact {LEGAL_ENTITY} at{' '}
        {LEGAL_CONTACT_EMAIL}.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 text-center">
        <div className="bunny-bounce mb-4 inline-block">
          <BunnyMascot size={64} />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto leading-[1.1]">
          Privacy <span className="bunny-text-gradient">Policy</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          How SproutTales handles parent and child personal information — from verifiable parental
          consent to the choices you have over the data you share.
        </p>
        <p className="mt-4 text-sm text-[#8E8E93]">
          Effective date: {POLICY_VERSION}
        </p>
      </section>

      {/* Sections */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-6">
          {SECTIONS.map((section, index) => (
            <div key={section.id} id={section.id} className="apple-card p-8">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">
                <span className="text-[#FF6B8A]">{index + 1}.</span> {section.title}
              </h2>
              <div className="space-y-3 text-sm text-[#8E8E93] leading-relaxed">{section.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing note */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="apple-card p-8">
          <p className="text-sm text-[#2D2D2D] leading-relaxed">
            This page describes our privacy practices. It is not legal advice, and it does not create
            a legal relationship. Before launch, the operator should have qualified legal counsel
            review this policy to confirm it fits the jurisdictions served and the consent method in
            use.
          </p>
          <p className="mt-4 text-sm text-[#8E8E93] leading-relaxed">
            See also our{' '}
            <Link href="/terms" className="text-[#FF6B8A] font-medium">
              Terms of Service
            </Link>
            , or return to the{' '}
            <Link href="/" className="text-[#FF6B8A] font-medium">
              SproutTales home page
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
