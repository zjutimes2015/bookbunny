import type { Metadata } from 'next'

/** Reading progress is per-account data behind a sign-in wall — keep it out of the index. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
