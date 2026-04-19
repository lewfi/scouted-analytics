import { createClient } from '@/lib/supabase/server'
import TournamentAccordion from '@/components/matches/TournamentAccordion'

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
    const { region: regionSlug } = await params
    const supabase = await createClient()

    const { data: region } = await supabase
    .from('regions')
    .select(`
        *,
        tournaments (
            *,
            matches (
                *,
                team_blue:teams!matches_team_blue_id_fkey(id, name, short_name, slug),
                team_red:teams!matches_team_red_id_fkey(id, name, short_name, slug),
                winner:teams!matches_winner_id_fkey(id, name, short_name, slug)
            )
        )
    `)
    .eq('slug', regionSlug)
    .single()

    // sort tournaments newest first
    const tournaments = (region?.tournaments ?? []).sort((a: any, b: any) => {
        // sort by season descending first (2026 before 2025)
        if (b.season !== a.season) return b.season.localeCompare(a.season)
        // then by name descending within same season
        return b.name.localeCompare(a.name)
    })

    // sort matches within each tournament newest first
    tournaments.forEach((t: any) => {
        t.matches.sort((a: any, b: any) => 
            new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
        )
    })

    return (
        <div className="p-8">
            <h1 className="text-2xl font-semibold text-zinc-100 mb-6">{region?.name}</h1>

            <div className="flex flex-col gap-3">
                {tournaments.map((tournament: any) => (
                    <TournamentAccordion key={tournament.id} tournament={tournament} />
                ))}
            </div>
        </div>
    )
}