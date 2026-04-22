-- Run this in Supabase SQL Editor before running sync-leaguepedia.ts

-- Add leaguepedia_name to tournaments (the exact name used in Leaguepedia Cargo)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS leaguepedia_name TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournaments_leaguepedia_name
  ON tournaments (leaguepedia_name)
  WHERE leaguepedia_name IS NOT NULL;

-- Individual games within a series
CREATE TABLE IF NOT EXISTS games (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id             UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  game_number          INTEGER NOT NULL,
  leaguepedia_game_id  TEXT UNIQUE NOT NULL,
  winner               INTEGER,          -- 1 = team1/blue, 2 = team2/red
  duration             TEXT,
  patch                TEXT,
  played_at            TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Per-game player stats
CREATE TABLE IF NOT EXISTS player_game_stats (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id      UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id    UUID REFERENCES players(id),
  player_name  TEXT NOT NULL,            -- Leaguepedia Link field (canonical player name)
  team_id      UUID REFERENCES teams(id),
  side         INTEGER,                  -- 1 = blue/team1, 2 = red/team2
  role         TEXT,
  champion     TEXT,
  kills        INTEGER DEFAULT 0,
  deaths       INTEGER DEFAULT 0,
  assists      INTEGER DEFAULT 0,
  cs           INTEGER DEFAULT 0,
  gold         INTEGER DEFAULT 0,
  items        TEXT[],
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (game_id, player_name)
);
