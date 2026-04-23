import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { parse } from 'csv-parse/sync'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const leagueToRegion: Record<string, string> = {
  'LCK': 'lck', 'LEC': 'lec', 'LCS': 'lcs',
  'LPL': 'lpl', 'LCP': 'lcp',
  'MSI': 'intl', 'FST': 'intl', 'Worlds': 'intl',
}

const positionToRole: Record<string, string> = {
  'top': 'top', 'jng': 'jungle', 'mid': 'mid', 'bot': 'bot', 'sup': 'support',
}

// Google Drive CSV exports — one per season
const CSV_FILES = [
  { id: '1v6LRphp2kYciU4SXp0PCjEMuev1bDejc', year: '2025' },
  { id: '1hnpbrUpBMS1TZI7IovfpKeZfWJH1Aptm', year: '2026' },
]

async function downloadCSV(fileId: string): Promise<string> {
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`)
  return res.text()
}

// --- Fetch helpers (return name/slug → id maps) ---

async function getRegions(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('regions').select('id, slug')
  if (error) { console.error('Error fetching regions:', error); return {} }
  return Object.fromEntries(data.map((r: any) => [r.slug, r.id]))
}

async function getTeams(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('teams').select('id, name')
  if (error) { console.error('Error fetching teams:', error); return {} }
  return Object.fromEntries(data.map((t: any) => [t.name, t.id]))
}

async function getTournaments(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('tournaments').select('id, name')
  if (error) { console.error('Error fetching tournaments:', error); return {} }
  return Object.fromEntries(data.map((t: any) => [t.name, t.id]))
}

// --- Seed functions ---

async function seedTournaments(regionMap: Record<string, string>) {
  console.log('Seeding tournaments...')
  for (const file of CSV_FILES) {
    const rows = parse(await downloadCSV(file.id), { columns: true, skip_empty_lines: true }) as any[]
    const seen = new Set<string>()
    const tournaments: any[] = []

    for (const row of rows) {
      const regionSlug = leagueToRegion[row.league]
      if (!regionSlug) continue
      const key = `${row.league}-${row.year}-${row.split}-${row.playoffs}`
      if (seen.has(key)) continue
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

    const { error } = await supabase.from('tournaments').upsert(tournaments, { onConflict: 'name' })
    if (error) console.error(`Error upserting tournaments (${file.year}):`, error.message)
    else console.log(`  ✓ ${tournaments.length} tournaments from ${file.year}`)
  }
}

async function seedTeams(regionMap: Record<string, string>) {
  console.log('Seeding teams...')
  for (const file of CSV_FILES) {
    const rows = parse(await downloadCSV(file.id), { columns: true, skip_empty_lines: true }) as any[]
    const seen = new Set<string>()
    const teams: any[] = []

    for (const row of rows) {
      if (!leagueToRegion[row.league]) continue
      if (seen.has(row.teamid)) continue
      seen.add(row.teamid)
      teams.push({
        name: row.teamname,
        slug: row.teamname.toLowerCase().replace(/[^a-z0-9]/g, ''),
        short_name: row.teamname.slice(0, 10),
        region_id: regionMap[leagueToRegion[row.league]],
        logo_url: null,
        is_active: true,
      })
    }

    const { error } = await supabase.from('teams').upsert(teams, { onConflict: 'slug' })
    if (error) console.error(`Error upserting teams (${file.year}):`, error.message)
    else console.log(`  ✓ ${teams.length} teams from ${file.year}`)
  }
}

async function seedPlayers(teamMap: Record<string, string>) {
  console.log('Seeding players...')
  for (const file of CSV_FILES) {
    const rows = parse(await downloadCSV(file.id), { columns: true, skip_empty_lines: true }) as any[]
    const seen = new Set<string>()
    const players: any[] = []

    for (const row of rows) {
      if (!leagueToRegion[row.league]) continue
      if (!positionToRole[row.position]) continue
      if (!teamMap[row.teamname]) continue
      if (seen.has(row.playername)) continue
      seen.add(row.playername)
      players.push({
        summoner_name: row.playername,
        team_id: teamMap[row.teamname],
        role: positionToRole[row.position],
      })
    }

    const { error } = await supabase.from('players').upsert(players, { onConflict: 'summoner_name' })
    if (error) console.error(`Error upserting players (${file.year}):`, error.message)
    else console.log(`  ✓ ${players.length} players from ${file.year}`)
  }
}

async function seedMatches(tournamentMap: Record<string, string>, teamMap: Record<string, string>) {
  console.log('Seeding matches...')
  for (const file of CSV_FILES) {
    const rows = parse(await downloadCSV(file.id), { columns: true, skip_empty_lines: true }) as any[]

    // Group individual player rows by gameid
    const gameRows = new Map<string, any[]>()
    for (const row of rows) {
      if (!leagueToRegion[row.league]) continue
      if (!gameRows.has(row.gameid)) gameRows.set(row.gameid, [])
      gameRows.get(row.gameid)!.push(row)
    }

    // Build series map: game 1s are anchors, later games attach to the nearest game 1 within 12h
    const seriesMap = new Map<string, any[]>()

    for (const [gameid, game] of gameRows) {
      const blueRow = game.find((r: any) => r.side === 'Blue')
      const redRow  = game.find((r: any) => r.side === 'Red')
      if (!blueRow || !redRow || blueRow.game !== '1') continue
      const teams = [blueRow.teamname, redRow.teamname].sort().join('-')
      const key = `${blueRow.league}-${blueRow.year}-${blueRow.split}-${blueRow.playoffs}-${teams}-${gameid}`
      seriesMap.set(key, [{ blueRow, redRow, gameNum: 1 }])
    }

    for (const [, game] of gameRows) {
      const blueRow = game.find((r: any) => r.side === 'Blue')
      const redRow  = game.find((r: any) => r.side === 'Red')
      if (!blueRow || !redRow || blueRow.game === '1') continue
      const teams = [blueRow.teamname, redRow.teamname].sort().join('-')
      const prefix = `${blueRow.league}-${blueRow.year}-${blueRow.split}-${blueRow.playoffs}-${teams}`
      const gameTime = new Date(blueRow.date).getTime()

      const match = [...seriesMap.entries()].find(([key, games]) => {
        if (!key.startsWith(prefix)) return false
        if (games.some((g: any) => g.gameNum === parseInt(blueRow.game))) return false
        return Math.abs(gameTime - new Date(games[0].blueRow.date).getTime()) < 12 * 60 * 60 * 1000
      })
      if (match) match[1].push({ blueRow, redRow, gameNum: parseInt(blueRow.game) })
    }

    // Convert series to match rows
    const matches: any[] = []
    for (const [, games] of seriesMap) {
      const sorted = games.sort((a: any, b: any) => a.gameNum - b.gameNum)
      const { blueRow, redRow } = sorted[0]
      const tournamentName = `${blueRow.league} ${blueRow.year} ${blueRow.split}${blueRow.playoffs === '1' ? ' Playoffs' : ''}`
      const tournamentId = tournamentMap[tournamentName]
      if (!tournamentId) continue

      // Count wins per team (teams can swap sides between games)
      let blueWins = 0, redWins = 0
      for (const { blueRow: g } of games) {
        const blueWonGame = g.result === '1'
        const blueTeamOnBlue = g.teamname === blueRow.teamname
        if (blueWonGame === blueTeamOnBlue) blueWins++
        else redWins++
      }

      matches.push({
        tournament_id: tournamentId,
        team_blue_id:  teamMap[blueRow.teamname],
        team_red_id:   teamMap[redRow.teamname],
        winner_id:     blueWins > redWins ? teamMap[blueRow.teamname] : teamMap[redRow.teamname],
        blue_score:    blueWins,
        red_score:     redWins,
        scheduled_at:  blueRow.date || null,
        status:        'completed',
        leaguepedia_id: sorted[0].blueRow.gameid,
      })
    }

    const { error } = await supabase.from('matches').upsert(matches, { onConflict: 'leaguepedia_id' })
    if (error) console.error(`Error upserting matches (${file.year}):`, error.message)
    else console.log(`  ✓ ${matches.length} matches from ${file.year}`)
  }
}

async function seedActiveRosters(teamMap: Record<string, string>) {
  console.log('Setting active rosters...')
  const latestGameByTeam = new Map<string, string>()
  const latestDateByTeam = new Map<string, string>()
  const playersByGame    = new Map<string, string[]>()

  for (const file of CSV_FILES) {
    const rows = parse(await downloadCSV(file.id), { columns: true, skip_empty_lines: true }) as any[]
    for (const row of rows) {
      if (!leagueToRegion[row.league]) continue
      if (!positionToRole[row.position]) continue
      const existing = latestDateByTeam.get(row.teamname)
      if (!existing || row.date > existing) {
        latestDateByTeam.set(row.teamname, row.date)
        latestGameByTeam.set(row.teamname, row.gameid)
      }
      const key = `${row.gameid}::${row.teamname}`
      if (!playersByGame.has(key)) playersByGame.set(key, [])
      playersByGame.get(key)!.push(row.playername)
    }
  }

  for (const [teamname, gameid] of latestGameByTeam) {
    const teamId = teamMap[teamname]
    if (!teamId) continue
    const activePlayers = playersByGame.get(`${gameid}::${teamname}`) ?? []
    if (activePlayers.length === 0) continue
    await supabase.from('players').update({ is_active: false }).eq('team_id', teamId)
    await supabase.from('players').update({ is_active: true }).eq('team_id', teamId).in('summoner_name', activePlayers)
  }

  console.log('  ✓ Active rosters updated')
}

// --- Main ---

async function main() {
  console.log('Starting seed...')
  const regionMap = await getRegions()
  await seedTournaments(regionMap)
  await seedTeams(regionMap)
  const teamMap = await getTeams()
  await seedPlayers(teamMap)
  await seedActiveRosters(teamMap)
  const tournamentMap = await getTournaments()
  await seedMatches(tournamentMap, teamMap)
  console.log('Seed complete.')
}

main().catch(console.error)
