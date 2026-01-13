-- Migration 006: Pong Duel System
-- Territory resolver minigame for Grid Wars
-- Run this migration in Supabase SQL Editor

-- =============================================================================
-- STEP 1: Add token and tracking columns to grid_wars_players
-- =============================================================================

-- Challenge tokens for initiating duels (v3.1: start with 2)
ALTER TABLE grid_wars_players
ADD COLUMN IF NOT EXISTS challenge_tokens INTEGER NOT NULL DEFAULT 2;

-- Rent tracking for token generation
ALTER TABLE grid_wars_players
ADD COLUMN IF NOT EXISTS total_rent_earned INTEGER NOT NULL DEFAULT 0;

ALTER TABLE grid_wars_players
ADD COLUMN IF NOT EXISTS last_token_grant_rent INTEGER NOT NULL DEFAULT 0;

-- Recent correct answers tracking for paddle bonus
-- Resets when window_start is older than 10 minutes
ALTER TABLE grid_wars_players
ADD COLUMN IF NOT EXISTS recent_correct_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE grid_wars_players
ADD COLUMN IF NOT EXISTS recent_correct_window_start TIMESTAMPTZ;

-- =============================================================================
-- STEP 2: Pong duel stats per player
-- =============================================================================

CREATE TABLE IF NOT EXISTS pong_stats (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  conquest_wins INTEGER NOT NULL DEFAULT 0,    -- Won as attacker
  defense_wins INTEGER NOT NULL DEFAULT 0,     -- Won as defender
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, username)
);

CREATE INDEX IF NOT EXISTS idx_pong_stats_game ON pong_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_pong_stats_wins ON pong_stats(game_id, wins DESC);

-- =============================================================================
-- STEP 3: Active/completed duels
-- =============================================================================

CREATE TABLE IF NOT EXISTS pong_duels (
  id VARCHAR(100) PRIMARY KEY,
  game_id VARCHAR(100) NOT NULL,
  attacker_username VARCHAR(50) NOT NULL,
  defender_username VARCHAR(50) NOT NULL,
  territory_address VARCHAR(32) NOT NULL,      -- Cell being contested
  attack_cost INTEGER NOT NULL,                 -- What attacker would have paid
  phase VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, countdown, active, finished, cancelled
  attacker_score INTEGER NOT NULL DEFAULT 0,
  defender_score INTEGER NOT NULL DEFAULT 0,
  attacker_paddle_height INTEGER NOT NULL DEFAULT 80,
  defender_paddle_height INTEGER NOT NULL DEFAULT 80,
  winner_username VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,                       -- When countdown began
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pong_duels_game ON pong_duels(game_id);
CREATE INDEX IF NOT EXISTS idx_pong_duels_phase ON pong_duels(game_id, phase);
CREATE INDEX IF NOT EXISTS idx_pong_duels_attacker ON pong_duels(attacker_username);
CREATE INDEX IF NOT EXISTS idx_pong_duels_defender ON pong_duels(defender_username);

-- =============================================================================
-- STEP 4: Duel history / match records
-- =============================================================================

CREATE TABLE IF NOT EXISTS pong_matches (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(100) NOT NULL,
  duel_id VARCHAR(100) NOT NULL,
  attacker_username VARCHAR(50) NOT NULL,
  defender_username VARCHAR(50) NOT NULL,
  territory_address VARCHAR(32) NOT NULL,
  winner_username VARCHAR(50) NOT NULL,
  attacker_score INTEGER NOT NULL,
  defender_score INTEGER NOT NULL,
  duration_seconds NUMERIC NOT NULL,
  consolation_paid INTEGER NOT NULL DEFAULT 0,  -- Points given to loser
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pong_matches_game ON pong_matches(game_id);
CREATE INDEX IF NOT EXISTS idx_pong_matches_players ON pong_matches(game_id, winner_username);

-- =============================================================================
-- STEP 5: Duel rate limiting log
-- =============================================================================

CREATE TABLE IF NOT EXISTS pong_duel_log (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pong_duel_log_recent
ON pong_duel_log(game_id, username, created_at DESC);

-- =============================================================================
-- STEP 6: Game settings for teacher controls
-- =============================================================================

-- Add duels_enabled to grid_wars_games table
ALTER TABLE grid_wars_games
ADD COLUMN IF NOT EXISTS duels_enabled BOOLEAN NOT NULL DEFAULT true;

-- =============================================================================
-- STEP 7: Helper function for incrementing action points
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_action_points(
  p_game_id VARCHAR(100),
  p_username VARCHAR(50),
  p_points INTEGER
) RETURNS INTEGER AS $$
DECLARE
  new_total INTEGER;
BEGIN
  UPDATE grid_wars_players
  SET action_points = action_points + p_points
  WHERE game_id = p_game_id AND username = p_username
  RETURNING action_points INTO new_total;

  RETURN COALESCE(new_total, 0);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 8: Comments for documentation
-- =============================================================================

COMMENT ON COLUMN grid_wars_players.challenge_tokens IS 'Tokens for initiating pong duels (earn from rent, spend to challenge)';
COMMENT ON COLUMN grid_wars_players.total_rent_earned IS 'Total rent earned from landlord tax (for token calculation)';
COMMENT ON COLUMN grid_wars_players.last_token_grant_rent IS 'Rent value at which last token was granted';
COMMENT ON COLUMN grid_wars_players.recent_correct_count IS 'Correct answers in current 10-min window (for paddle bonus)';
COMMENT ON COLUMN grid_wars_players.recent_correct_window_start IS 'Start of current 10-min window for correct count';

COMMENT ON TABLE pong_stats IS 'Aggregate win/loss stats per player for pong duels';
COMMENT ON TABLE pong_duels IS 'Active and completed pong duel matches';
COMMENT ON TABLE pong_matches IS 'Historical record of completed matches';
COMMENT ON TABLE pong_duel_log IS 'Rate limiting log - tracks when players initiated duels';

COMMENT ON COLUMN grid_wars_games.duels_enabled IS 'Teacher toggle to enable/disable pong duels';

-- =============================================================================
-- NOTES
-- =============================================================================
-- Token economy:
--   - Players start with 2 tokens (v3.1)
--   - Earn 1 token per 20 pts of landlord rent collected
--   - Earn 1 token per 10 correct answers (v3.1)
--   - Earn 1 token for winning a duel (v3.1)
--   - Max 5 tokens
--   - Spend 1 token to challenge a duel
--
-- Paddle bonus:
--   - Base paddle = 80px
--   - +5px per correct answer in last 10 minutes
--   - Max +20px bonus (so max paddle = 100px)
--
-- Rate limiting:
--   - Max 2 duels per 10 minutes per player
--   - Challenge expires after 30 seconds if not accepted
