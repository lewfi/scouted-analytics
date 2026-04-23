'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  const apply = (mode: 'dark' | 'light') => {
    const html = document.documentElement
    if (mode === 'light') {
      html.classList.add('light')
    } else {
      html.classList.remove('light')
    }
    localStorage.setItem('scouted-theme', mode)
    setIsDark(mode === 'dark')
  }

  useEffect(() => {
    const stored = localStorage.getItem('scouted-theme')
    if (stored === 'light') apply('light')
  }, [])

  return (
    <button
      onClick={() => apply(isDark ? 'light' : 'dark')}
      className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-150"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M7.5 1.5V3M7.5 12V13.5M1.5 7.5H3M12 7.5H13.5M3.4 3.4L4.45 4.45M10.55 10.55L11.6 11.6M3.4 11.6L4.45 10.55M10.55 4.45L11.6 3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M6 1.5C3.24 2.18 1.5 4.63 1.5 7.5C1.5 10.81 4.19 13.5 7.5 13.5C9.88 13.5 11.95 12.13 12.98 10.13C12.49 10.23 11.99 10.28 11.47 10.28C8.16 10.28 5.47 7.59 5.47 4.28C5.47 3.27 5.73 2.33 6.18 1.5H6Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}
