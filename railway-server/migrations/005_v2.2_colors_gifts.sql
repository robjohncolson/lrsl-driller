-- Migration 005: v2.2 Colors and Gifts
-- Add unique player colors and gift tracking

-- Add color column to grid_wars_players
ALTER TABLE grid_wars_players
ADD COLUMN IF NOT EXISTS color VARCHAR(20);

-- Create gifts table to track territory transfers
CREATE TABLE IF NOT EXISTS grid_wars_gifts (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(100) NOT NULL,
  from_username VARCHAR(50) NOT NULL,
  to_username VARCHAR(50) NOT NULL,
  address VARCHAR(32) NOT NULL,
  gifted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_gifts_game ON grid_wars_gifts(game_id);
CREATE INDEX IF NOT EXISTS idx_gifts_from ON grid_wars_gifts(from_username);
CREATE INDEX IF NOT EXISTS idx_gifts_to ON grid_wars_gifts(to_username);
CREATE INDEX IF NOT EXISTS idx_gifts_timestamp ON grid_wars_gifts(gifted_at);
