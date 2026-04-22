import Link from 'next/link'

interface RecentMatchesProps {
  matches: any[]
}

export default function RecentMatches({ matches }: RecentMatchesProps) {
    return (
        <div className="flex flex-col gap-2">
            {matches.map((match, i) => {
                const blueWon = match.winner_id === match.team_blue_id
                const redWon  = match.winner_id === match.team_red_id

                return (
                    <div
                        key={match.id}
                        className="animate-fade-in-up group bg-zinc-900 border border-zinc-800/60 rounded-xl px-5 py-4 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-200"
                        style={{ animationDelay: `${i * 40}ms` }}
                    >
                        <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wide font-medium">
                            {match.tournament?.name}
                        </p>

                        <div className="flex items-center gap-3">
                            <Link
                                href={`/teams/${match.team_blue?.slug}`}
                                className={`flex-1 text-sm font-medium transition-colors ${blueWon ? 'text-zinc-100 hover:text-white' : 'text-zinc-500 hover:text-zinc-400'}`}
                            >
                                {match.team_blue?.name}
                            </Link>

                            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 shrink-0">
                                <span className={`text-sm font-mono font-semibold ${blueWon ? 'text-zinc-100' : 'text-zinc-500'}`}>
                                    {match.blue_score}
                                </span>
                                <span className="text-xs text-zinc-600">–</span>
                                <span className={`text-sm font-mono font-semibold ${redWon ? 'text-zinc-100' : 'text-zinc-500'}`}>
                                    {match.red_score}
                                </span>
                            </div>

                            <Link
                                href={`/teams/${match.team_red?.slug}`}
                                className={`flex-1 text-sm font-medium text-right transition-colors ${redWon ? 'text-zinc-100 hover:text-white' : 'text-zinc-500 hover:text-zinc-400'}`}
                            >
                                {match.team_red?.name}
                            </Link>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
