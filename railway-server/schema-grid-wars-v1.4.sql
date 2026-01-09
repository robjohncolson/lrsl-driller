-- Grid Wars Schema v1.4: Seasons, Rankings, and Engagement
-- Run after v3 schema
--
-- Features:
--   - lifetime_earned tracking (Task 1)
--   - Round history / hall of fame (Task 3)
--   - Round configuration on games table (Task 3)

-- ============================================
-- Task 1: lifetime_earned Tracking
-- ============================================

-- Add lifetime_earned column to track total points ever earned
-- (action_points tracks balance = earned - spent)
ALTER TABLE grid_wars_players ADD COLUMN IF NOT EXISTS lifetime_earned INTEGER DEFAULT 0;

-- Migration: Set lifetime_earned = action_points for existing rows
-- (We lose historical spending data, but track correctly going forward)
UPDATE grid_wars_players
SET lifetime_earned = action_points
WHERE lifetime_earned = 0 OR lifetime_earned IS NULL;

-- Index for Scholar leaderboard queries
CREATE INDEX IF NOT EXISTS idx_gw_players_lifetime ON grid_wars_players(lifetime_earned DESC);

-- ============================================
-- Task 3: Round System
-- ============================================

-- Round history table (hall of fame)
CREATE TABLE IF NOT EXISTS round_history (
  id SERIAL PRIMARY KEY,
  game_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ DEFAULT NOW(),
  victory_condition TEXT NOT NULL CHECK (victory_condition IN ('domination', 'timed', 'collaborative', 'manual')),
  winner_id TEXT,
  winner_name TEXT,
  winner_score INTEGER,
  runner_up_id TEXT,
  runner_up_name TEXT,
  runner_up_score INTEGER,
  third_place_id TEXT,
  third_place_name TEXT,
  third_place_score INTEGER,
  total_players INTEGER DEFAULT 0,
  total_cells_claimed INTEGER DEFAULT 0,
  class_goal_reached BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  UNIQUE(game_id, round_number)
);

-- Indexes for round_history queries
CREATE INDEX IF NOT EXISTS idx_round_history_game ON round_history(game_id);
CREATE INDEX IF NOT EXISTS idx_round_history_ended ON round_history(ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_round_history_winner ON round_history(winner_id);

-- Extend games table with round configuration
ALTER TABLE grid_wars_games ADD COLUMN IF NOT EXISTS rounds_enabled BOOLEAN DEFAULT false;
ALTER TABLE grid_wars_games ADD COLUMN IF NOT EXISTS round_number INTEGER DEFAULT 1;
ALTER TABLE grid_wars_games ADD COLUMN IF NOT EXISTS round_started_at TIMESTAMPTZ;
ALTER TABLE grid_wars_games ADD COLUMN IF NOT EXISTS round_ends_at TIMESTAMPTZ;
ALTER TABLE grid_wars_games ADD COLUMN IF NOT EXISTS round_status TEXT DEFAULT 'active';
ALTER TABLE grid_wars_games ADD COLUMN IF NOT EXISTS victory_config JSONB DEFAULT '{"type": "manual"}';
ALTER TABLE grid_wars_games ADD COLUMN IF NOT EXISTS legacy_bonus_winner INTEGER DEFAULT 5;
ALTER TABLE grid_wars_games ADD COLUMN IF NOT EXISTS legacy_bonus_top3 INTEGER DEFAULT 3;

-- Add pending legacy bonus to players (awarded at next round start)
ALTER TABLE grid_wars_players ADD COLUMN IF NOT EXISTS pending_legacy_bonus INTEGER DEFAULT 0;

-- ============================================
-- Verify schema
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'grid_wars_players' ORDER BY ordinal_position;
