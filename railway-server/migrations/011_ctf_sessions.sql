-- Migration 011: CTF Timed Sessions with Per-Period Games
-- Adds session management, per-class-period isolation, and tiebreaker tracking
--
-- DEPRECATED (v4.8.0): CTF client modules were removed. These schemas are
-- retained for historical data preservation. Do not add new CTF features.

-- ============================================
-- MODIFY ctf_games TABLE
-- ============================================

-- Add class_period for per-period games
ALTER TABLE ctf_games ADD COLUMN IF NOT EXISTS class_period VARCHAR(1)
  CHECK (class_period IN ('A', 'B', 'C', 'D', 'E', 'F', 'G'));

-- Add session management columns
ALTER TABLE ctf_games ADD COLUMN IF NOT EXISTS session_status VARCHAR(20) DEFAULT 'idle'
  CHECK (session_status IN ('idle', 'scheduled', 'active', 'tiebreaker', 'ended'));
ALTER TABLE ctf_games ADD COLUMN IF NOT EXISTS session_start_time TIME;        -- Scheduled start (HH:MM)
ALTER TABLE ctf_games ADD COLUMN IF NOT EXISTS session_end_time TIME;          -- Scheduled end (HH:MM)
ALTER TABLE ctf_games ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMPTZ; -- Actual start
ALTER TABLE ctf_games ADD COLUMN IF NOT EXISTS session_ended_at TIMESTAMPTZ;   -- Actual end
ALTER TABLE ctf_games ADD COLUMN IF NOT EXISTS end_reason VARCHAR(20)
  CHECK (end_reason IN ('timeout', 'manual', 'flag_captured', 'tiebreaker_complete'));
ALTER TABLE ctf_games ADD COLUMN IF NOT EXISTS tiebreaker_winner VARCHAR(10)
  CHECK (tiebreaker_winner IN ('blue', 'red'));

-- Change unique constraint from cartridge_id to (cartridge_id, class_period)
ALTER TABLE ctf_games DROP CONSTRAINT IF EXISTS ctf_games_cartridge_id_key;
ALTER TABLE ctf_games ADD CONSTRAINT ctf_games_cartridge_period_key
  UNIQUE (cartridge_id, class_period);

-- ============================================
-- MODIFY ctf_players TABLE
-- ============================================

-- Add class_period to match games table
ALTER TABLE ctf_players ADD COLUMN IF NOT EXISTS class_period VARCHAR(1)
  CHECK (class_period IN ('A', 'B', 'C', 'D', 'E', 'F', 'G'));

-- Add session tracking columns
ALTER TABLE ctf_players ADD COLUMN IF NOT EXISTS session_points INTEGER DEFAULT 0;
ALTER TABLE ctf_players ADD COLUMN IF NOT EXISTS first_point_at TIMESTAMPTZ;

-- Change unique constraint
ALTER TABLE ctf_players DROP CONSTRAINT IF EXISTS ctf_players_cartridge_id_username_key;
ALTER TABLE ctf_players ADD CONSTRAINT ctf_players_cartridge_period_username_key
  UNIQUE (cartridge_id, class_period, username);

-- Update existing index
DROP INDEX IF EXISTS idx_ctf_players_cartridge;
CREATE INDEX IF NOT EXISTS idx_ctf_players_cartridge_period ON ctf_players(cartridge_id, class_period);

-- Update leaderboard index
DROP INDEX IF EXISTS idx_ctf_players_points;
CREATE INDEX IF NOT EXISTS idx_ctf_players_points ON ctf_players(cartridge_id, class_period, team, points_contributed DESC);

-- ============================================
-- CREATE ctf_tiebreaker_matches TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ctf_tiebreaker_matches (
  id SERIAL PRIMARY KEY,
  cartridge_id VARCHAR(100) NOT NULL,
  class_period VARCHAR(1) NOT NULL,        -- Links to specific period's game
  match_number INTEGER NOT NULL,           -- 1, 2, or 3
  blue_player VARCHAR(50),
  red_player VARCHAR(50),
  blue_score INTEGER DEFAULT 0,
  red_score INTEGER DEFAULT 0,
  winner VARCHAR(20),                      -- 'blue', 'red', 'forfeit_blue', 'forfeit_red', 'skip'
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cartridge_id, class_period, match_number),
  CHECK (class_period IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  CHECK (match_number BETWEEN 1 AND 3)
);

-- Index for tiebreaker queries
CREATE INDEX IF NOT EXISTS idx_ctf_tiebreaker_game ON ctf_tiebreaker_matches(cartridge_id, class_period);

-- ============================================
-- DATA MIGRATION FOR EXISTING GAMES
-- ============================================

-- Delete existing games without class_period (clean slate approach)
-- Comment these out if you want to preserve existing data and manually assign periods
DELETE FROM ctf_players WHERE class_period IS NULL;
DELETE FROM ctf_games WHERE class_period IS NULL;

-- Make class_period NOT NULL after cleanup
ALTER TABLE ctf_games ALTER COLUMN class_period SET NOT NULL;
ALTER TABLE ctf_players ALTER COLUMN class_period SET NOT NULL;

-- ============================================
-- TRIGGER FOR TIEBREAKER MATCHES
-- ============================================

-- Ensure the update function exists (may already exist from migration 009)
CREATE OR REPLACE FUNCTION update_ctf_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ctf_tiebreaker_matches_updated_at ON ctf_tiebreaker_matches;
CREATE TRIGGER ctf_tiebreaker_matches_updated_at
  BEFORE UPDATE ON ctf_tiebreaker_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_ctf_updated_at();
