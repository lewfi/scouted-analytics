'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  // Returns styled nav link — active when path matches exactly or starts with href
  function navLink(href: string, label: string, exact = false) {
    const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        onClick={onClose}
        className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition-all duration-150 ${
          active
            ? 'bg-(--accent-muted) text-(--accent) font-medium'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 animate-fade-in"
        />
      )}

      <div className={`fixed top-0 left-0 h-full w-60 bg-zinc-900 border-r border-zinc-800/60 z-30 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>

        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800/60">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2 font-semibold text-zinc-100 hover:text-white transition-colors text-[15px] tracking-tight"
          >
            <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
            Scouted
          </Link>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-150"
            aria-label="Close menu"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 1L10 10M10 1L1 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-3 flex flex-col gap-5 overflow-y-auto">

          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-1 px-3">Regions</p>
            <div className="flex flex-col gap-0.5">
              {navLink('/lck', 'LCK', true)}
              {navLink('/lec', 'LEC', true)}
              {navLink('/lcs', 'LCS', true)}
              {navLink('/lpl', 'LPL', true)}
              {navLink('/lcp', 'LCP', true)}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-1 px-3">Browse</p>
            <div className="flex flex-col gap-0.5">
              {navLink('/tournaments', 'Tournaments')}
              {navLink('/teams', 'Teams')}
              {navLink('/players', 'Players')}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
