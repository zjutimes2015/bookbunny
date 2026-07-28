import type { Metadata } from 'next'
import '@/styles/globals.css'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'BookBunny — Create Magical Children\'s Books with AI',
  description: 'Upload a photo, create a character-consistent story, and export a KDP-ready children\'s book in minutes. Powered by AI.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white">
        <Header />
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  )
}
