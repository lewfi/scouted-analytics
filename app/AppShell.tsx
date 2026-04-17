'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    
    return (
        <div>
            <Navbar onMenuClick={() => setIsOpen(true)} />
            <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <main className="pt-14">
                {children}
            </main>
        </div>
    )
}