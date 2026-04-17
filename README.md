# Scouted

A sleek, data-driven esports tracker for Tier 1 League of Legends — covering LCK, LEC, LCS, LPL, and LCP. Built for fans who want real stats, clean visuals, and useful tools for Pick'em brackets and PrizePicks decisions, all in one place. Expanding to Valorant and beyond.

---

## Features

### Live (Phase 0 ✅)
- Supabase Postgres database with full schema for regions, teams, players, tournaments, standings, matches, and per-game stats
- Next.js App Router project with TypeScript and Tailwind CSS
- Supabase client utilities for both server and browser contexts
- Row Level Security (RLS) enabled across all tables
- Automated CSV ingestion from Oracle's Elixir via Google Drive

### In Progress (Phase 1)
- Homepage with region tabs and recent match feed
- Team pages — roster, record, standings
- Player pages — KDA, CS, champion pool
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
| Data Sources | Oracle's Elixir, Riot Games API |
| Hosting | Vercel + Supabase |

---

## Database Schema

Eight tables covering the full data hierarchy:

```
regions → tournaments → matches → games → player_game_stats
       → teams → players
       → standings
```

- **regions** — LCK, LEC, LCS, LPL, LCP, International
- **teams** — per region, with logo URL and active status
- **players** — linked to teams, with role validation and free agent support
- **tournaments** — regional splits and international events (Worlds, MSI, First Stand)
- **standings** — win/loss record per team per tournament
- **matches** — individual games with status tracking (`scheduled`, `live`, `completed`)
- **games** — individual maps within a match, with patch and duration
- **player_game_stats** — per-player per-game stats; KDA is a generated column (auto-calculated)

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project

### Installation

```bash
git clone https://github.com/lewfi/riot-esports-analytics.git
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

### Seed the Database

Data is sourced from Oracle's Elixir and downloaded automatically. Run:

```bash
npx tsx scripts/seed.ts
```

This downloads the latest CSV files from Google Drive and upserts tournaments, teams, players, and matches into Supabase. Safe to re-run — all operations use upsert.

### Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
scouted/
├── app/                  # Next.js App Router pages and layouts
│   └── (home)/           # Homepage route group
├── components/
│   ├── layout/           # Navbar, Sidebar
│   ├── matches/          # MatchCard, MatchList
│   └── ui/               # PillTabs and shared UI primitives
├── lib/
│   └── supabase/
│       ├── client.ts     # Browser Supabase client (anon key)
│       └── server.ts     # Server Supabase client + admin client
├── scripts/
│   └── seed.ts           # Oracle's Elixir CSV ingestion script
├── supabase/
│   └── migrations/       # SQL migration files
├── .env.local            # Local environment variables (gitignored)
└── README.md
```

---

## Data Sources

- **[Oracle's Elixir](https://oracleselixir.com/)** — Primary source for match and player stats, updated daily
- **[Riot Games API](https://developer.riotgames.com/)** — Official match data (planned)
- **[Community Dragon](https://www.communitydragon.org/)** — Free CDN for champion and team assets (planned)

> **Note:** Standard Riot API keys do not include live esports feeds. The live match tracker is planned for Phase 3, pending a partner key.

---

## Contributing

This is a personal project and not currently open for external contributions. Feel free to fork it for your own use.

---

## License

MIT
