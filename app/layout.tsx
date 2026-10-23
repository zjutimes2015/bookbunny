import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CrispChat from '@/components/CrispChat'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { AuthProvider } from '@/lib/auth-context'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site'
import { rootGraphJsonLd } from '@/lib/jsonld'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
})

const DEFAULT_TITLE = 'SproutTales — Create Magical Children\'s Books with AI'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: '%s | SproutTales',
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    url: `${SITE_URL}/`,
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'SproutTales — turn an idea into a real picture book',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootGraphJsonLd()) }}
        />
        <Header />
        <CrispChat />
        <GoogleAnalytics />
        <AuthProvider>
          <main className="pt-16">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
