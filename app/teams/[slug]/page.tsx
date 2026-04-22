import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const roleOrder = ['top', 'jungle', 'mid', 'bot', 'support']

const roleLabel: Record<string, string> = {
  top: 'Top',
  jungle: 'Jungle',
  mid: 'Mid',
  bot: 'Bot',
  support: 'Support',
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: team } = await supabase
    .from('teams')
    .select(`*, players(id, summoner_name, role, is_active)`)
    .eq('slug', slug)
    .single()

  const { data: matches } = await supabase
    .from('matches')
    .select(`*, tournament:tournaments(id, name, season)`)
    .or(`team_blue_id.eq.${team?.id},team_red_id.eq.${team?.id}`)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false })

  const mostRecentTournament = matches?.[0]?.tournament
  const tournamentMatches = matches?.filter(
    (m: any) => m.tournament?.id === mostRecentTournament?.id
  )

  const wins   = tournamentMatches?.filter((m: any) => m.winner_id === team?.id).length ?? 0
  const losses = (tournamentMatches?.length ?? 0) - wins

  const activePlayers = (team?.players ?? [])
    .filter((p: any) => p.is_active)
    .sort((a: any, b: any) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))

  return (
    <div className="p-8 max-w-2xl animate-fade-in">

      {/* header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">{team?.name}</h1>
      </div>

      {/* record */}
      {mostRecentTournament && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 mb-8">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">
            {mostRecentTournament.name}
          </p>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{wins}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">Wins</p>
            </div>
            <div className="w-px h-8 bg-zinc-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{losses}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">Losses</p>
            </div>
          </div>
        </div>
      )}

      {/* roster */}
      <div>
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Roster</h2>
        <div className="flex flex-col gap-2">
          {activePlayers.map((player: any, i: number) => (
            <Link
              key={player.id}
              href={`/players/${encodeURIComponent(player.summoner_name)}`}
              className="animate-fade-in-up flex items-center justify-between bg-zinc-900 border border-zinc-800/60 rounded-xl px-5 py-3.5 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-200 group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-sm font-medium text-zinc-100 group-hover:text-white transition-colors">
                {player.summoner_name}
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                {roleLabel[player.role] ?? player.role}
              </span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
