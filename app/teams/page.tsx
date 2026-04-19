import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TeamsPage() {
    const supabase = await createClient()

    const { data: regions } = await supabase
        .from('regions')
        .select(`
            *,
            teams (id, name, slug, is_active)
        `)
        .neq('slug', 'intl')
        .order('name')

    return (
        <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-8">Teams</h1>
        {/* map through regions and their teams */}
        {regions?.map((region) => (
            <div key={region.id} className="mb-8">
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
                    {region.short_name}
                </h2>
                <div className="flex flex-col gap-2">
                    {region.teams
                        .filter((t: any) => t.is_active)
                        .map((team: any) => (
                        <Link
                            key={team.id}
                            href={`/teams/${team.slug}`}
                            className="bg-zinc-900 rounded-lg px-4 py-3 text-sm text-zinc-100 hover:bg-zinc-800"
                        >
                            {team.name}
                        </Link>
                    ))}
                </div>
            </div>
        ))}
        </div>
    )
}