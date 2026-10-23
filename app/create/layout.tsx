import type { Metadata } from 'next'

/** The creator is an app surface behind a sign-in wall — keep it out of the index. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
