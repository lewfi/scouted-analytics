'use client'

import { useState } from 'react'
import PillTabs from '@/components/ui/PillTabs'

interface MatchListProps {
  regions: any[]
}

export default function MatchList({ regions }: MatchListProps) {
    const [activeRegion, setActiveRegion] = useState(regions[0]?.slug ?? '')
    const region = regions.find(r => r.slug === activeRegion)
    
    return (
        <div className="flex flex-col gap-6">
            <PillTabs 
                tabs={regions.map(r => ({ label: r.short_name, value: r.slug}))}
                onChange={setActiveRegion}
            />

            {region?.tournaments.map((tournament: any) => (
                <div key={tournament.id}>
                    <h2 className="text-sm font-medium text-zinc-400 mb-3">
                    {tournament.name}
                    </h2>
                    
                    <div className="flex flex-col gap-2">
                    {tournament.matches.map((match: any) => (
                        <div key={match.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-4 py-3">
                        
                        {/* blue team */}
                        <span className={`text-sm ${match.winner_id === match.team_blue_id ? 'text-zinc-100 font-medium' : 'text-zinc-500'}`}>
                            {match.team_blue?.name}
                        </span>

                        {/* score */}
                        <span className="text-sm text-zinc-400 font-mono">
                            {match.blue_score} - {match.red_score}
                        </span>

                        {/* red team */}
                        <span className={`text-sm ${match.winner_id === match.team_red_id ? 'text-zinc-100 font-medium' : 'text-zinc-500'}`}>
                            {match.team_red?.name}
                        </span>

                        </div>
                    ))}
                    </div>
                </div>
            ))}

        </div>
    )
}