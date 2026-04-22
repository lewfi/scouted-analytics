'use client'

import Link from 'next/link'

interface NavbarProps {
  onMenuClick: () => void
  onSearchClick: () => void
}

export default function Navbar({ onMenuClick, onSearchClick }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-10 h-14 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 flex items-center px-4 gap-4">
      <button
        onClick={onMenuClick}
        className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-150"
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect y="2" width="16" height="1.5" rx="0.75" fill="currentColor"/>
          <rect y="7.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
          <rect y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
        </svg>
      </button>

      <Link href="/" className="font-semibold text-zinc-100 tracking-tight hover:text-white transition-colors">
        Scouted
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 h-8 px-3 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-150 border border-zinc-800 hover:border-zinc-700"
          aria-label="Search"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="text-xs hidden sm:block">Search</span>
          <kbd className="text-xs text-zinc-600 hidden sm:block">⌘K</kbd>
        </button>
      </div>
    </nav>
  )
}
