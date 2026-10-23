import type { Metadata } from 'next'

/** Individual books are private account content — keep them out of the index. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
