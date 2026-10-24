'use client'

import Link from 'next/link'
import { useState } from 'react'
import { UserAvatar } from './UserViews'
import clsx from 'clsx'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bunny-gradient flex items-center justify-center text-white text-lg font-bold">
              B
            </div>
            <span className="font-semibold text-lg text-[#2D2D2D] group-hover:opacity-70 transition-opacity">
              SproutTales
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/create" className="text-sm font-medium text-[#8E8E93] hover:text-[#2D2D2D] transition-colors">
              Create Book
            </Link>
            <Link href="/progress" className="text-sm font-medium text-[#8E8E93] hover:text-[#2D2D2D] transition-colors">
              Progress
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-[#8E8E93] hover:text-[#2D2D2D] transition-colors">
              Pricing
            </Link>
            <Link href="/affiliate" className="text-sm font-medium text-[#8E8E93] hover:text-[#2D2D2D] transition-colors">
              Affiliates
            </Link>
            <Link href="/about" className="text-sm font-medium text-[#8E8E93] hover:text-[#2D2D2D] transition-colors">
              About
            </Link>
            <Link href="/create" className="bg-[#2D2D2D] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:opacity-85 transition-all hover:scale-[1.02]">
              Create Book
            </Link>
            <UserAvatar />
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-[#F2F2F7]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 5h16M2 10h16M2 15h16" stroke="#2D2D2D" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Link href="/create" className="block px-3 py-2 rounded-xl text-sm text-[#8E8E93] hover:bg-[#F2F2F7]"
                  onClick={() => setMenuOpen(false)}>
              Create Book
            </Link>
            <Link href="/progress" className="block px-3 py-2 rounded-xl text-sm text-[#8E8E93] hover:bg-[#F2F2F7]"
                  onClick={() => setMenuOpen(false)}>
              Progress
            </Link>
            <Link href="/pricing" className="block px-3 py-2 rounded-xl text-sm text-[#8E8E93] hover:bg-[#F2F2F7]"
                  onClick={() => setMenuOpen(false)}>
              Pricing
            </Link>
            <Link href="/affiliate" className="block px-3 py-2 rounded-xl text-sm text-[#8E8E93] hover:bg-[#F2F2F7]"
                  onClick={() => setMenuOpen(false)}>
              Affiliates
            </Link>
            <Link href="/about" className="block px-3 py-2 rounded-xl text-sm text-[#8E8E93] hover:bg-[#F2F2F7]"
                  onClick={() => setMenuOpen(false)}>
              About
            </Link>
            <Link href="/create" className="block px-3 py-2 rounded-xl text-sm font-medium text-white bg-[#2D2D2D] text-center"
                  onClick={() => setMenuOpen(false)}>
              Get Started Free
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
