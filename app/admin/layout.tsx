import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AdminShell from '@/components/AdminShell'
import { getAdminSession } from '@/lib/admin'

// 后台永远按请求实时校验，不做静态化
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — SproutTales',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminSession()
  // 未登录 / 非白名单：直接 404，不暴露后台存在
  if (!admin) notFound()

  return <AdminShell email={admin.email}>{children}</AdminShell>
}
