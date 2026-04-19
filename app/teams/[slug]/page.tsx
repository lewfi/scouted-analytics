import { createClient } from '@/lib/supabase/server'

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: team } = await supabase
    .from('teams')
    .select(`
      *,
      players (
        id,
        summoner_name,
        role,
        is_active
      )
    `)
    .eq('slug', slug)
    .single()

  return (
    <div className="p-8 max-w-3xl">
      {/* team header */}
      <h1 className="text-2xl font-semibold text-zinc-100 mb-1">{team?.name}</h1>
      <p className="text-sm text-zinc-500 mb-8">{team?.short_name}</p>

      {/* roster */}
      <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Roster</h2>
      <div className="flex flex-col gap-2">
        {team?.players
          .filter((p: any) => p.is_active)
          .sort((a: any, b: any) => {
            const order = ['top', 'jungle', 'mid', 'bot', 'support']
            return order.indexOf(a.role) - order.indexOf(b.role)
          })
          .map((player: any) => (
            <div key={player.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-4 py-3">
              <span className="text-sm font-medium text-zinc-100">{player.summoner_name}</span>
              <span className="text-xs text-zinc-500 capitalize">{player.role}</span>
            </div>
          ))}
      </div>
    </div>
  )
}