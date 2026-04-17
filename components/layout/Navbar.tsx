'use client'

interface NavbarProps {
    onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    return (
        <nav className="h-14 border-b border-zinc-800 flex items-center px-4 gap-4">
            <button onClick={onMenuClick} className="text-zinc-400 hover:text-zinc-100">
                ☰
            </button>

            <span className="font-semibold text-zinc-100 tracking-tight">
                Scouted
            </span>
            
            <div className="ml-auto flex items-center gap-3">

            </div>
        </nav>
    )
}