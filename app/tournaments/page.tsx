import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TournamentsPage() {
  const supabase = await createClient()

  const { data: regions } = await supabase
    .from('regions')
    .select(`
      id, name, short_name, slug,
      tournaments(id, name, start_date, end_date, season)
    `)
    .neq('slug', 'intl')
    .order('name')

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="p-8 max-w-3xl animate-fade-in">
      <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-8">Tournaments</h1>

      <div className="flex flex-col gap-10">
        {(regions ?? []).map((region: any) => {
          const tournaments = (region.tournaments ?? []).sort((a: any, b: any) =>
            new Date(b.start_date ?? 0).getTime() - new Date(a.start_date ?? 0).getTime()
          )
          if (tournaments.length === 0) return null

          return (
            <div key={region.id}>
              <Link
                href={`/${region.slug}`}
                className="text-xs text-zinc-500 uppercase tracking-widest font-medium hover:text-zinc-300 transition-colors mb-3 inline-block"
              >
                {region.short_name}
              </Link>
              <div className="flex flex-col gap-1.5">
                {tournaments.map((t: any) => {
                  const isActive = t.start_date <= today && (!t.end_date || t.end_date >= today)
                  return (
                    <Link
                      key={t.id}
                      href={`/tournaments/${encodeURIComponent(t.name)}`}
                      className="flex items-center justify-between bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-3 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-2.5">
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        )}
                        <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                          {t.name}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-600 shrink-0">
                        {fmt(t.start_date)}{t.end_date ? ` – ${fmt(t.end_date)}` : ''}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
