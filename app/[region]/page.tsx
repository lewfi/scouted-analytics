import { createClient } from '@/lib/supabase/server'
import SeriesAccordion from '@/components/tournaments/SeriesAccordion'
import Link from 'next/link'

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region: regionSlug } = await params
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: region } = await supabase
    .from('regions')
    .select('id, name, slug')
    .eq('slug', regionSlug)
    .single()

  if (!region) {
    return <div className="p-8"><p className="text-zinc-500">Region not found.</p></div>
  }

  const { data: allTournaments } = await supabase
    .from('tournaments')
    .select('id, name, start_date, end_date, season')
    .eq('region_id', region.id)
    .order('start_date', { ascending: false })

  const active = (allTournaments ?? []).find(t =>
    t.start_date <= today && (!t.end_date || t.end_date >= today)
  ) ?? allTournaments?.[0] ?? null

  const pastTournaments = (allTournaments ?? []).filter(t => t.id !== active?.id)

  let activeFull: any = null
  if (active) {
    const { data } = await supabase
      .from('tournaments')
      .select(`
        id, name, start_date, end_date,
        matches(
          id, team_blue_id, team_red_id, winner_id, blue_score, red_score, scheduled_at, status,
          team_blue:teams!matches_team_blue_id_fkey(id, name, slug),
          team_red:teams!matches_team_red_id_fkey(id, name, slug),
          games(
            id, game_number, winning_team_id, duration_seconds,
            player_game_stats(
              id, player_id, player_name, team_id, side, role, champion,
              kills, deaths, assists, cs, gold_earned, items
            )
          )
        )
      `)
      .eq('id', active.id)
      .single()
    activeFull = data
  }

  const completedMatches = (activeFull?.matches ?? []).filter((m: any) => m.winner_id)

  // Compute standings
  const standingsMap = new Map<string, { team: any; wins: number; losses: number }>()
  for (const m of completedMatches) {
    if (!standingsMap.has(m.team_blue_id)) standingsMap.set(m.team_blue_id, { team: m.team_blue, wins: 0, losses: 0 })
    if (!standingsMap.has(m.team_red_id))  standingsMap.set(m.team_red_id,  { team: m.team_red,  wins: 0, losses: 0 })
    const blue = standingsMap.get(m.team_blue_id)!
    const red  = standingsMap.get(m.team_red_id)!
    if (m.winner_id === m.team_blue_id)      { blue.wins++;  red.losses++ }
    else if (m.winner_id === m.team_red_id)  { red.wins++;   blue.losses++ }
  }
  const standings = [...standingsMap.values()].sort((a, b) =>
    b.wins !== a.wins ? b.wins - a.wins : a.losses - b.losses
  )

  const recentMatches = [...completedMatches]
    .sort((a: any, b: any) =>
      new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime()
    )
    .slice(0, 10)

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null

  return (
    <div className="p-8 max-w-3xl animate-fade-in">

      <h1 className="text-3xl font-bold text-zinc-100 tracking-tight mb-8">{region.name}</h1>

      {activeFull && (
        <>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Standings</h2>
              <Link
                href={`/tournaments/${encodeURIComponent(activeFull.name)}`}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {activeFull.name} →
              </Link>
            </div>

            {standings.length > 0 ? (
              <div className="border border-zinc-800/60 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-600 border-b border-zinc-800/60 bg-zinc-900/50">
                      <th className="text-left px-4 py-2.5 font-medium w-8">#</th>
                      <th className="text-left px-4 py-2.5 font-medium">Team</th>
                      <th className="text-center px-4 py-2.5 font-medium">W</th>
                      <th className="text-center px-4 py-2.5 font-medium">L</th>
                      <th className="text-center px-4 py-2.5 font-medium hidden sm:table-cell">W%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, i) => {
                      const total = s.wins + s.losses
                      const pct   = total > 0 ? ((s.wins / total) * 100).toFixed(0) : '—'
                      return (
                        <tr key={s.team?.id ?? i} className="border-t border-zinc-800/40 hover:bg-zinc-800/20">
                          <td className="px-4 py-2.5 text-zinc-600 font-mono text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5">
                            <Link
                              href={`/teams/${s.team?.slug}`}
                              className="font-medium text-zinc-200 hover:text-white transition-colors"
                            >
                              {s.team?.name}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono text-green-400">{s.wins}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-red-400">{s.losses}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-zinc-400 hidden sm:table-cell">{pct}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No completed matches yet.</p>
            )}
          </div>

          {recentMatches.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Recent Matches</h2>
              <div className="flex flex-col gap-2">
                {recentMatches.map((match: any) => (
                  <SeriesAccordion key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {pastTournaments.length > 0 && (
        <div>
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Past Tournaments</h2>
          <div className="flex flex-col gap-1.5">
            {pastTournaments.map((t: any) => (
              <Link
                key={t.id}
                href={`/tournaments/${encodeURIComponent(t.name)}`}
                className="flex items-center justify-between bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-3 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-200 group"
              >
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                  {t.name}
                </span>
                <span className="text-xs text-zinc-600">
                  {fmt(t.start_date)}{t.end_date ? ` – ${fmt(t.end_date)}` : ''}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
