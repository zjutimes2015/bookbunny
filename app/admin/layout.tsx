'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import BunnyMascot from '@/components/BunnyMascot'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/books', label: 'Books', icon: '📚' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#F8F8FA] flex">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} transition-all duration-200 bg-white border-r border-[#E5E5EA] flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-[#E5E5EA] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bunny-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
            B
          </div>
          {!collapsed && <span className="font-semibold text-sm text-[#2D2D2D]">SproutTales</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-[#2D2D2D] text-white font-medium'
                    : 'text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#2D2D2D]'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-[#E5E5EA]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-[#8E8E93] hover:bg-[#F2F2F7] transition-all"
          >
            {collapsed ? '→' : '← Collapse'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
