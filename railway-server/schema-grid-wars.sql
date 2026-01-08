-- Grid Wars Schema Migration
-- Run this in Supabase SQL Editor to create Grid Wars tables
--
-- Prerequisites: users table must exist with username column

-- ============================================
-- Game Sessions
-- ============================================
-- One active game per class at a time
CREATE TABLE grid_wars_games (
  id SERIAL PRIMARY KEY,
  game_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  map_size INT DEFAULT 20,
  wave_number INT DEFAULT 0,
  center_hp INT DEFAULT 100,  -- Castle HP at center
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Territory Ownership
-- ============================================
-- 20x20 = 400 max rows per game
CREATE TABLE grid_wars_territories (
  id SERIAL PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES grid_wars_games(game_id) ON DELETE CASCADE,
  x INT NOT NULL CHECK (x >= 0 AND x < 20),
  y INT NOT NULL CHECK (y >= 0 AND y < 20),
  owner TEXT REFERENCES users(username) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, x, y)
);

-- ============================================
-- Structures
-- ============================================
-- Towers, farms, walls, castles placed on territories
CREATE TABLE grid_wars_structures (
  id SERIAL PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES grid_wars_games(game_id) ON DELETE CASCADE,
  x INT NOT NULL CHECK (x >= 0 AND x < 20),
  y INT NOT NULL CHECK (y >= 0 AND y < 20),
  structure_type TEXT NOT NULL CHECK (structure_type IN ('tower', 'farm', 'wall', 'castle')),
  owner TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  health INT DEFAULT 100,
  built_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, x, y)
);

-- ============================================
-- Player Stats
-- ============================================
-- Action points earned from drill, spent on building
CREATE TABLE grid_wars_players (
  id SERIAL PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES grid_wars_games(game_id) ON DELETE CASCADE,
  username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  action_points INT DEFAULT 0,
  territories_count INT DEFAULT 0,
  structures_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, username)
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX idx_gw_games_status ON grid_wars_games(status);
CREATE INDEX idx_gw_territories_game ON grid_wars_territories(game_id);
CREATE INDEX idx_gw_territories_owner ON grid_wars_territories(owner);
CREATE INDEX idx_gw_structures_game ON grid_wars_structures(game_id);
CREATE INDEX idx_gw_structures_owner ON grid_wars_structures(owner);
CREATE INDEX idx_gw_players_game ON grid_wars_players(game_id);
CREATE INDEX idx_gw_players_username ON grid_wars_players(username);

-- ============================================
-- Trigger: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_grid_wars_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gw_games_updated
  BEFORE UPDATE ON grid_wars_games
  FOR EACH ROW EXECUTE FUNCTION update_grid_wars_timestamp();

CREATE TRIGGER trigger_gw_players_updated
  BEFORE UPDATE ON grid_wars_players
  FOR EACH ROW EXECUTE FUNCTION update_grid_wars_timestamp();

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE grid_wars_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE grid_wars_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE grid_wars_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE grid_wars_players ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated operations (server uses service role key)
-- These policies allow the anon key to read, service role to write
CREATE POLICY "Allow read access to games" ON grid_wars_games
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to territories" ON grid_wars_territories
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to structures" ON grid_wars_structures
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to players" ON grid_wars_players
  FOR SELECT USING (true);

-- Service role bypasses RLS, so no INSERT/UPDATE/DELETE policies needed
-- The server uses SUPABASE_SERVICE_ROLE_KEY for writes

-- ============================================
-- Initial Data (Optional)
-- ============================================
-- Create a default game if you want one ready
-- INSERT INTO grid_wars_games (game_id, status) VALUES ('default', 'active');
