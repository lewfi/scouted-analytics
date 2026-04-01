# Riot Esports Analytics

A clean, data-driven website for tracking Tier 1 League of Legends esports across all major regions — LCK, LEC, LCS, LPL, and LCP. Built for fans who want real stats, live match tracking, and useful tools for Pick'em brackets and PrizePicks decisions, all in one place.

---

## Features

### Live (Phase 0 ✅)
- Supabase Postgres database with full schema for regions, teams, players, tournaments, standings, matches, and per-game stats
- Next.js App Router project with TypeScript and Tailwind CSS
- Supabase client utilities for both server and browser contexts
- Row Level Security (RLS) enabled across all tables

### In Progress (Phase 1)
- Team pages — roster, record, standings
- Player pages — KDA, CS, champion pool
- Homepage with region tabs
- Search by player or team
- Split-level stat tables

### Planned
- **Phase 2** — Charts & graphs, live match tracker, radar charts per role, public beta
- **Phase 3** — Pick'em helper tool, Worlds/MSI tournament hub, champion meta tracker
- **Phase 4** — User accounts & favorites, betting insights panel, mobile PWA, public API

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS |
| Data Visualization | Recharts, D3.js |
| Backend | Next.js API Routes |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Caching | Upstash Redis |
| Realtime | Supabase Realtime |
| Data Sources | Riot Games API, Leaguepedia, Oracle's Elixir |
| Hosting | Vercel + Supabase |

---

## Database Schema

Eight tables covering the full data hierarchy:

```
regions → tournaments → matches → games → player_game_stats
       → teams → players
       → standings
```

- **regions** — LCK, LEC, LCS, LPL, LCP
- **teams** — per region, with logo URL and active status
- **players** — linked to teams, with role validation and free agent support
- **tournaments** — regional splits and international events (Worlds, MSI)
- **standings** — win/loss record per team per tournament
- **matches** — best-of series with status tracking (`scheduled`, `live`, `completed`)
- **games** — individual maps within a match, with patch and duration
- **player_game_stats** — per-player per-game stats; KDA is a generated column (auto-calculated)

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project
- Riot Games API key

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/riot-esports-analytics.git
cd riot-esports-analytics
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
```

Get these values from your Supabase dashboard under **Settings → API Keys**.

### Database Setup

Run the migration file against your Supabase project via the SQL Editor:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, indexes, RLS policies, and seeds the 5 regions.

### Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
riot-esports-analytics/
├── app/                  # Next.js App Router pages and layouts
├── components/           # Reusable UI components
├── lib/
│   └── supabase/
│       ├── client.ts     # Browser Supabase client (anon key)
│       └── server.ts     # Server Supabase client + admin client
├── supabase/
│   └── migrations/       # SQL migration files
├── .env.local            # Local environment variables (gitignored)
└── README.md
```

---

## Data Sources

- **[Riot Games API](https://developer.riotgames.com/)** — Official match and player data
- **[Leaguepedia](https://lol.fandom.com/wiki/League_of_Legends_Esports_Wiki)** — Community-maintained esports history and stats
- **[Oracle's Elixir](https://oracleselixir.com/)** — Advanced esports statistics
- **[Community Dragon](https://www.communitydragon.org/)** — Free CDN for champion and team assets

> **Note:** Standard Riot API keys do not include live esports feeds. The live match tracker is planned for Phase 3, pending a partner key.

---

## License

MIT
