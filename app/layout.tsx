import type { Metadata } from 'next'
import './globals.css'
import AppShell from '@/app/AppShell'

export const metadata = {
  title: 'Scouted',
  description: 'Track LoL esports!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}