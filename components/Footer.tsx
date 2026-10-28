import Link from 'next/link'
import { LEGAL_CONTACT_EMAIL, LEGAL_ENTITY, SITE_NAME } from '@/lib/site'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-[#EFEAE3] bg-[#FDFBF7]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="text-base font-bold text-[#2D2D2D]">{SITE_NAME}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#8E8E93]">
              Turn an idea into an illustrated children&apos;s picture book — consistent
              characters, reading-level-matched text, and a print-ready PDF.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm sm:grid-cols-3" aria-label="Footer">
            <div className="space-y-3">
              <p className="font-semibold text-[#2D2D2D]">Product</p>
              <Link href="/buddy" className="block text-[#8E8E93] hover:text-[#FF6B8A]">
                Talk to Lila & Kai
              </Link>
              <Link href="/create" className="block text-[#8E8E93] hover:text-[#FF6B8A]">
                Create a book
              </Link>
              <Link href="/pricing" className="block text-[#8E8E93] hover:text-[#FF6B8A]">
                Pricing
              </Link>
              <Link href="/affiliate" className="block text-[#8E8E93] hover:text-[#FF6B8A]">
                Affiliate program
              </Link>
              <Link href="/personalized-childrens-books" className="block text-[#8E8E93] hover:text-[#FF6B8A]">
                Personalized gifts
              </Link>
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-[#2D2D2D]">Learn</p>
              <Link href="/blog/how-to-make-a-childrens-book" className="block text-[#8E8E93] hover:text-[#FF6B8A]">
                How-to guide
              </Link>
              <Link href="/vs/readkidz" className="block text-[#8E8E93] hover:text-[#FF6B8A]">
                SproutTales vs ReadKidz
              </Link>
              <Link href="/about" className="block text-[#8E8E93] hover:text-[#FF6B8A]">
                About
              </Link>
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-[#2D2D2D]">Legal</p>
              <Link href="/terms" className="block text-[#8E8E93] hover:text-[#FF6B8A]">
                Terms of Service
              </Link>
              <Link href="/refunds" className="block text-[#8E8E93] hover:text-[#FF6B8A]">
                Refund Policy
              </Link>
              <Link href="/privacy" className="block text-[#8E8E93] hover:text-[#FF6B8A]">
                Privacy Policy
              </Link>
              <Link href="/safety" className="block text-[#8E8E93] hover:text-[#FF6B8A]">
                Safety & Privacy
              </Link>
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-[#2D2D2D]">Contact</p>
              <a
                href={`mailto:${LEGAL_CONTACT_EMAIL}`}
                className="block break-all text-[#8E8E93] hover:text-[#FF6B8A]"
              >
                {LEGAL_CONTACT_EMAIL}
              </a>
              <a
                href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=Content%20report`}
                className="block text-[#8E8E93] hover:text-[#FF6B8A]"
              >
                Report content
              </a>
            </div>
          </nav>
        </div>

        <div className="mt-10 border-t border-[#EFEAE3] pt-6 text-xs text-[#8E8E93]">
          © {year} {LEGAL_ENTITY}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
