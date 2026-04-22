-- Run in Supabase SQL Editor to add picks & bans columns to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS team_blue_picks TEXT[];
ALTER TABLE games ADD COLUMN IF NOT EXISTS team_red_picks  TEXT[];
ALTER TABLE games ADD COLUMN IF NOT EXISTS team_blue_bans  TEXT[];
ALTER TABLE games ADD COLUMN IF NOT EXISTS team_red_bans   TEXT[];
