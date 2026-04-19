'use client'

import { useState } from 'react'

interface TournamentAccordionProps {
  tournament: any
}

export default function TournamentAccordion({ tournament }: TournamentAccordionProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
        {/* header - clicking this toggles open/closed */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800"
        >
            <span className="font-medium text-zinc-100">{tournament.name}</span>
            <span className="text-zinc-400">{isOpen ? '▲' : '▼'}</span>
        </button>

        {/* match list - only shown when open */}
        {isOpen && (
            <div className="flex flex-col gap-1 p-2">
                {/* map through tournament.matches here */}
                {tournament.matches.map((match: any) => (
                    <div key={match.id} className="grid grid-cols-3 items-center px-4 py-2 rounded hover:bg-zinc-800">
                        <span className={`text-sm ${match.winner_id === match.team_blue_id ? 'text-zinc-100 font-medium' : 'text-zinc-500'}`}>
                        {match.team_blue?.name}
                        </span>

                        <span className="text-sm text-zinc-400 font-mono text-center">
                        {match.blue_score} - {match.red_score}
                        </span>

                        <span className={`text-sm text-right ${match.winner_id === match.team_red_id ? 'text-zinc-100 font-medium' : 'text-zinc-500'}`}>
                        {match.team_red?.name}
                        </span>

                    </div>
                ))}
                
            </div>
        )}

    </div>
    )
}