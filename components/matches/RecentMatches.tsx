import Link from 'next/link'

interface RecentMatchesProps {
  matches: any[]
}

export default function RecentMatches({ matches }: RecentMatchesProps) {
    return (
        <div className="flex flex-col gap-2">
        {matches.map((match) => (
            <div key={match.id} className="bg-zinc-900 rounded-lg px-4 py-3">
                <p className="text-xs text-zinc-500 mb-2">{match.tournament?.name}</p>
                
                <div className="grid grid-cols-3 items-center">
                    <Link href={`/teams/${match.team_blue?.slug}`} className={`text-sm hover:underline ${match.winner_id === match.team_blue_id ? 'text-zinc-100 font-medium' : 'text-zinc-500'}`}>
                        {match.team_blue?.name}
                    </Link>

                    <span className="text-sm text-zinc-400 font-mono text-center">
                        {match.blue_score} - {match.red_score}
                    </span>

                    <Link href={`/teams/${match.team_red?.slug}`} className={`text-sm text-right hover:underline ${match.winner_id === match.team_red_id ? 'text-zinc-100 font-medium' : 'text-zinc-500'}`}>
                        {match.team_red?.name}
                    </Link>

                </div>
            </div>
        ))}
        </div>
    )
}