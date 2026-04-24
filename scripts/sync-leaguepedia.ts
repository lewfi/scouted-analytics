// npx tsx scripts/sync-leaguepedia.ts
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const BASE = 'https://lol.fandom.com/api.php'
const UA   = 'Scouted/1.0 (esports analytics)'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Only sync game/match data for tournaments ending this year or later.
// Override with GAME_SYNC_YEAR=2023 to do a full historical backfill.
const GAME_SYNC_YEAR = parseInt(process.env.GAME_SYNC_YEAR ?? String(new Date().getFullYear() - 1))

// Max concurrent player-stat fetches per tournament
const STAT_CONCURRENCY = 5

interface LeagueConfig {
  label: string
  where: string
  regionSlug: string
}

const YEAR_FILTER = 'Year >= 2023'

const LEAGUES: LeagueConfig[] = [
  // Regional — consistent "LEAGUE YEAR ..." naming
  { label: 'LCS',         where: `Name LIKE 'LCS 20%' AND ${YEAR_FILTER}`,                          regionSlug: 'lcs'  },
  { label: 'LTA',         where: `Name LIKE 'LTA%' AND ${YEAR_FILTER}`,                             regionSlug: 'lcs'  }, // LTA replaced LCS in 2025
  { label: 'LEC',         where: `Name LIKE 'LEC 20%' AND ${YEAR_FILTER}`,                          regionSlug: 'lec'  },
  { label: 'LCK',         where: `Name LIKE 'LCK 20%' AND ${YEAR_FILTER}`,                          regionSlug: 'lck'  },
  { label: 'LPL',         where: `Name LIKE 'LPL 20%' AND ${YEAR_FILTER}`,                          regionSlug: 'lpl'  },
  { label: 'LCP',         where: `Name LIKE 'LCP 20%' AND ${YEAR_FILTER}`,                          regionSlug: 'lcp'  },
  // International — Leaguepedia uses "YEAR Event Name" format
  { label: 'MSI',         where: `Name LIKE '%Mid-Season Invitational%' AND ${YEAR_FILTER}`,        regionSlug: 'intl' },
  { label: 'Worlds',      where: `Name LIKE '%Season World Championship%' AND ${YEAR_FILTER}`,      regionSlug: 'intl' },
  { label: 'First Stand', where: `Name LIKE '%First Stand%' AND ${YEAR_FILTER}`,                    regionSlug: 'intl' },
  { label: 'EWC',         where: `Name LIKE '%Esports World Cup%' AND ${YEAR_FILTER}`,              regionSlug: 'intl' },
]

const roleMap: Record<string, string> = {
  Top: 'top', Jungle: 'jungle', Mid: 'mid', Bot: 'bot', Support: 'support',
}

// --- Auth ---

function parseCookies(res: Response): Record<string, string> {
  const out: Record<string, string> = {}
  const headers: string[] = typeof (res.headers as any).getSetCookie === 'function'
    ? (res.headers as any).getSetCookie()
    : [res.headers.get('set-cookie') ?? ''].filter(Boolean)
  for (const h of headers) {
    const [pair] = h.split(';')
    const eq = pair.indexOf('=')
    if (eq > 0) out[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim()
  }
  return out
}

function cookieStr(jar: Record<string, string>): string {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')
}

async function authenticate(): Promise<string> {
  const user = process.env.LEAGUEPEDIA_USERNAME
  const pass = process.env.LEAGUEPEDIA_PASSWORD
  if (!user || !pass) throw new Error('Missing LEAGUEPEDIA_USERNAME / LEAGUEPEDIA_PASSWORD')

  const tokenRes = await fetch(`${BASE}?action=query&meta=tokens&type=login&format=json`, {
    headers: { 'User-Agent': UA },
  })
  const jar = parseCookies(tokenRes)
  const loginToken: string = (await tokenRes.json())?.query?.tokens?.logintoken ?? ''

  const loginRes = await fetch(BASE, {
    method: 'POST',
    headers: { 'User-Agent': UA, Cookie: cookieStr(jar), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ action: 'login', format: 'json', lgname: user, lgpassword: pass, lgtoken: loginToken }).toString(),
  })
  const loginJson = await loginRes.json()
  if (loginJson?.login?.result !== 'Success') throw new Error(`Auth failed: ${JSON.stringify(loginJson?.login)}`)
  return cookieStr({ ...jar, ...parseCookies(loginRes) })
}

// --- Cargo ---

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function cargo(
  table: string, fields: string, where: string,
  cookies: string, limit = 500, offset = 0,
): Promise<any> {
  const url = new URL(BASE)
  url.searchParams.set('action', 'cargoquery')
  url.searchParams.set('format', 'json')
  url.searchParams.set('tables', table)
  url.searchParams.set('fields', fields)
  if (where) url.searchParams.set('where', where)
  url.searchParams.set('limit', String(limit))
  if (offset > 0) url.searchParams.set('offset', String(offset))
  const res = await fetch(url.toString(), { headers: { 'User-Agent': UA, Cookie: cookies } })
  return res.json()
}

async function cargoAll(table: string, fields: string, where: string, cookies: string): Promise<Record<string, string>[]> {
  const all: Record<string, string>[] = []
  let offset = 0
  while (true) {
    let r: any
    for (let attempt = 0; attempt < 5; attempt++) {
      r = await cargo(table, fields, where, cookies, 500, offset)
      if (!r?.error?.info?.includes('rate limit')) break
      const wait = (attempt + 1) * 3000
      console.log(`    ⏳ rate limited — waiting ${wait / 1000}s...`)
      await delay(wait)
    }
    if (r?.error) throw new Error(`Cargo error [${table}]: ${r.error.info}`)
    const rows: Record<string, string>[] = (r?.cargoquery ?? []).map((row: any) => row.title)
    all.push(...rows)
    if (rows.length < 500) break
    offset += 500
    await delay(150) // reduced from 800ms
  }
  return all
}

// --- DB helpers ---

async function getRegionMap(): Promise<Record<string, string>> {
  const { data } = await supabase.from('regions').select('id, slug')
  return Object.fromEntries((data ?? []).map((r: any) => [r.slug, r.id]))
}

async function getTeamMap(): Promise<Record<string, string>> {
  const { data } = await supabase.from('teams').select('id, name')
  return Object.fromEntries((data ?? []).map((t: any) => [t.name, t.id]))
}

// Looks up a team by name; auto-creates it if missing so no matches are skipped
async function ensureTeam(
  name: string,
  regionId: string,
  teamMap: Record<string, string>,
): Promise<string | null> {
  if (teamMap[name]) return teamMap[name]

  const { data: existing } = await supabase
    .from('teams').select('id').eq('name', name).maybeSingle()
  if (existing) {
    teamMap[name] = existing.id
    return existing.id
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '') || name.slice(0, 20)
  const { data: created, error } = await supabase
    .from('teams')
    .insert({ name, slug, short_name: name.slice(0, 10), region_id: regionId, is_active: false, tier: 1 })
    .select('id')
    .single()

  if (error) {
    const { data: fallback } = await supabase
      .from('teams').select('id').eq('slug', slug).maybeSingle()
    if (fallback) { teamMap[name] = fallback.id; return fallback.id }
    console.log(`  ⚠ Could not create team "${name}": ${error.message}`)
    return null
  }

  teamMap[name] = created.id
  console.log(`  + auto-created team "${name}"`)
  return created.id
}

async function getPlayerMap(): Promise<Record<string, string>> {
  const { data } = await supabase.from('players').select('id, summoner_name')
  return Object.fromEntries((data ?? []).map((p: any) => [p.summoner_name, p.id]))
}

// Returns the set of DB game UUIDs that already have player stats synced.
// Uses a distinct query on games that have at least one stat row to avoid
// loading the full player_game_stats table.
async function getGamesWithStats(): Promise<Set<string>> {
  const { data } = await supabase
    .from('player_game_stats')
    .select('game_id')
    .limit(100000)
  const ids = new Set<string>()
  for (const r of data ?? []) ids.add(r.game_id)
  return ids
}

function resolvePlayer(link: string, playerMap: Record<string, string>): string | null {
  if (playerMap[link]) return playerMap[link]
  const bare = link.split(' (')[0].trim()
  return playerMap[bare] ?? null
}

function splitChamps(s: string): string[] {
  return s ? s.split(',').map(c => c.trim()).filter(Boolean) : []
}

// --- Sync ---

function gamelengthToSeconds(gl: string): number | null {
  if (!gl) return null
  const [m, s] = gl.split(':').map(Number)
  return isNaN(m) ? null : m * 60 + (s || 0)
}

function deriveSplit(name: string): string {
  if (/winter/i.test(name)) return 'Winter'
  if (/spring/i.test(name)) return 'Spring'
  if (/summer/i.test(name)) return 'Summer'
  if (/fall/i.test(name)) return 'Fall'
  if (/lock.in/i.test(name)) return 'Lock-In'
  return 'Spring'
}

async function syncTournaments(cookies: string, regionMap: Record<string, string>) {
  console.log('\n=== Syncing tournaments ===')
  for (const league of LEAGUES) {
    await delay(200)
    const rows = await cargoAll(
      'Tournaments',
      'Name,DateStart,Date,Year',
      league.where,
      cookies,
    )
    if (rows.length === 0) {
      console.log(`  ⚠  No tournaments found for ${league.label}`)
      continue
    }

    const upsertRows = rows.map(r => ({
      name:             r.Name,
      leaguepedia_name: r.Name,
      region_id:        regionMap[league.regionSlug],
      season:           r.Year,
      split:            deriveSplit(r.Name),
      start_date:       r.DateStart || null,
      end_date:         r.Date || null,
    }))

    const { error } = await supabase
      .from('tournaments')
      .upsert(upsertRows, { onConflict: 'name' })

    if (error) console.error(`  ✗ ${league.label}:`, error.message)
    else console.log(`  ✓ ${upsertRows.length} tournaments for ${league.label}`)
  }
}

async function syncPlayerStats(
  gameId: string, gameDbId: string,
  teamMap: Record<string, string>,
  playerMap: Record<string, string>,
  cookies: string,
  tier1Players: Set<string>,
): Promise<number> {
  const rows = await cargoAll(
    'ScoreboardPlayers',
    'Link,IngameRole,Champion,Kills,Deaths,Assists,CS,Gold,Items,Team,Side',
    `GameId='${gameId.replace(/'/g, "\\'")}'`,
    cookies,
  )
  if (rows.length === 0) return 0

  for (const p of rows) {
    const name = p.Link.split(' (')[0].trim()
    if (name) tier1Players.add(name)
  }

  const stats = rows.map(p => ({
    game_id:     gameDbId,
    player_id:   resolvePlayer(p.Link, playerMap),
    player_name: p.Link,
    team_id:     teamMap[p.Team] ?? null,
    side:        parseInt(p.Side) || null,
    role:        roleMap[p.IngameRole] ?? p.IngameRole?.toLowerCase() ?? null,
    champion:    p.Champion || null,
    kills:       parseInt(p.Kills)  || 0,
    deaths:      parseInt(p.Deaths) || 0,
    assists:     parseInt(p.Assists)|| 0,
    cs:          parseInt(p.CS)     || 0,
    gold_earned: parseInt(p.Gold)   || 0,
    items:       p.Items ? p.Items.split(';').map((s: string) => s.trim()).filter(Boolean) : [],
  }))

  const { error } = await supabase
    .from('player_game_stats')
    .upsert(stats, { onConflict: 'game_id,player_name' })

  if (error) throw new Error(error.message)
  return stats.length
}

async function syncTournamentGames(
  lpName: string, tournamentDbId: string, tournamentRegionId: string,
  teamMap: Record<string, string>,
  playerMap: Record<string, string>,
  gamesWithStats: Set<string>,
  cookies: string,
  tier1Teams: Set<string>,
  tier1Players: Set<string>,
) {
  const [games, scheduleRows] = await Promise.all([
    cargoAll(
      'ScoreboardGames',
      'Team1,Team2,Winner,Team1Score,Team2Score,DateTime_UTC,MatchId,Gamelength,N_GameInMatch,Patch,GameId,Team1Picks,Team2Picks,Team1Bans,Team2Bans',
      `Tournament='${lpName.replace(/'/g, "\\'")}'`,
      cookies,
    ),
    cargoAll(
      'MatchSchedule',
      'MatchId,Tab,Phase',
      `Tournament='${lpName.replace(/'/g, "\\'")}'`,
      cookies,
    ).catch(() => [] as Record<string, string>[]),
  ])

  const phaseByMatchId = new Map(
    scheduleRows.map(r => [r.MatchId, (r.Tab || r.Phase)?.trim() || null])
  )

  if (games.length === 0) {
    console.log(`  (no games yet)`)
    return
  }

  // Group by MatchId → each group is one series
  const seriesMap = new Map<string, Record<string, string>[]>()
  for (const g of games) {
    if (!seriesMap.has(g.MatchId)) seriesMap.set(g.MatchId, [])
    seriesMap.get(g.MatchId)!.push(g)
  }

  // Ensure all teams exist (sequential to avoid race conditions on new teams)
  const allTeamNames = new Set<string>()
  for (const matchGames of seriesMap.values()) {
    allTeamNames.add(matchGames[0].Team1)
    allTeamNames.add(matchGames[0].Team2)
  }
  for (const name of allTeamNames) {
    await ensureTeam(name, tournamentRegionId, teamMap)
    tier1Teams.add(name)
  }

  // Build batched match rows
  const matchRows: any[] = []
  const matchGamesByLpId = new Map<string, Record<string, string>[]>()

  for (const [matchId, matchGames] of seriesMap) {
    matchGames.sort((a, b) => parseInt(a['N GameInMatch']) - parseInt(b['N GameInMatch']))
    const first = matchGames[0]
    const last  = matchGames[matchGames.length - 1]

    const team1Id = teamMap[first.Team1]
    const team2Id = teamMap[first.Team2]
    if (!team1Id || !team2Id) continue

    const t1Score = parseInt(last.Team1Score) || 0
    const t2Score = parseInt(last.Team2Score) || 0

    matchRows.push({
      tournament_id:  tournamentDbId,
      team_blue_id:   team1Id,
      team_red_id:    team2Id,
      winner_id:      t1Score > t2Score ? team1Id : team2Id,
      blue_score:     t1Score,
      red_score:      t2Score,
      scheduled_at:   first['DateTime UTC'] ? new Date(first['DateTime UTC'] + ' UTC').toISOString() : null,
      status:         'completed',
      leaguepedia_id: matchId,
      stage:          phaseByMatchId.get(matchId) ?? null,
    })
    matchGamesByLpId.set(matchId, matchGames)
  }

  if (matchRows.length === 0) return

  // Batch upsert all matches at once
  const { data: upsertedMatches, error: matchErr } = await supabase
    .from('matches')
    .upsert(matchRows, { onConflict: 'leaguepedia_id' })
    .select('id, leaguepedia_id')

  if (matchErr || !upsertedMatches) {
    console.log(`  ✗ match batch upsert: ${matchErr?.message}`)
    return
  }

  const matchDbIdByLpId = Object.fromEntries(upsertedMatches.map(m => [m.leaguepedia_id, m.id]))

  // Build batched game rows
  const gameRows: any[] = []
  for (const [matchId, matchGames] of matchGamesByLpId) {
    const matchDbId = matchDbIdByLpId[matchId]
    if (!matchDbId) continue
    const team1Id = teamMap[matchGames[0].Team1]
    const team2Id = teamMap[matchGames[0].Team2]
    for (const g of matchGames) {
      const winnerInt = parseInt(g.Winner) || null
      gameRows.push({
        match_id:            matchDbId,
        game_number:         parseInt(g['N GameInMatch']) || 1,
        leaguepedia_game_id: g.GameId,
        winning_team_id:     winnerInt === 1 ? team1Id : winnerInt === 2 ? team2Id : null,
        duration_seconds:    gamelengthToSeconds(g.Gamelength),
        patch:               g.Patch || null,
        played_at:           g['DateTime UTC'] ? new Date(g['DateTime UTC'] + ' UTC').toISOString() : null,
        team_blue_picks:     splitChamps(g.Team1Picks),
        team_red_picks:      splitChamps(g.Team2Picks),
        team_blue_bans:      splitChamps(g.Team1Bans),
        team_red_bans:       splitChamps(g.Team2Bans),
      })
    }
  }

  // Batch upsert games in chunks of 200
  const GAME_CHUNK = 200
  const upsertedGamesAll: { id: string; leaguepedia_game_id: string }[] = []
  for (let i = 0; i < gameRows.length; i += GAME_CHUNK) {
    const chunk = gameRows.slice(i, i + GAME_CHUNK)
    const { data: upsertedGames, error: gameErr } = await supabase
      .from('games')
      .upsert(chunk, { onConflict: 'leaguepedia_game_id' })
      .select('id, leaguepedia_game_id')
    if (gameErr) { console.log(`  ✗ game batch upsert: ${gameErr.message}`); continue }
    upsertedGamesAll.push(...(upsertedGames ?? []))
  }

  // Fetch player stats for games that don't have them yet, with concurrency limit
  const gamesNeedingStats = upsertedGamesAll.filter(g => !gamesWithStats.has(g.id))
  let statCount = 0

  if (gamesNeedingStats.length > 0) {
    const queue = [...gamesNeedingStats]
    const workers = Array.from({ length: STAT_CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const g = queue.shift()!
        try {
          const n = await syncPlayerStats(g.leaguepedia_game_id, g.id, teamMap, playerMap, cookies, tier1Players)
          statCount += n
          // Mark as synced to avoid duplicates if re-run mid-flight
          gamesWithStats.add(g.id)
        } catch (e: any) {
          console.log(`  ✗ player stats for ${g.leaguepedia_game_id}: ${e.message}`)
        }
        await delay(150)
      }
    })
    await Promise.all(workers)
  }

  const alreadySynced = upsertedGamesAll.length - gamesNeedingStats.length
  console.log(`  ✓ ${matchRows.length} matches, ${gameRows.length} games, ${statCount} new stat rows (${alreadySynced} games already synced)`)
}

async function markTier1(tier1Teams: Set<string>, tier1Players: Set<string>) {
  console.log('\n=== Marking Tier 1 entities ===')
  if (tier1Teams.size > 0) {
    const { error } = await supabase.from('teams').update({ tier: 1 }).in('name', [...tier1Teams])
    if (error) console.error('  ✗ teams tier update:', error.message)
    else console.log(`  ✓ ${tier1Teams.size} teams marked tier 1`)
  }
  if (tier1Players.size > 0) {
    const { error } = await supabase.from('players').update({ tier: 1 }).in('summoner_name', [...tier1Players])
    if (error) console.error('  ✗ players tier update:', error.message)
    else console.log(`  ✓ ${tier1Players.size} players marked tier 1`)
  }
}

// --- Main ---

async function main() {
  console.log(`Starting Leaguepedia sync (GAME_SYNC_YEAR >= ${GAME_SYNC_YEAR})...`)
  const cookies = await authenticate()
  console.log('✓ Authenticated')

  const [regionMap, teamMap, playerMap, gamesWithStats] = await Promise.all([
    getRegionMap(), getTeamMap(), getPlayerMap(), getGamesWithStats(),
  ])
  console.log(`  ${Object.keys(regionMap).length} regions, ${Object.keys(teamMap).length} teams, ${Object.keys(playerMap).length} players, ${gamesWithStats.size} games already have stats`)

  await syncTournaments(cookies, regionMap)

  await delay(300)

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, leaguepedia_name, region_id, end_date')
    .not('leaguepedia_name', 'is', null)
    .order('name')

  if (!tournaments?.length) {
    console.error('No tournaments with leaguepedia_name found. Did the migration run?')
    return
  }

  // Skip tournaments that ended before the sync year cutoff
  const tournamentsToSync = tournaments.filter(t => {
    if (!t.end_date) return true
    return new Date(t.end_date).getFullYear() >= GAME_SYNC_YEAR
  })
  const skippedCount = tournaments.length - tournamentsToSync.length
  console.log(`\n=== Syncing games for ${tournamentsToSync.length} tournaments (skipping ${skippedCount} older) ===`)

  const tier1Teams:   Set<string> = new Set()
  const tier1Players: Set<string> = new Set()

  for (const t of tournamentsToSync) {
    console.log(`\n  ${t.leaguepedia_name}`)
    try {
      await syncTournamentGames(t.leaguepedia_name, t.id, t.region_id, teamMap, playerMap, gamesWithStats, cookies, tier1Teams, tier1Players)
    } catch (e: any) {
      console.error(`  ✗ ${e.message}`)
    }
    await delay(150)
  }

  await markTier1(tier1Teams, tier1Players)

  console.log('\n✓ Sync complete.')
}

main().catch(console.error)
