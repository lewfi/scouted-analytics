// npx tsx scripts/test-leaguepedia.ts
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const BASE = 'https://lol.fandom.com/api.php'
const UA   = 'Scouted/1.0 (esports analytics)'

// --- Cookie helpers ---

function parseCookies(res: Response): Record<string, string> {
  const out: Record<string, string> = {}
  // Node 18+ exposes getSetCookie() as an array; fall back to single header
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

// --- Auth ---

async function authenticate(): Promise<string> {
  const user = process.env.LEAGUEPEDIA_USERNAME
  const pass = process.env.LEAGUEPEDIA_PASSWORD

  if (!user || !pass) {
    console.log('⚠  No credentials in .env.local — trying anonymous')
    return ''
  }

  console.log(`Authenticating as: ${user}`)

  // Step 1: get login token + session cookies
  const tokenRes = await fetch(`${BASE}?action=query&meta=tokens&type=login&format=json`, {
    headers: { 'User-Agent': UA },
  })
  const jar = parseCookies(tokenRes)
  const tokenJson = await tokenRes.json()
  const loginToken: string = tokenJson?.query?.tokens?.logintoken ?? ''
  console.log('  logintoken:', loginToken ? loginToken.slice(0, 20) + '...' : '❌ not found')
  console.log('  session cookies:', Object.keys(jar))

  // Step 2: login with token + session cookies
  const body = new URLSearchParams({
    action: 'login', format: 'json',
    lgname: user, lgpassword: pass, lgtoken: loginToken,
  })
  const loginRes = await fetch(BASE, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      Cookie: cookieStr(jar),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
  const loginCookies = parseCookies(loginRes)
  const loginJson = await loginRes.json()
  console.log('  login result:', loginJson?.login?.result)
  if (loginJson?.login?.result !== 'Success') {
    console.log('  full login response:', JSON.stringify(loginJson, null, 2))
  }

  const finalJar = { ...jar, ...loginCookies }
  console.log('  final cookie keys:', Object.keys(finalJar))
  return cookieStr(finalJar)
}

// --- Cargo query ---

async function cargo(
  table: string, fields: string, where: string,
  cookies: string, limit = 3,
): Promise<any> {
  const url = new URL(BASE)
  url.searchParams.set('action', 'cargoquery')
  url.searchParams.set('format', 'json')
  url.searchParams.set('tables', table)
  url.searchParams.set('fields', fields)
  if (where) url.searchParams.set('where', where)
  url.searchParams.set('limit', String(limit))
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': UA, ...(cookies ? { Cookie: cookies } : {}) },
  })
  return res.json()
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// --- Main ---

async function main() {
  const cookies = await authenticate()
  console.log('\nAuthenticated:', !!cookies)

  await delay(800)

  console.log('\n=== Tournaments with "LCS" in name ===')
  const tlcs = await cargo(
    'Tournaments',
    'Name,DateStart,Date,League,Region,Year',
    "Name LIKE '%LCS%' AND Year=2026",
    cookies, 10,
  )
  console.log(JSON.stringify(tlcs, null, 2))

  await delay(1000)

  // Check remaining stat fields + get a full player row
  const extraFields = ['SummonerSpells', 'KeystoneMastery', 'Runes', 'KeystoneRune']
  console.log('\n=== ScoreboardPlayers — extra field probe ===')
  for (const f of extraFields) {
    await delay(400)
    const r = await cargo('ScoreboardPlayers', f, "Tournament='LCS 2026 Spring'", cookies, 1)
    const ok = !r?.error
    console.log(ok ? `  ✓ ${f}: ${JSON.stringify(r?.cargoquery?.[0]?.title)}` : `  ✗ ${f} — ${r?.error?.code}`)
  }

  await delay(600)

  // Full player row using GameId from a known match
  const knownGameId = 'LCS/2026 Season/Spring Season_Week 3_1_1'
  console.log(`\n=== ScoreboardPlayers for GameId: ${knownGameId} ===`)
  const sp = await cargo(
    'ScoreboardPlayers',
    'Link,IngameRole,Champion,Kills,Deaths,Assists,CS,Gold,Items,Team,Side,GameId,MatchId',
    `GameId='${knownGameId}'`,
    cookies, 10,
  )
  console.log(JSON.stringify(sp, null, 2))
}

main().catch(console.error)
