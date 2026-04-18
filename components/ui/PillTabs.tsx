'use client'

import { useState } from 'react'

interface Tab {
  label: string
  value: string
}

interface PillTabsProps {
  tabs: Tab[]
  onChange: (value: string) => void
}

export default function PillTabs({ tabs, onChange }: PillTabsProps) {
    const [ active, setActive ] = useState(tabs[0].value)

    return (
        <div className='flex gap-2'>
            {tabs.map((tab) => (
                <button
                    key={tab.value}
                    onClick={() => {
                        setActive(tab.value)
                        onChange(tab.value)
                    }}
                    className={active === tab.value
                        ? 'px-4 py-1.5 rounded-full text-sm font-medium bg-zinc-100 text-zinc-900'
                        : 'px-4 py-1.5 rounded-full text-sm text-zinc-400 hover:text-zinc-100'
                    }
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}