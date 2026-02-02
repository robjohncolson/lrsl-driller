-- Migration 009: Linear CTF (Capture The Flag) Game
-- Replaces Grid Wars and Pong Duel with a simpler tug-of-war game
--
-- DEPRECATED (v4.8.0): CTF client modules were removed. These schemas are
-- retained for historical data preservation. Do not add new CTF features.

-- CTF Games: One row per cartridge
CREATE TABLE IF NOT EXISTS ctf_games (
  id SERIAL PRIMARY KEY,
  cartridge_id VARCHAR(100) NOT NULL UNIQUE,
  front_position INTEGER NOT NULL DEFAULT 10,
  blue_points INTEGER NOT NULL DEFAULT 0,
  red_points INTEGER NOT NULL DEFAULT 0,
  winner VARCHAR(10) DEFAULT NULL CHECK (winner IN ('blue', 'red', NULL)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CTF Players: Team assignments per cartridge
CREATE TABLE IF NOT EXISTS ctf_players (
  id SERIAL PRIMARY KEY,
  cartridge_id VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL,
  team VARCHAR(10) NOT NULL CHECK (team IN ('blue', 'red')),
  points_contributed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cartridge_id, username)
);

-- Index for fast lookups by cartridge
CREATE INDEX IF NOT EXISTS idx_ctf_players_cartridge ON ctf_players(cartridge_id);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_ctf_players_points ON ctf_players(cartridge_id, team, points_contributed DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ctf_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS ctf_games_updated_at ON ctf_games;
CREATE TRIGGER ctf_games_updated_at
  BEFORE UPDATE ON ctf_games
  FOR EACH ROW
  EXECUTE FUNCTION update_ctf_updated_at();

DROP TRIGGER IF EXISTS ctf_players_updated_at ON ctf_players;
CREATE TRIGGER ctf_players_updated_at
  BEFORE UPDATE ON ctf_players
  FOR EACH ROW
  EXECUTE FUNCTION update_ctf_updated_at();
