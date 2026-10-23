import type { Metadata } from 'next'
import AdminShell from '@/components/AdminShell'

/** The admin console must never be indexed; the shell itself is a client component. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
