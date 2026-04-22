import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const roleOrder = ['top', 'jungle', 'mid', 'bot', 'support']
const roleLabel: Record<string, string> = {
  top: 'Top', jungle: 'Jungle', mid: 'Mid', bot: 'Bot', support: 'Support',
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
    .select(`
      id, winner_id, team_blue_id, team_red_id, scheduled_at,
      tournament:tournaments(id, name, season),
      team_blue:teams!matches_team_blue_id_fkey(id, name, slug),
      team_red:teams!matches_team_red_id_fkey(id, name, slug)
    `)
    .or(`team_blue_id.eq.${team?.id},team_red_id.eq.${team?.id}`)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false })

  const mostRecentTournament = (matches ?? [])[0]?.tournament as any
  const tournamentMatches    = (matches ?? []).filter((m: any) => m.tournament?.id === mostRecentTournament?.id)

  const wins   = tournamentMatches.filter((m: any) => m.winner_id === team?.id).length
  const losses = tournamentMatches.length - wins

  // Head-to-head: all-time record vs each opponent (from tournament matches)
  const h2hMap = new Map<string, { opponent: any; wins: number; losses: number }>()
  for (const m of tournamentMatches as any[]) {
    const isBlue   = m.team_blue_id === team?.id
    const opponent = isBlue ? m.team_red : m.team_blue
    if (!opponent?.id) continue
    if (!h2hMap.has(opponent.id)) h2hMap.set(opponent.id, { opponent, wins: 0, losses: 0 })
    const entry = h2hMap.get(opponent.id)!
    if (m.winner_id === team?.id) entry.wins++
    else entry.losses++
  }
  const h2h = [...h2hMap.values()].sort((a, b) => {
    const aTotal = a.wins + a.losses
    const bTotal = b.wins + b.losses
    return bTotal - aTotal
  })

  const activePlayers = (team?.players ?? [])
    .filter((p: any) => p.is_active)
    .sort((a: any, b: any) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))

  return (
    <div className="p-8 max-w-2xl animate-fade-in">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">{team?.name}</h1>
      </div>

      {/* Record */}
      {mostRecentTournament && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 mb-8">
          <Link
            href={`/tournaments/${encodeURIComponent(mostRecentTournament.name)}`}
            className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3 hover:text-zinc-300 transition-colors inline-block"
          >
            {mostRecentTournament.name}
          </Link>
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

      {/* Head-to-head */}
      {h2h.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">
            Head-to-Head — {mostRecentTournament?.name}
          </h2>
          <div className="border border-zinc-800/60 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-600 border-b border-zinc-800/60 bg-zinc-900/50">
                  <th className="text-left px-4 py-2.5 font-medium">Opponent</th>
                  <th className="text-center px-4 py-2.5 font-medium">W</th>
                  <th className="text-center px-4 py-2.5 font-medium">L</th>
                  <th className="text-center px-4 py-2.5 font-medium hidden sm:table-cell">Record</th>
                </tr>
              </thead>
              <tbody>
                {h2h.map((entry) => (
                  <tr key={entry.opponent.id} className="border-t border-zinc-800/40 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/teams/${entry.opponent.slug}`}
                        className="font-medium text-zinc-200 hover:text-white transition-colors"
                      >
                        {entry.opponent.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono text-green-400">{entry.wins}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-red-400">{entry.losses}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-zinc-500 hidden sm:table-cell">
                      {entry.wins}-{entry.losses}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roster */}
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
