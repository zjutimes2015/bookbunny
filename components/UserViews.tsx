'use client'

import Link from 'next/link'
import BunnyMascot from './BunnyMascot'
import { useAuth } from '@/lib/auth-context'

/** ─── 匿名用户：展示产品价值，引导登录 ─── */
export function AnonymousView({ children }: { children?: React.ReactNode }) {
  const { login } = useAuth()

  return (
    <div className="space-y-6">
      {/* Feature teaser banner */}
      <div className="apple-card p-6 bg-gradient-to-r from-[#FFF5EE] to-[#F0F0FF] border-[#C8A2E8]/30">
        <div className="flex items-center gap-4">
          <div className="bunny-bounce"><BunnyMascot size={48} /></div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#2D2D2D]">Sign in to create your first book!</h3>
            <p className="text-sm text-[#8E8E93] mt-0.5">Free characters, stories, and KDP-ready exports.</p>
          </div>
          <button onClick={login} className="apple-button text-sm px-5 py-2.5 whitespace-nowrap">
            Sign in with Google
          </button>
        </div>
      </div>

      {children}
    </div>
  )
}

/** ─── 免费用户：展示免费功能，引导付费 ─── */
export function FreeUserView({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="space-y-4">
      {/* Free tier banner */}
      <div className="apple-card p-5 border-l-4 border-l-[#98D8C8]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🐰</span>
              <span className="font-semibold text-[#2D2D2D]">Free Plan</span>
              <span className="text-xs bg-[#98D8C8]/20 text-[#4A9E8E] px-2 py-0.5 rounded-full font-medium">Active</span>
            </div>
            <p className="text-sm text-[#8E8E93] mt-0.5">
              You have <strong>1 free book</strong> with a watermarked preview. Upgrade for watermark-free exports.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/pricing" className="apple-button text-sm px-4 py-2 whitespace-nowrap">Upgrade</Link>
            <button onClick={logout} className="apple-button-secondary text-sm px-3 py-2 text-[#8E8E93]">Sign Out</button>
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}

/** ─── 付费用户：完整体验 ─── */
export function PaidUserView({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth()

  const tierLabel =
    user?.subscriptionTier === 'studio'
      ? 'Studio'
      : user?.subscriptionTier === 'creator'
      ? 'Creator'
      : user?.subscriptionTier === 'starter'
      ? 'Starter'
      : 'Paid'

  const tierDetail =
    user?.subscriptionTier === 'studio'
      ? '100 books a month, 3 concurrent jobs & batch generation.'
      : user?.subscriptionTier === 'creator'
      ? '30 books a month, KDP export & commercial rights.'
      : '10 books a month, watermark-free PDF export.'

  return (
    <div className="space-y-4">
      {/* Paid user banner */}
      <div className="apple-card p-5 border-l-4 border-l-[#FFD700] bg-gradient-to-r from-[#FFFDF0] to-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <span className="font-semibold text-[#2D2D2D]">{tierLabel} Plan</span>
              <span className="text-xs bg-[#FFD700]/20 text-[#B8960F] px-2 py-0.5 rounded-full font-medium">Premium</span>
            </div>
            <p className="text-sm text-[#8E8E93] mt-0.5">
              {tierDetail}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#8E8E93]">{user?.email}</span>
            <button onClick={logout} className="apple-button-secondary text-xs px-3 py-1.5 text-[#8E8E93]">Sign Out</button>
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}

/** ─── 用户头像菜单 ─── */
export function UserAvatar() {
  const { user, loading, login, logout } = useAuth()

  if (loading) return <div className="w-8 h-8 rounded-full bg-[#F2F2F7] animate-pulse" />
  if (!user) return (
    <button onClick={login} className="apple-button text-sm px-4 py-2">
      Sign In
    </button>
  )

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#8E8E93] hidden sm:block">{user.name}</span>
      <div className="relative group">
        <div className="w-8 h-8 rounded-full bg-[#FFF5EE] flex items-center justify-center text-sm font-bold text-[#FF6B8A] cursor-pointer overflow-hidden border-2 border-[#E5E5EA]">
          {user.image ? (
            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        {/* Dropdown */}
        <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-xl border border-[#E5E5EA] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
          <div className="p-3 border-b border-[#E5E5EA]">
            <p className="text-sm font-medium text-[#2D2D2D]">{user.name}</p>
            <p className="text-xs text-[#8E8E93]">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                user.isPaid ? 'bg-[#FFD700]/20 text-[#B8960F]' : 'bg-[#98D8C8]/20 text-[#4A9E8E]'
              }`}>
                {user.isPaid ? user.subscriptionTier : 'Free'}
              </span>
              {user.isAdmin && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-[#FF6B8A]/20 text-[#FF6B8A]">
                  Admin
                </span>
              )}
            </div>
          </div>
          {user.isAdmin ? (
            <Link href="/admin" className="block px-3 py-2 text-sm text-[#2D2D2D] hover:bg-[#F2F2F7]">
              🛡️ Admin Dashboard
            </Link>
          ) : (
            <Link href={user.isPaid ? '/progress' : '/pricing'} className="block px-3 py-2 text-sm text-[#2D2D2D] hover:bg-[#F2F2F7]">
              {user.isPaid ? 'My Progress' : 'Upgrade Plan'}
            </Link>
          )}
          <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#F2F2F7]">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
