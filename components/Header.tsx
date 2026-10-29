'use client'

import Link from 'next/link'
import { useState } from 'react'
import { UserAvatar } from './UserViews'
import BrandMark from './BrandMark'
import clsx from 'clsx'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <BrandMark size={32} radius={0.22} className="shrink-0" />
            <span className="font-semibold text-lg text-[#2D2D2D] group-hover:opacity-70 transition-opacity">
              SproutTales
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-7">
            <Link href="/buddy" className="rounded-md px-3 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-100">
              Lila & Kai
            </Link>
            <Link href="/create" className="rounded-md px-3 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-100">
              Create Book
            </Link>
            <Link href="/progress" className="rounded-md px-3 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-100">
              Progress
            </Link>
            <Link href="/pricing" className="rounded-md px-3 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-100">
              Pricing
            </Link>
            <Link href="/affiliate" className="rounded-md px-3 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-100">
              Affiliates
            </Link>
            <Link href="/about" className="rounded-md px-3 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-100">
              About
            </Link>
            <Link href="/create" className="rounded-md bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
              Get Started
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
            <Link href="/buddy" className="block px-3 py-2 rounded-xl text-sm text-[#8E8E93] hover:bg-[#F2F2F7]"
                  onClick={() => setMenuOpen(false)}>
              Lila & Kai
            </Link>
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
            <Link href="/create" className="block rounded-md bg-black px-3 py-2 text-center text-sm font-semibold text-white"
                  onClick={() => setMenuOpen(false)}>
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
