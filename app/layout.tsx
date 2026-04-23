import type { Metadata } from 'next'
import { Inter, DM_Mono } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from "@vercel/analytics/next"
import AppShell from '@/components/layout/AppShell'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Scouted',
  description: 'LoL esports analytics and scouting.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmMono.variable}`}>
      <body className="min-h-screen antialiased">
        <AppShell>{children}</AppShell>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
