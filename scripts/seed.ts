import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import * as path from 'path'
dotenv.config({ path: '.env.local' })

const leagueToRegion: Record<string, string> = {
  'LCK': 'lck',
  'LEC': 'lec',
  'LCS': 'lcs',
  'LPL': 'lpl',
  'LCP': 'lcp',
  'MSI': 'intl',
  'FST': 'intl',
  'Worlds': 'intl',
}

const positionToRole: Record<string, string> = {
  'top': 'top',
  'jng': 'jungle',
  'mid': 'mid',
  'bot': 'bot',
  'sup': 'support',
}

const CSV_FILES = [
  '2025_LoL_esports_match_data_from_OraclesElixir.csv',
  '2026_LoL_esports_match_data_from_OraclesElixir.csv',
]

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// seed Functions

async function seedTournaments(regionMap: Record<string, string>) {
    console.log('Seeding tournaments...')

    for (const file of CSV_FILES) {
        const filePath = path.join('scripts', 'data', file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const rows = parse(content, { columns: true, skip_empty_lines: true }) as any[]

        const seen = new Set<string>()  // Set used because it only stores unique values
        const tournaments: any[] = []

        for (const row of rows) {
            const regionSlug = leagueToRegion[row.league]
            if (!regionSlug) continue  // skip leagues we don't track

            const key = `${row.league}-${row.year}-${row.split}-${row.playoffs}`
            if (seen.has(key)) continue  // skip duplicates
            seen.add(key)

            tournaments.push({
                name: `${row.league} ${row.year} ${row.split}${row.playoffs === '1' ? ' Playoffs' : ''}`,
                region_id: regionMap[regionSlug],
                season: row.year,
                split: row.split,
                start_date: null,
                end_date: null,
            })
        }

        const { error } = await supabase
            .from('tournaments')
            .upsert(tournaments, { onConflict: 'name' })

        if (error) {
            console.error(`Error upserting tournaments from ${file}:`, error.message)
        } else {
            console.log(`✓ ${tournaments.length} tournaments upserted from ${file}`)
        }

    }
}

async function seedTeams(regionMap: Record<string, string>) {
    console.log('Seeding teams...')

    for (const file of CSV_FILES) {
        const filePath = path.join('scripts', 'data', file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const rows = parse(content, { columns: true, skip_empty_lines: true }) as any[]

        const seen = new Set<string>()
        const teams: any[] = []

        for (const row of rows) {
            const regionSlug = leagueToRegion[row.league]
            if (!regionSlug) continue  // skip leagues we don't track
            
            if (seen.has(row.teamid)) continue
            seen.add(row.teamid)

            teams.push({
                name: row.teamname,
                slug: row.teamname.toLowerCase().replace(/[^a-z0-9]/g, ''),
                short_name: row.teamname.slice(0, 10),
                region_id: regionMap[regionSlug],
                logo_url: null,
                is_active: true,
            })
        }

        const { error } = await supabase
            .from('teams')
            .upsert(teams, { onConflict: 'slug' })

        if (error) {
            console.error(`Error upserting teams from ${file}:`, error.message)
        } else {
            console.log(`✓ ${teams.length} teams upserted from ${file}`)
        }
    }
}

async function seedPlayers(teamMap: Record<string, string>) {
    console.log('Seeding players...')

    for (const file of CSV_FILES) {
        const filePath = path.join('scripts', 'data', file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const rows = parse(content, { columns: true, skip_empty_lines: true }) as any[]

        const seen = new Set<string>()
        const players: any[] = []

        for (const row of rows) {
            const regionSlug = leagueToRegion[row.league]
            if (!regionSlug) continue  // skip leagues we don't track
            
            if (!positionToRole[row.position]) continue
            if (!teamMap[row.teamname]) continue

            if (seen.has(row.playername)) continue
            seen.add(row.playername)

            players.push({
                summoner_name: row.playername,
                team_id: teamMap[row.teamname],
                role: positionToRole[row.position],
                is_active: true,
            })
        }

        const { error } = await supabase
            .from('players')
            .upsert(players, { onConflict: 'summoner_name' })

        if (error) {
            console.error(`Error upserting players from ${file}:`, error.message)
        } else {
            console.log(`✓ ${players.length} players upserted from ${file}`)
        }
    }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// get Functions

async function getRegions(): Promise<Record<string, string>> {
    const { data, error } = await supabase.from('regions').select('id, slug')

    if (error) {
        console.error('Error fetching regions:', error)
        return {}
    }

    return Object.fromEntries(data.map((region: any) => [region.slug, region.id]))  // Convert the array of [key, value] to
                                                                                    // an object where key (region) holds the
                                                                                    // value (uuid)
                                                                                    // Ex. [lck, 123abc] => { lck: 123abc }
}

async function getTeams(): Promise<Record<string, string>> {
    const { data, error } = await supabase.from('teams').select('id, name')

    if (error) {
        console.error('Error fetching teams:', error)
        return{}
    }

    return Object.fromEntries(data.map((team: any) => [team.name, team.id]))
}

async function main() {
    console.log('Starting seed...')
    const regionMap = await getRegions()
    const teamMap = await getTeams()

    await seedTournaments(regionMap)
    await seedTeams(regionMap)
    await seedPlayers(teamMap)
    
    console.log('Seed completed.')
}

main().catch(console.error)