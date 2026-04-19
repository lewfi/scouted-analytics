import { createClient } from '@/lib/supabase/server'

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: team } = await supabase
    .from('teams')
    .select(`
      *,
      players (
        id,
        summoner_name,
        role,
        is_active
      )
    `)
    .eq('slug', slug)
    .single()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      tournament:tournaments(id, name, season)
    `)
    .or(`team_blue_id.eq.${team?.id},team_red_id.eq.${team?.id}`)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false })

  const mostRecentTournament = matches?.[0]?.tournament
  const tournamentMatches = matches?.filter(
    (m: any) => m.tournament?.id === mostRecentTournament?.id
  )

  const wins = tournamentMatches?.filter((m: any) => m.winner_id === team?.id).length ?? 0
  const losses = (tournamentMatches?.length ?? 0) - wins

  return (
    <div className="p-8 max-w-3xl">
      {/* team header */}
      <h1 className="text-2xl font-semibold text-zinc-100 mb-1">{team?.name}</h1>
      <p className="text-sm text-zinc-500 mb-8">{team?.short_name}</p>

      <p className="text-xs text-zinc-500 mb-1">{mostRecentTournament?.name}</p>
      <div className="flex gap-4 mb-8">
        <span className="text-green-400 font-medium">{wins}W</span>
        <span className="text-red-400 font-medium">{losses}L</span>
      </div>

      {/* roster */}
      <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Roster</h2>
      <div className="flex flex-col gap-2">
        {team?.players
          .filter((p: any) => p.is_active)
          .sort((a: any, b: any) => {
            const order = ['top', 'jungle', 'mid', 'bot', 'support']
            return order.indexOf(a.role) - order.indexOf(b.role)
          })
          .map((player: any) => (
            <div key={player.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-4 py-3">
              <span className="text-sm font-medium text-zinc-100">{player.summoner_name}</span>
              <span className="text-xs text-zinc-500 capitalize">{player.role}</span>
            </div>
          ))}
      </div>
    </div>
  )
}