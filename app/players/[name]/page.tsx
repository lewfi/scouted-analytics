import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function PlayerPage({ params }: { params: Promise<{ name: string }> }) {
    const { name } = await params
    const playerName = decodeURIComponent(name)
    const supabase = await createClient()

    const { data: player } = await supabase
    .from('players')
    .select(`
        *,
        team:teams(id, name, slug)
    `)
    .eq('summoner_name', playerName)
    .single()

    return (
        <div className="p-8 max-w-3xl">
            <h1 className="text-2xl font-semibold text-zinc-100 mb-1">{player?.summoner_name}</h1>
            <p className="text-sm text-zinc-500 capitalize mb-4">{player?.role}</p>
            <Link
            href={`/teams/${player?.team?.slug}`}
            className="text-sm text-zinc-400 hover:text-zinc-100 hover:underline"
            >
            {player?.team?.name}
            </Link>
        </div>
    )
}