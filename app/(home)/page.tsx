import { createClient } from '@/lib/supabase/server'
import RecentMatches from '@/components/matches/RecentMatches'

export default async function Home() {
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from('matches')
      .select(`
        *,
          team_blue:teams!matches_team_blue_id_fkey(id, name, short_name, slug),
          team_red:teams!matches_team_red_id_fkey(id, name, short_name, slug),
          winner:teams!matches_winner_id_fkey(id, name, short_name, slug),
          tournament:tournaments(name, region_id)
      `)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-zinc-100 mb-6">Recent matches</h1>
      <RecentMatches matches={matches ?? []} />
    </div>
  )
}
