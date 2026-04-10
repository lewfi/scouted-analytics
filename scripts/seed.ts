import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { parse } from 'csv-parse/sync'
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
  { id: '1v6LRphp2kYciU4SXp0PCjEMuev1bDejc', year: '2025' },
  { id: '1hnpbrUpBMS1TZI7IovfpKeZfWJH1Aptm', year: '2026' },
]

async function downloadCSV(fileId: string): Promise<string> {
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`
    const res = await fetch(url)
    return await res.text()
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// seed Functions

async function seedTournaments(regionMap: Record<string, string>) {
    console.log('Seeding tournaments...')

    for (const file of CSV_FILES) {
        const content = await downloadCSV(file.id)
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
            console.error(`Error upserting tournaments from ${file.year}:`, error.message)
        } else {
            console.log(`✓ ${tournaments.length} tournaments upserted from ${file.year}`)
        }

    }
}

async function seedTeams(regionMap: Record<string, string>) {
    console.log('Seeding teams...')

    for (const file of CSV_FILES) {
        const content = await downloadCSV(file.id)
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
            console.error(`Error upserting teams from ${file.year}:`, error.message)
        } else {
            console.log(`✓ ${teams.length} teams upserted from ${file.year}`)
        }
    }
}

async function seedPlayers(teamMap: Record<string, string>) {
    console.log('Seeding players...')

    for (const file of CSV_FILES) {
        const content = await downloadCSV(file.id)
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
            console.error(`Error upserting players from ${file.year}:`, error.message)
        } else {
            console.log(`✓ ${players.length} players upserted from ${file.year}`)
        }
    }
}

async function seedMatches(tournamentMap: Record<string, string>, teamMap: Record<string, string>) {
    console.log('Seeding matches...')

    for (const file of CSV_FILES) {
        const content = await downloadCSV(file.id)
        const rows = parse(content, { columns: true, skip_empty_lines: true }) as any[]

        const gameRows = new Map<string, any[]>()

        for (const row of rows) {
            const regionSlug = leagueToRegion[row.league]
            if (!regionSlug) continue

            if (!gameRows.has(row.gameid)) {
                gameRows.set(row.gameid, [])
            }
            gameRows.get(row.gameid)!.push(row) // ! used to ensure Typescript that value is not undefined for .get()
        }
        
        const matches: any[] = []

        for (const [gameid, game] of gameRows) {
            const blueRow = game.find((r: any) => r.side === 'Blue') // .find() returns the first player row where side is Blue
            const redRow = game.find((r: any) => r.side === 'Red')
            if (!blueRow || !redRow) continue

            const tournamentName = `${blueRow.league} ${blueRow.year} ${blueRow.split}${blueRow.playoffs === '1' ? ' Playoffs' : ''}`
            const tournamentId = tournamentMap[tournamentName]
            if (!tournamentId) continue

            matches.push({
                tournament_id: tournamentId,
                team_blue_id: teamMap[blueRow.teamname],
                team_red_id: teamMap[redRow.teamname],
                winner_id: blueRow.result === '1' ? teamMap[blueRow.teamname] : teamMap[redRow.teamname],
                blue_score: parseInt(blueRow.result),
                red_score: parseInt(redRow.result),
                scheduled_at: blueRow.date || null,
                status: 'completed',
                leaguepedia_id: gameid,
            })
        }

        const { error } = await supabase
            .from('matches')
            .upsert(matches, { onConflict: 'leaguepedia_id' })

        if (error) {
            console.error(`Error upserting matches from ${file.year}:`, error.message)
        } else {
            console.log(`✓ ${matches.length} matches upserted from ${file.year}`)
        }
    }
}

// get Functions

async function getTournaments(): Promise<Record<string, string>> {
    const { data, error } = await supabase.from('tournaments').select('id, name')

    if (error) {
        console.error('Error fetching tournaments:', error)
        return{}
    }

    return Object.fromEntries(data.map((tournament: any) => [tournament.name, tournament.id]))
}

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
    await seedTournaments(regionMap)
    await seedTeams(regionMap)

    const teamMap = await getTeams()
    await seedPlayers(teamMap)

    const tournamentMap = await getTournaments()
    await seedMatches(tournamentMap, teamMap)
    
    console.log('Seed completed.')
}

main().catch(console.error)