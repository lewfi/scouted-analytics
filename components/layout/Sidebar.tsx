'use client'

import Link from 'next/link'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

const linkClass = "text-sm text-zinc-400 hover:text-zinc-100 px-2 py-1.5 rounded hover:bg-zinc-800"

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    return (
        <>
            {/* overlay: darkens background when sidebar is open */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/50 z-20"
                />
            )}
            
            {/* sidebar panel */}
            <div className={`fixed top-0 left-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 z-30 transition-transform duration-300 ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>

                {/* header with close button */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800">
                    <span className="font-semibold text-zinc-100">Scouted</span>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100">✕</button>
                </div>

                {/* nav content */}
                <div className="p-4 flex flex-col gap-6">
                
                    {/* regions section */}
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Regions</p>
                        <div className="flex flex-col gap-1">
                            <Link href="/lck" className={linkClass}>LCK</Link>
                            <Link href="/lec" className={linkClass}>LEC</Link>
                            <Link href="/lcs" className={linkClass}>LCS</Link>
                            <Link href="/lpl" className={linkClass}>LPL</Link>
                            <Link href="/lcp" className={linkClass}>LCP</Link>
                        </div>
                    </div>

                    {/* browse section */}
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Browse</p>
                        <div className="flex flex-col gap-1">
                            {/* add Teams and Players links */}
                            <Link href="/teams" className={linkClass}>Teams</Link>
                            <Link href="/players" className={linkClass}>Players</Link>
                        </div>
                    </div>
                </div>

            </div>
        </>
    )
}