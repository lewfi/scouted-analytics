import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TeamsPage() {
  const supabase = await createClient()

  const { data: regions } = await supabase
    .from('regions')
    .select(`
      id, name, short_name, slug,
      teams(id, name, slug, is_active)
    `)
    .neq('slug', 'intl')
    .order('name')

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-8">Teams</h1>

      <div className="flex flex-col gap-10">
        {(regions ?? []).map((region: any) => {
          const activeTeams = (region.teams ?? []).filter((t: any) => t.is_active)
          if (activeTeams.length === 0) return null

          return (
            <div key={region.id}>
              <Link
                href={`/${region.slug}`}
                className="text-xs text-zinc-500 uppercase tracking-widest font-medium hover:text-zinc-300 transition-colors mb-3 inline-block"
              >
                {region.short_name}
              </Link>
              <div className="flex flex-col gap-1.5">
                {activeTeams.map((team: any, i: number) => (
                  <Link
                    key={team.id}
                    href={`/teams/${team.slug}`}
                    className="animate-fade-in-up flex items-center justify-between bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-3 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-200 group"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                      {team.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
