import { createClient } from '@/lib/supabase/server'
import SeriesAccordion from '@/components/tournaments/SeriesAccordion'
import Link from 'next/link'

function computeStandings(matches: any[]) {
  const map = new Map<string, { team: any; wins: number; losses: number }>()
  for (const m of matches) {
    if (!m.winner_id) continue
    if (!map.has(m.team_blue_id)) map.set(m.team_blue_id, { team: m.team_blue, wins: 0, losses: 0 })
    if (!map.has(m.team_red_id))  map.set(m.team_red_id,  { team: m.team_red,  wins: 0, losses: 0 })
    const blue = map.get(m.team_blue_id)!
    const red  = map.get(m.team_red_id)!
    if (m.winner_id === m.team_blue_id)     { blue.wins++;  red.losses++ }
    else if (m.winner_id === m.team_red_id) { red.wins++;   blue.losses++ }
  }
  return [...map.values()].sort((a, b) =>
    b.wins !== a.wins ? b.wins - a.wins : a.losses - b.losses
  )
}

function computeChampStats(matches: any[]) {
  const map = new Map<string, { games: number; wins: number; kills: number; deaths: number; assists: number }>()
  for (const m of matches) {
    for (const g of m.games ?? []) {
      for (const p of g.player_game_stats ?? []) {
        if (!p.champion) continue
        const won = g.winning_team_id === p.team_id
        const cur = map.get(p.champion) ?? { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 }
        map.set(p.champion, {
          games:   cur.games + 1,
          wins:    cur.wins + (won ? 1 : 0),
          kills:   cur.kills + (p.kills ?? 0),
          deaths:  cur.deaths + (p.deaths ?? 0),
          assists: cur.assists + (p.assists ?? 0),
        })
      }
    }
  }
  return [...map.entries()]
    .map(([name, d]) => ({
      name,
      ...d,
      winRate: d.games > 0 ? (d.wins / d.games) * 100 : 0,
      kda: d.deaths > 0 ? (d.kills + d.assists) / d.deaths : d.kills + d.assists,
    }))
    .sort((a, b) => b.games - a.games)
}

export default async function TournamentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const tournamentName = decodeURIComponent(name)
  const supabase = await createClient()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select(`
      id, name, start_date, end_date, season,
      region:regions(name, slug),
      matches(
        id, team_blue_id, team_red_id, winner_id, blue_score, red_score, scheduled_at,
        team_blue:teams!matches_team_blue_id_fkey(id, name, short_name, slug),
        team_red:teams!matches_team_red_id_fkey(id, name, short_name, slug),
        winner:teams!matches_winner_id_fkey(id, name, short_name, slug),
        games(
          id, game_number, winning_team_id, duration_seconds, patch, played_at,
          team_blue_picks, team_red_picks, team_blue_bans, team_red_bans,
          player_game_stats(
            id, player_id, player_name, team_id, side, role, champion,
            kills, deaths, assists, cs, gold_earned, items
          )
        )
      )
    `)
    .eq('name', tournamentName)
    .single()

  if (!tournament) {
    return <div className="p-8"><p className="text-zinc-500">Tournament not found.</p></div>
  }

  const completedMatches = (tournament.matches ?? []).filter((m: any) => m.winner_id)
  const allMatches = (tournament.matches ?? []).sort((a: any, b: any) =>
    new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime()
  )

  const standings  = computeStandings(completedMatches)
  const champStats = computeChampStats(completedMatches)

  const region = tournament.region as any
  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null
  const dateRange = tournament.start_date
    ? `${fmt(tournament.start_date)}${tournament.end_date ? ` – ${fmt(tournament.end_date)}` : ''}`
    : null

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-8">
        {region && (
          <Link
            href={`/${region.slug}`}
            className="text-xs text-zinc-500 uppercase tracking-widest font-medium hover:text-zinc-300 transition-colors mb-2 inline-block"
          >
            {region.name}
          </Link>
        )}
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">{tournament.name}</h1>
        {dateRange && <p className="text-sm text-zinc-500 mt-1">{dateRange}</p>}
      </div>

      {/* Standings */}
      {standings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Standings</h2>
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
                    <tr key={s.team?.id ?? i} className="border-t border-zinc-800/40 hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-2.5 text-zinc-600 font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <Link href={`/teams/${s.team?.slug}`} className="font-medium text-zinc-200 hover:text-white transition-colors">
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
        </div>
      )}

      {/* Champion Meta */}
      {champStats.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Champion Meta</h2>
          <div className="border border-zinc-800/60 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-600 border-b border-zinc-800/60 bg-zinc-900/50">
                  <th className="text-left px-4 py-2.5 font-medium">Champion</th>
                  <th className="text-center px-4 py-2.5 font-medium">GP</th>
                  <th className="text-center px-4 py-2.5 font-medium">Win %</th>
                  <th className="text-center px-4 py-2.5 font-medium hidden sm:table-cell">KDA</th>
                  <th className="text-right px-4 py-2.5 font-medium hidden md:table-cell">Avg K/D/A</th>
                </tr>
              </thead>
              <tbody>
                {champStats.slice(0, 15).map((c, i) => (
                  <tr key={c.name} className="border-t border-zinc-800/40 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-zinc-200">{c.name}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-zinc-400">{c.games}</td>
                    <td className="px-4 py-2.5 text-center font-mono">
                      <span className={c.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>
                        {c.winRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono text-zinc-300 hidden sm:table-cell">
                      {c.kda.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-zinc-500 hidden md:table-cell">
                      {(c.kills / c.games).toFixed(1)} / {(c.deaths / c.games).toFixed(1)} / {(c.assists / c.games).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Matches */}
      <div>
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Matches</h2>
        {allMatches.length === 0 ? (
          <p className="text-sm text-zinc-500">No completed matches yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {allMatches.map((match: any, i: number) => (
              <div key={match.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 20}ms` }}>
                <SeriesAccordion match={match} />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
