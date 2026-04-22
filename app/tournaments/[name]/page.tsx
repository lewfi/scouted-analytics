import { createClient } from '@/lib/supabase/server'
import SeriesAccordion from '@/components/tournaments/SeriesAccordion'
import Link from 'next/link'

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
    return (
      <div className="p-8">
        <p className="text-zinc-500">Tournament not found.</p>
      </div>
    )
  }

  const matches = (tournament.matches ?? [])
    .filter((m: any) => m.status !== 'upcoming')
    .sort((a: any, b: any) =>
      new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime()
    )

  const region = tournament.region as any
  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null
  const dateRange = tournament.start_date
    ? `${fmt(tournament.start_date)}${tournament.end_date ? ` – ${fmt(tournament.end_date)}` : ''}`
    : null

  return (
    <div className="p-8 max-w-3xl animate-fade-in">

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

      {matches.length === 0 ? (
        <p className="text-sm text-zinc-500">No completed matches yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {matches.map((match: any, i: number) => (
            <div key={match.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 20}ms` }}>
              <SeriesAccordion match={match} />
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
