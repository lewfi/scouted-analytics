import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LOLESPORTS_API_KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z'

const leagueToRegion: Record<string, string> = {
  'LCS': 'lcs',
  'LCK': 'lck',
  'LEC': 'lec',
  'LPL': 'lpl',
  'LCP': 'lcp',
}


// API team names that differ from Oracle's Elixir / DB names
const teamNameAliases: Record<string, string> = {
  'Team Liquid Honda First': 'Team Liquid',
  'Cloud9 Kia': 'Cloud9',
  'Gen.G Esports': 'Gen.G',
  'NRG Kia': 'NRG',
}

async function main() {
  console.log('Starting roster sync...')

  let res: Response
  try {
    res = await fetch(
      'https://esports-api.lolesports.com/persisted/gw/getTeams?hl=en-US',
      { headers: { 'x-api-key': LOLESPORTS_API_KEY } }
    )
    console.log('API response status:', res.status)
  } catch (err) {
    console.error('Fetch failed:', err)
    return
  }

  const json = await res.json()
  const teams = json.data?.teams
  console.log(`Total teams from API: ${teams?.length}`)

  for (const team of teams) {
    const leagueName = team.homeLeague?.name
    const regionSlug = leagueToRegion[leagueName]
    if (!regionSlug) continue

    console.log(`Processing ${team.name} (${leagueName})`)

    const dbName = teamNameAliases[team.name] ?? team.name
    const { data: dbTeam } = await supabase
      .from('teams')
      .select('id')
      .ilike('name', dbName)
      .single()

    if (!dbTeam) {
      console.log(`  ⚠ No DB match for ${team.name}`)
      continue
    }

    await supabase
      .from('teams')
      .update({ logo_url: team.image })
      .eq('id', dbTeam.id)
  }

  console.log('Roster sync complete!')
}

main().catch(console.error)