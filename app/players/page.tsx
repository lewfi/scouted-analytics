import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const roleOrder = ['top', 'jungle', 'mid', 'bot', 'support']
const roleLabel: Record<string, string> = {
  top: 'Top', jungle: 'Jungle', mid: 'Mid', bot: 'Bot', support: 'Support',
}

export default async function PlayersPage() {
  const supabase = await createClient()

  const { data: regions } = await supabase
    .from('regions')
    .select(`
      id, name, short_name, slug,
      teams!inner(
        id, name, slug, is_active,
        players(id, summoner_name, role, is_active)
      )
    `)
    .neq('slug', 'intl')
    .order('name')

  return (
    <div className="p-8 max-w-3xl animate-fade-in">
      <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-8">Players</h1>

      <div className="flex flex-col gap-10">
        {(regions ?? []).map((region: any) => {
          const activePlayers = region.teams
            .filter((t: any) => t.is_active)
            .flatMap((t: any) =>
              (t.players ?? [])
                .filter((p: any) => p.is_active)
                .map((p: any) => ({ ...p, team: { name: t.name, slug: t.slug } }))
            )
            .sort((a: any, b: any) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))

          if (activePlayers.length === 0) return null

          return (
            <div key={region.id}>
              <div className="flex items-center gap-3 mb-3">
                <Link
                  href={`/${region.slug}`}
                  className="text-xs text-zinc-500 uppercase tracking-widest font-medium hover:text-zinc-300 transition-colors"
                >
                  {region.short_name}
                </Link>
              </div>

              <div className="border border-zinc-800/60 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-600 border-b border-zinc-800/60 bg-zinc-900/50">
                      <th className="text-left px-4 py-2.5 font-medium">Player</th>
                      <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Role</th>
                      <th className="text-left px-4 py-2.5 font-medium">Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePlayers.map((p: any, i: number) => (
                      <tr key={p.id} className="border-t border-zinc-800/40 hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/players/${encodeURIComponent(p.summoner_name)}`}
                            className="font-medium text-zinc-200 hover:text-white transition-colors"
                          >
                            {p.summoner_name}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-500 capitalize hidden sm:table-cell">
                          {roleLabel[p.role] ?? p.role}
                        </td>
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/teams/${p.team.slug}`}
                            className="text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            {p.team.name}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
