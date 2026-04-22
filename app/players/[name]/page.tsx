import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const roleLabel: Record<string, string> = {
  top: 'Top',
  jungle: 'Jungle',
  mid: 'Mid',
  bot: 'Bot',
  support: 'Support',
}

function avg(arr: number[]) {
  return arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0
}

export default async function PlayerPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const playerName = decodeURIComponent(name)
  const supabase = await createClient()

  const { data: player } = await supabase
    .from('players')
    .select(`*, team:teams(id, name, slug)`)
    .eq('summoner_name', playerName)
    .single()

  const { data: rawStats } = player?.id ? await supabase
    .from('player_game_stats')
    .select(`
      champion, kills, deaths, assists, cs, gold_earned, team_id,
      game:games(
        id, winning_team_id, played_at,
        match:matches(
          id, team_blue_id, team_red_id,
          team_blue:teams!matches_team_blue_id_fkey(id, name, slug),
          team_red:teams!matches_team_red_id_fkey(id, name, slug),
          tournament:tournaments(id, name)
        )
      )
    `)
    .eq('player_id', player.id)
    .limit(100) : { data: [] }

  const stats = (rawStats ?? [])
    .filter((s: any) => s.game?.played_at)
    .sort((a: any, b: any) => b.game.played_at.localeCompare(a.game.played_at))
    .slice(0, 20)

  const avgKills   = avg(stats.map((s: any) => s.kills ?? 0))
  const avgDeaths  = avg(stats.map((s: any) => s.deaths ?? 0))
  const avgAssists = avg(stats.map((s: any) => s.assists ?? 0))
  const kdaRatio   = avgDeaths > 0 ? (avgKills + avgAssists) / avgDeaths : avgKills + avgAssists
  const avgCS      = avg(stats.map((s: any) => s.cs ?? 0))
  const avgGold    = avg(stats.map((s: any) => s.gold_earned ?? 0))

  const champMap = new Map<string, { games: number; wins: number; kills: number; deaths: number; assists: number }>()
  for (const s of stats as any[]) {
    const champ = s.champion ?? 'Unknown'
    const won = s.game?.winning_team_id === s.team_id
    const cur = champMap.get(champ) ?? { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 }
    champMap.set(champ, {
      games: cur.games + 1,
      wins:  cur.wins + (won ? 1 : 0),
      kills: cur.kills + (s.kills ?? 0),
      deaths: cur.deaths + (s.deaths ?? 0),
      assists: cur.assists + (s.assists ?? 0),
    })
  }
  const champPool = [...champMap.entries()]
    .map(([champ, d]) => ({
      name: champ,
      ...d,
      kda: d.deaths > 0 ? (d.kills + d.assists) / d.deaths : d.kills + d.assists,
      winRate: d.games > 0 ? (d.wins / d.games) * 100 : 0,
    }))
    .sort((a, b) => b.games - a.games)

  return (
    <div className="p-8 max-w-3xl animate-fade-in">

      <div className="mb-8">
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-1">
          {roleLabel[player?.role] ?? player?.role}
        </p>
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">{player?.summoner_name}</h1>
        {player?.team && (
          <Link
            href={`/teams/${(player.team as any).slug}`}
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors mt-1 inline-block"
          >
            {(player.team as any).name}
          </Link>
        )}
      </div>

      {stats.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'KDA',      value: kdaRatio.toFixed(2) },
              { label: 'Avg K/D/A', value: `${avgKills.toFixed(1)} / ${avgDeaths.toFixed(1)} / ${avgAssists.toFixed(1)}` },
              { label: 'Avg CS',   value: avgCS.toFixed(0) },
              { label: 'Avg Gold', value: `${(avgGold / 1000).toFixed(1)}k` },
            ].map(stat => (
              <div key={stat.label} className="bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-zinc-100 font-mono">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Champion Pool</h2>
            <div className="border border-zinc-800/60 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-zinc-600 border-b border-zinc-800/60 bg-zinc-900/50">
                    <th className="text-left px-4 py-2.5 font-medium">Champion</th>
                    <th className="text-center px-4 py-2.5 font-medium">GP</th>
                    <th className="text-center px-4 py-2.5 font-medium">Win %</th>
                    <th className="text-center px-4 py-2.5 font-medium">KDA</th>
                    <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">Avg K/D/A</th>
                  </tr>
                </thead>
                <tbody>
                  {champPool.map((c, i) => (
                    <tr key={c.name} className="border-t border-zinc-800/40 hover:bg-zinc-800/20">
                      <td className="px-4 py-2.5 font-medium text-zinc-200">{c.name}</td>
                      <td className="px-4 py-2.5 text-center text-zinc-400 font-mono">{c.games}</td>
                      <td className="px-4 py-2.5 text-center font-mono">
                        <span className={c.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>
                          {c.winRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-zinc-300">{c.kda.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right text-zinc-500 font-mono text-xs hidden sm:table-cell">
                        {(c.kills / c.games).toFixed(1)} / {(c.deaths / c.games).toFixed(1)} / {(c.assists / c.games).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Recent Games</h2>
            <div className="flex flex-col gap-1.5">
              {(stats as any[]).map((s, i) => {
                const game  = s.game
                const match = game?.match
                const won   = game?.winning_team_id === s.team_id
                const isBlue = match?.team_blue_id === s.team_id
                const opponent = isBlue ? match?.team_blue : match?.team_red
                const opponentTeam = isBlue ? match?.team_red : match?.team_blue
                const playedAt = game?.played_at
                  ? new Date(game.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : null

                return (
                  <div
                    key={i}
                    className="animate-fade-in-up flex items-center gap-3 bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-3"
                    style={{ animationDelay: `${i * 20}ms` }}
                  >
                    <span className={`text-xs font-bold w-4 shrink-0 ${won ? 'text-green-400' : 'text-red-400'}`}>
                      {won ? 'W' : 'L'}
                    </span>

                    <span className="text-sm font-medium text-zinc-200 w-28 shrink-0 truncate">
                      {s.champion ?? '—'}
                    </span>

                    <span className="text-sm font-mono shrink-0">
                      <span className="text-green-400">{s.kills}</span>
                      <span className="text-zinc-600">/</span>
                      <span className="text-red-400">{s.deaths}</span>
                      <span className="text-zinc-600">/</span>
                      <span className="text-blue-400">{s.assists}</span>
                    </span>

                    <span className="text-xs text-zinc-500 font-mono hidden sm:block shrink-0">{s.cs} CS</span>

                    <span className="text-xs text-zinc-500 font-mono hidden md:block shrink-0">
                      {s.gold_earned ? `${(s.gold_earned / 1000).toFixed(1)}k` : '—'}
                    </span>

                    <div className="flex-1" />

                    {opponentTeam && (
                      <Link
                        href={`/teams/${opponentTeam.slug}`}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 hidden sm:block"
                      >
                        vs {opponentTeam.name}
                      </Link>
                    )}

                    <div className="text-right shrink-0">
                      <p className="text-xs text-zinc-600">{playedAt}</p>
                      <p className="text-xs text-zinc-600 truncate max-w-32">{match?.tournament?.name}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-zinc-500">No game data available.</p>
      )}

    </div>
  )
}
