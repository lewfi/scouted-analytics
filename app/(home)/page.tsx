import { createClient } from '@/lib/supabase/server'
import SeriesAccordion from '@/components/tournaments/SeriesAccordion'
import Link from 'next/link'

const regionLabel: Record<string, string> = {
  lcs: 'LCS', lec: 'LEC', lck: 'LCK', lpl: 'LPL', lcp: 'LCP',
}

export default async function Home() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: matches }, { data: ongoing }] = await Promise.all([
    supabase
      .from('matches')
      .select(`
        *,
        team_blue:teams!matches_team_blue_id_fkey(id, name, short_name, slug),
        team_red:teams!matches_team_red_id_fkey(id, name, short_name, slug),
        winner:teams!matches_winner_id_fkey(id, name, short_name, slug),
        tournament:tournaments(name, region_id),
        games(
          id, game_number, winning_team_id, duration_seconds, patch, played_at,
          team_blue_picks, team_red_picks, team_blue_bans, team_red_bans,
          player_game_stats(
            id, player_id, player_name, team_id, side, role, champion,
            kills, deaths, assists, cs, gold_earned, items
          )
        )
      `)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(20),

    supabase
      .from('tournaments')
      .select('id, name, start_date, end_date, region:regions(slug)')
      .not('leaguepedia_name', 'is', null)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('start_date', { ascending: false }),
  ])

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">

      {ongoing && ongoing.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Ongoing</h2>
          <div className="flex flex-wrap gap-2">
            {ongoing.map((t: any) => {
              const slug = (t.region as any)?.slug as string
              return (
                <Link
                  key={t.id}
                  href={`/tournaments/${encodeURIComponent(t.name)}`}
                  className="flex items-center gap-2 bg-zinc-900 border border-zinc-800/60 rounded-lg px-3 py-2 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-200 group"
                >
                  <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    {regionLabel[slug] ?? slug?.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                    {t.name}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-6">Recent matches</h1>
      <div className="flex flex-col gap-2">
        {(matches ?? []).map((match: any, i: number) => (
          <div key={match.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 20}ms` }}>
            <Link
              href={`/tournaments/${encodeURIComponent(match.tournament?.name ?? '')}`}
              className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-1.5 hover:text-zinc-300 transition-colors inline-block"
            >
              {match.tournament?.name}
            </Link>
            <SeriesAccordion match={match} />
          </div>
        ))}
      </div>

    </div>
  )
}
