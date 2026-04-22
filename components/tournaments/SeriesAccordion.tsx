'use client'

import Link from 'next/link'
import { useState } from 'react'

const roleOrder = ['top', 'jungle', 'mid', 'bot', 'support']

function totalKills(stats: any[], side: number) {
  return stats.filter(p => p.side === side).reduce((s: number, p: any) => s + (p.kills || 0), 0)
}

function GameRow({ game, match }: { game: any; match: any }) {
  const [open, setOpen] = useState(false)
  const stats: any[] = game.player_game_stats ?? []
  const blueKills = totalKills(stats, 1)
  const redKills  = totalKills(stats, 2)
  const blueWon   = game.winning_team_id === match.team_blue_id
  const redWon    = game.winning_team_id === match.team_red_id

  const bluePlayers = stats
    .filter(p => p.side === 1)
    .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))
  const redPlayers = stats
    .filter(p => p.side === 2)
    .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))

  return (
    <div className="border-t border-zinc-800/60 first:border-t-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors text-left"
      >
        <span className="text-xs text-zinc-500 w-12 shrink-0">Game {game.game_number}</span>

        <div className="flex-1 flex items-center gap-2">
          <span className={`text-xs font-semibold truncate max-w-20 ${blueWon ? 'text-zinc-100' : 'text-zinc-500'}`}>
            {match.team_blue?.name}
          </span>
          <span className={`text-sm font-bold font-mono ${blueWon ? 'text-blue-400' : 'text-zinc-500'}`}>
            {blueKills}
          </span>
          <span className="text-xs text-zinc-600">k</span>
        </div>

        <span className="text-xs text-zinc-600">vs</span>

        <div className="flex-1 flex items-center justify-end gap-2">
          <span className="text-xs text-zinc-600">k</span>
          <span className={`text-sm font-bold font-mono ${redWon ? 'text-red-400' : 'text-zinc-500'}`}>
            {redKills}
          </span>
          <span className={`text-xs font-semibold truncate max-w-20 ${redWon ? 'text-zinc-100' : 'text-zinc-500'}`}>
            {match.team_red?.name}
          </span>
        </div>

        {game.duration_seconds && (
          <span className="text-xs text-zinc-600 w-12 text-right shrink-0">
            {Math.floor(game.duration_seconds / 60)}:{String(game.duration_seconds % 60).padStart(2, '0')}
          </span>
        )}

        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`shrink-0 text-zinc-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-2">
          {/* Draft */}
          {(game.team_blue_bans?.length > 0 || game.team_red_bans?.length > 0) && (
            <div className="rounded-lg overflow-hidden border border-zinc-800/60">
              <DraftRow
                label="Bans"
                blue={game.team_blue_bans ?? []}
                red={game.team_red_bans ?? []}
                blueTeam={match.team_blue?.name}
                redTeam={match.team_red?.name}
              />
              {(game.team_blue_picks?.length > 0 || game.team_red_picks?.length > 0) && (
                <DraftRow
                  label="Picks"
                  blue={game.team_blue_picks ?? []}
                  red={game.team_red_picks ?? []}
                  blueTeam={match.team_blue?.name}
                  redTeam={match.team_red?.name}
                />
              )}
            </div>
          )}

          {/* Player stats */}
          {stats.length > 0 && (
            <div className="rounded-lg overflow-hidden border border-zinc-800/60">
              <StatsTable players={bluePlayers} teamName={match.team_blue?.name} won={blueWon} />
              <StatsTable players={redPlayers} teamName={match.team_red?.name} won={redWon} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DraftRow({ label, blue, red, blueTeam, redTeam }: {
  label: string; blue: string[]; red: string[]; blueTeam: string; redTeam: string
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 px-3 py-2 border-b border-zinc-800/60 last:border-b-0">
      <div className="flex flex-wrap gap-1">
        {blue.map((c, i) => (
          <span key={i} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-medium">{c}</span>
        ))}
      </div>
      <span className="text-xs text-zinc-600 font-medium w-10 text-center pt-0.5">{label}</span>
      <div className="flex flex-wrap gap-1 justify-end">
        {red.map((c, i) => (
          <span key={i} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-medium">{c}</span>
        ))}
      </div>
    </div>
  )
}

function StatsTable({ players, teamName, won }: { players: any[]; teamName: string; won: boolean }) {
  return (
    <div>
      <div className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider ${won ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-900 text-zinc-500'}`}>
        {teamName}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-zinc-600 border-b border-zinc-800/60">
            <th className="text-left px-3 py-1.5 font-medium">Champion</th>
            <th className="text-left px-3 py-1.5 font-medium hidden sm:table-cell">Role</th>
            <th className="text-center px-3 py-1.5 font-medium">KDA</th>
            <th className="text-center px-3 py-1.5 font-medium">CS</th>
            <th className="text-right px-3 py-1.5 font-medium hidden md:table-cell">Gold</th>
            <th className="text-left px-3 py-1.5 font-medium hidden lg:table-cell">Items</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={i} className="border-t border-zinc-800/40 hover:bg-zinc-800/20">
              <td className="px-3 py-2">
                <div>
                  <span className="font-medium text-zinc-200">{p.champion ?? '—'}</span>
                  <Link
                    href={`/players/${encodeURIComponent(p.player_name?.split(' (')[0] ?? '')}`}
                    className="ml-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    {p.player_name?.split(' (')[0]}
                  </Link>
                </div>
              </td>
              <td className="px-3 py-2 text-zinc-500 capitalize hidden sm:table-cell">{p.role}</td>
              <td className="px-3 py-2 text-center font-mono">
                <span className="text-green-400">{p.kills}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-red-400">{p.deaths}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-blue-400">{p.assists}</span>
              </td>
              <td className="px-3 py-2 text-center text-zinc-400 font-mono">{p.cs}</td>
              <td className="px-3 py-2 text-right text-zinc-400 font-mono hidden md:table-cell">
                {p.gold_earned ? `${(p.gold_earned / 1000).toFixed(1)}k` : '—'}
              </td>
              <td className="px-3 py-2 hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {(p.items ?? []).filter(Boolean).map((item: string, j: number) => (
                    <span key={j} className="text-zinc-500 text-xs bg-zinc-800 px-1.5 py-0.5 rounded">
                      {item}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SeriesAccordion({ match }: { match: any }) {
  const [open, setOpen] = useState(false)
  const blueWon = match.winner_id === match.team_blue_id
  const redWon  = match.winner_id === match.team_red_id
  const games: any[] = (match.games ?? []).sort((a: any, b: any) => a.game_number - b.game_number)

  return (
    <div className="border border-zinc-800/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-800/30 transition-colors text-left"
      >
        <Link
          href={`/teams/${match.team_blue?.slug}`}
          onClick={e => e.stopPropagation()}
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
          onClick={e => e.stopPropagation()}
          className={`flex-1 text-sm font-medium text-right transition-colors ${redWon ? 'text-zinc-100 hover:text-white' : 'text-zinc-500 hover:text-zinc-400'}`}
        >
          {match.team_red?.name}
        </Link>

        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`shrink-0 text-zinc-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="bg-zinc-900/50">
          {games.length > 0 ? (
            games.map(game => (
              <GameRow key={game.id} game={game} match={match} />
            ))
          ) : (
            <p className="px-5 py-3 text-xs text-zinc-600">No game data available</p>
          )}
        </div>
      )}
    </div>
  )
}
