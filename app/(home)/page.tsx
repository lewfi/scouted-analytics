import { createClient } from '@/lib/supabase/server'
import MatchList from '@/components/matches/MatchList'

export default async function Home() {
  const supabase = await createClient()

  const { data:regions } = await supabase
    .from('regions')
    .select(`
      *,
      tournaments (
        *,
        matches (
          *,
          team_blue:teams!matches_team_blue_id_fkey(id, name, short_name),
          team_red:teams!matches_team_red_id_fkey(id, name, short_name),
          winner:teams!matches_winner_id_fkey(id, name, short_name)
        )
      )
    `)
    .neq('slug', 'intl')
    .order('name')

  return (
    <div className="p-8">
      <MatchList regions={regions ?? []} />
    </div>
  )
}
