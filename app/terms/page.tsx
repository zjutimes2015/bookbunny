import type { Metadata } from 'next'
import Link from 'next/link'
import BunnyMascot from '@/components/BunnyMascot'
import {
  SITE_URL,
  SITE_NAME,
  LEGAL_ENTITY,
  LEGAL_CONTACT_EMAIL,
  LEGAL_JURISDICTION,
  POLICY_VERSION,
} from '@/lib/site'

const TITLE = 'Terms of Service — SproutTales'
const DESCRIPTION =
  'The terms that govern SproutTales: eligibility for parents and guardians, content rules for photographs of children, AI-output disclaimers, ownership and licensing, payments, and more.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/terms`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SproutTales terms of service',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/twitter-image.png'],
  },
  keywords: [
    'terms of service children books',
    'AI picture book terms',
    'children content policy',
    'commercial license terms',
    'SproutTales terms',
  ],
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
    id: 'acceptance',
    title: 'Acceptance of terms',
    body: (
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of SproutTales. By creating an
        account or using the Service, you agree to these Terms. If you do not agree, do not use the
        Service. These Terms are an agreement between you and{' '}
        <span className={STRONG}>{LEGAL_ENTITY}</span> (the operator of SproutTales). These Terms
        correspond to policy version {POLICY_VERSION}.
      </p>
    ),
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    body: (
      <>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              The account holder must be an adult parent or legal guardian, at least 18 years old,
              and able to enter into a binding contract.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              The Service is not directed to children as account holders. A child may appear in a
              book only when a consenting parent or guardian creates it on the child&apos;s behalf.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              Where a child participates, the parent or guardian must provide verifiable parental
              consent as described in our Privacy Policy before any child personal information is
              collected or used.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'parental-responsibility',
    title: 'Parent and guardian responsibility',
    body: (
      <p>
        The account holder is responsible for the child&apos;s use of the Service, for supervising
        that use, and for ensuring that any content depicting the child is created with the
        parent&apos;s or guardian&apos;s authority and consent. You agree to review all generated
        content before it is shared, printed, or published.
      </p>
    ),
  },
  {
    id: 'account-and-acceptable-use',
    title: 'Your account and acceptable use',
    body: (
      <>
        <p>
          You are responsible for keeping your account credentials secure and for all activity that
          occurs under your account. You agree not to:
        </p>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>use the Service for any unlawful purpose or in violation of these Terms;</span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              attempt to probe, disrupt, or bypass the security or integrity of the Service;
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              copy, resell, or redistribute the Service itself, except where your plan expressly
              allows it; or
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>upload content you do not have the right to use.</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'content-rules',
    title: 'Content rules',
    body: (
      <>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              You must own or otherwise have the right to upload any photograph you submit, and you
              must not upload a photograph of a third party without their permission.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              You must have the authority to consent on behalf of the child depicted in any
              photograph or recording you upload.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              You must not upload content that is unlawful, infringing, or that depicts any person
              without the necessary rights.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'prohibited-content',
    title: 'Content standards and prohibited generations',
    body: (
      <>
        <p>
          SproutTales generates illustrations, story text, and narration with AI. You may not use the
          Service to create, upload, request, store, or share any of the following, and we do not
          permit such output to be produced or published through the Service:
        </p>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Sexual or NSFW content.</span> Pornography, sexualised
              depictions of any person, and any sexual content involving minors.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Violence or gore.</span> Graphic violence, mutilation,
              sadistic or gratuitous injury, and content that promotes self-harm.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Hate speech.</span> Content that promotes hatred, harassment,
              or discrimination against people based on race, ethnicity, religion, disability, gender,
              or sexual orientation.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Child-unsafe content.</span> Child sexual abuse material
              (CSAM) in any form, content that sexualises or endangers a child, and any depiction of a
              child that is unlawful in your jurisdiction. We report apparent CSAM to the relevant
              authorities.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Deepfakes and impersonation.</span> Content that depicts a
              real, identifiable person without their consent, or that is intended to deceive others
              about a person&apos;s identity, statements, or actions.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Copyright or trademark infringement.</span> Reproducing
              protected characters, artwork, lyrics, or brands you do not have the rights to use.
            </span>
          </li>
        </ul>
        <p className={SUBHEAD}>Reporting violations</p>
        <p>
          Anyone can report content or a prompt that breaches these standards, without needing an
          account, by emailing{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=Content%20report`} className={STRONG}>
            {LEGAL_CONTACT_EMAIL}
          </a>{' '}
          with the subject line &ldquo;Content report&rdquo; and, where possible, the book link or
          generation ID. We acknowledge reports within two business days.
        </p>
        <p className={SUBHEAD}>How we review and act</p>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              Prompts and uploads are screened automatically, and reported content is reviewed by a
              human before any decision is taken.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              Where a breach is confirmed we remove the content, block the generation, and may
              suspend or terminate the account. Repeat or severe breaches lead to immediate
              termination.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              We keep a record of reports and actions taken, and we cooperate with law enforcement
              where the law requires it.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'ai-disclaimer',
    title: 'AI-generated content disclaimer',
    body: (
      <>
        <p>
          SproutTales uses AI models to write text, generate illustrations, and produce audio. Output is
          generated automatically and may be imperfect, inaccurate, or different from what you
          expected.
        </p>
        <p>
          You are responsible for reviewing all output before you use it or publish it — including
          before publishing any book to Amazon KDP. We do not guarantee any particular result,
          quality, or fitness for a specific purpose.
        </p>
      </>
    ),
  },
  {
    id: 'ownership-and-licence',
    title: 'Ownership and licence',
    body: (
      <>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Your inputs.</span> You keep the rights you hold in the
              material you provide, such as your story text and your photographs. You grant us a
              limited licence to process those inputs solely to provide the Service to you.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>Generated books.</span> You may use the books you generate for
              personal, non-commercial purposes. The commercial plan grants you commercial use rights
              to the books you generate under that plan.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              <span className={STRONG}>The Service.</span> We and our licensors retain all rights in
              and to the Service itself, including its software, models, and branding.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'third-party-publishing',
    title: 'Print-on-demand and third-party publishing',
    body: (
      <>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              SproutTales produces print-ready PDF files. It is not a printer or a publisher, and it
              does not manufacture or ship physical books.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              We are not affiliated with Amazon KDP and cannot guarantee that any book will be
              accepted, approved, or sold on any platform.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              Your use of any third-party platform is governed by that platform&apos;s own terms,
              separate from these Terms.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'payments',
    title: 'Payments, subscriptions, cancellation and refunds',
    body: (
      <>
        <ul className={LIST}>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              Payments are processed by our payment processor. You agree to its terms when you make a
              purchase.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              Paid plans are subscriptions that renew automatically until you cancel. You may cancel
              at any time, and access continues until the end of the period you have paid for.
            </span>
          </li>
          <li className={ITEM}>
            <span className={DOT}>•</span>
            <span>
              Refunds are provided as required by applicable law and as described at the point of
              purchase.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'warranties',
    title: 'Disclaimer of warranties',
    body: (
      <p>
        The Service and all generated content are provided &ldquo;as is&rdquo; and &ldquo;as
        available,&rdquo; without warranties of any kind, whether express or implied, including any
        implied warranties of merchantability, fitness for a particular purpose, and
        non-infringement, to the fullest extent permitted by law.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: (
      <p>
        To the fullest extent permitted by law, {LEGAL_ENTITY} will not be liable for any indirect,
        incidental, special, consequential, or punitive damages, or for any lost profits or lost
        data, arising out of or relating to your use of the Service. Our total liability for any
        claim relating to the Service will not exceed the amount you paid for the Service during the
        period giving rise to the claim.
      </p>
    ),
  },
  {
    id: 'termination',
    title: 'Termination',
    body: (
      <>
        <p>
          We may suspend or terminate access to the Service for accounts that violate these Terms or
          that create a risk to other users, to children, or to the Service. You may stop using the
          Service and delete your account at any time.
        </p>
      </>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing law',
    body: (
      <p>
        These Terms are governed by the laws of{' '}
        <span className={STRONG}>{LEGAL_JURISDICTION}</span>, without regard to its
        conflict-of-laws rules. Any dispute arising from these Terms or the Service is subject to
        the exclusive jurisdiction of the courts located there, unless mandatory consumer law in
        your country of residence gives you the right to bring proceedings elsewhere.
      </p>
    ),
  },
  {
    id: 'changes-to-terms',
    title: 'Changes to terms',
    body: (
      <p>
        We may update these Terms. When we do, we change the effective date shown on this page. Your
        continued use of the Service after a change means you accept the updated Terms. We will
        notify you of material changes, and any change that affects how we handle children&apos;s
        personal information will also require renewed parental consent as described in our Privacy
        Policy.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <p>
        For questions about these Terms, contact {LEGAL_ENTITY} at {LEGAL_CONTACT_EMAIL}. The current
        version of these Terms corresponds to policy version {POLICY_VERSION}.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 text-center">
        <div className="bunny-bounce mb-4 inline-block">
          <BunnyMascot size={64} />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2D2D2D] max-w-3xl mx-auto leading-[1.1]">
          Terms of <span className="bunny-text-gradient">Service</span>
        </h1>
        <p className="mt-5 text-lg text-[#8E8E93] max-w-2xl mx-auto leading-relaxed">
          The rules for using SproutTales — eligibility, content rules, AI-output disclaimers,
          ownership, payments, and the limits of our liability.
        </p>
        <p className="mt-4 text-sm text-[#8E8E93]">Effective date: {POLICY_VERSION}</p>
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
            This page describes our terms. It is not legal advice. Questions about these Terms,
            content reports, or data requests can be sent to{' '}
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[#FF6B8A] font-medium">
              {LEGAL_CONTACT_EMAIL}
            </a>
            .
          </p>
          <p className="mt-4 text-sm text-[#8E8E93] leading-relaxed">
            See also our{' '}
            <Link href="/privacy" className="text-[#FF6B8A] font-medium">
              Privacy Policy
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
