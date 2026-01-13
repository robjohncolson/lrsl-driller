-- Migration 007: Pong Duel - Token from Drilling
-- v3.1: Add correct_answer_count column for tracking total correct answers

-- Add column to track total correct answers for token calculation
-- This is separate from recent_correct_count which is for paddle bonus (resets on window expiry)
ALTER TABLE grid_wars_players
ADD COLUMN IF NOT EXISTS correct_answer_count INTEGER NOT NULL DEFAULT 0;

-- Add column to track the last threshold at which a token was granted
-- Prevents double-granting if count is incremented multiple times
ALTER TABLE grid_wars_players
ADD COLUMN IF NOT EXISTS last_token_grant_count INTEGER NOT NULL DEFAULT 0;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_grid_wars_players_correct_count
ON grid_wars_players(game_id, username, correct_answer_count);

COMMENT ON COLUMN grid_wars_players.correct_answer_count IS 'Total correct answers for token calculation (never resets)';
COMMENT ON COLUMN grid_wars_players.last_token_grant_count IS 'Last correct_answer_count threshold at which a drilling token was granted';
