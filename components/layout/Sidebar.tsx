'use client'

import Link from 'next/link'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

const linkClass = "text-sm text-zinc-400 hover:text-zinc-100 px-3 py-2 rounded-md hover:bg-zinc-800 transition-all duration-150 flex items-center gap-2"

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    return (
        <>
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 z-20 animate-fade-in"
                />
            )}

            <div className={`fixed top-0 left-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 z-30 transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>

                <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800">
                    <Link href="/" onClick={onClose} className="font-semibold text-zinc-100 hover:text-white transition-colors">
                        Scouted
                    </Link>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-150"
                        aria-label="Close menu"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                <div className="p-3 flex flex-col gap-5">

                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-1.5 px-3">Regions</p>
                        <div className="flex flex-col gap-0.5">
                            <Link href="/lck" onClick={onClose} className={linkClass}>LCK</Link>
                            <Link href="/lec" onClick={onClose} className={linkClass}>LEC</Link>
                            <Link href="/lcs" onClick={onClose} className={linkClass}>LCS</Link>
                            <Link href="/lpl" onClick={onClose} className={linkClass}>LPL</Link>
                            <Link href="/lcp" onClick={onClose} className={linkClass}>LCP</Link>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-1.5 px-3">Browse</p>
                        <div className="flex flex-col gap-0.5">
                            <Link href="/teams" onClick={onClose} className={linkClass}>Teams</Link>
                            <Link href="/players" onClick={onClose} className={linkClass}>Players</Link>
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}
