-- Migration 015: Ghost Orbits - Territory Game
-- Adds tables for Ghost Orbits arena sessions and player statistics

-- ============================================
-- GHOST ORBITS SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ghost_orbits_sessions (
  id SERIAL PRIMARY KEY,
  cartridge_id VARCHAR(100) NOT NULL,
  period_id VARCHAR(50),

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- Round tracking
  round_number INTEGER DEFAULT 1,
  round_duration_ms INTEGER,

  -- Final results
  winner_username VARCHAR(50),
  final_rankings JSONB,

  -- Participation
  total_players INTEGER,
  total_eliminations INTEGER
);

-- Index for session lookups by cartridge
CREATE INDEX IF NOT EXISTS idx_orbits_sessions_cartridge
  ON ghost_orbits_sessions(cartridge_id);

-- Index for session lookups by period
CREATE INDEX IF NOT EXISTS idx_orbits_sessions_period
  ON ghost_orbits_sessions(period_id);

-- Index for recent sessions
CREATE INDEX IF NOT EXISTS idx_orbits_sessions_started
  ON ghost_orbits_sessions(started_at DESC);

-- ============================================
-- GHOST ORBITS STATS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ghost_orbits_stats (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  cartridge_id VARCHAR(100) NOT NULL,

  -- Lifetime stats
  games_played INTEGER DEFAULT 0,
  total_territory_percent DECIMAL(10,4) DEFAULT 0,
  total_eliminations INTEGER DEFAULT 0,
  times_eliminated INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,

  -- Best performance
  best_territory_percent DECIMAL(5,2),
  longest_survival_ms INTEGER,

  -- Timestamp
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One stats record per user per cartridge
  UNIQUE(username, cartridge_id)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_orbits_stats_user
  ON ghost_orbits_stats(username);

-- Index for cartridge leaderboards
CREATE INDEX IF NOT EXISTS idx_orbits_stats_cartridge_wins
  ON ghost_orbits_stats(cartridge_id, wins DESC);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

-- Create trigger function for ghost_orbits_stats
CREATE OR REPLACE FUNCTION update_ghost_orbits_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ghost_orbits_stats_updated_at ON ghost_orbits_stats;
CREATE TRIGGER ghost_orbits_stats_updated_at
  BEFORE UPDATE ON ghost_orbits_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_ghost_orbits_stats_timestamp();

-- ============================================
-- LEADERBOARD VIEW
-- ============================================

-- Global wins scoreboard (aggregates across all cartridges)
CREATE OR REPLACE VIEW ghost_orbits_leaderboard AS
SELECT
  username,
  SUM(wins) as total_wins,
  SUM(games_played) as total_games,
  ROUND(SUM(wins)::decimal / NULLIF(SUM(games_played), 0) * 100, 1) as win_rate,
  MAX(best_territory_percent) as best_territory
FROM ghost_orbits_stats
GROUP BY username
ORDER BY total_wins DESC;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get or create stats record for a user/cartridge
CREATE OR REPLACE FUNCTION get_or_create_orbits_stats(
  p_username VARCHAR(50),
  p_cartridge_id VARCHAR(100)
)
RETURNS ghost_orbits_stats AS $$
DECLARE
  v_stats ghost_orbits_stats;
BEGIN
  -- Try to get existing
  SELECT * INTO v_stats
  FROM ghost_orbits_stats
  WHERE username = p_username AND cartridge_id = p_cartridge_id;

  -- Create if not exists
  IF v_stats IS NULL THEN
    INSERT INTO ghost_orbits_stats (username, cartridge_id)
    VALUES (p_username, p_cartridge_id)
    RETURNING * INTO v_stats;
  END IF;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to update stats after a game
CREATE OR REPLACE FUNCTION update_orbits_stats(
  p_username VARCHAR(50),
  p_cartridge_id VARCHAR(100),
  p_territory_percent DECIMAL(5,2),
  p_eliminations INTEGER,
  p_was_eliminated BOOLEAN,
  p_won BOOLEAN,
  p_survival_ms INTEGER
)
RETURNS ghost_orbits_stats AS $$
DECLARE
  v_stats ghost_orbits_stats;
BEGIN
  -- Ensure record exists
  PERFORM get_or_create_orbits_stats(p_username, p_cartridge_id);

  -- Update stats
  UPDATE ghost_orbits_stats
  SET
    games_played = games_played + 1,
    total_territory_percent = total_territory_percent + p_territory_percent,
    total_eliminations = total_eliminations + p_eliminations,
    times_eliminated = times_eliminated + CASE WHEN p_was_eliminated THEN 1 ELSE 0 END,
    wins = wins + CASE WHEN p_won THEN 1 ELSE 0 END,
    best_territory_percent = GREATEST(COALESCE(best_territory_percent, 0), p_territory_percent),
    longest_survival_ms = GREATEST(COALESCE(longest_survival_ms, 0), p_survival_ms)
  WHERE username = p_username AND cartridge_id = p_cartridge_id
  RETURNING * INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE ghost_orbits_sessions IS 'Arena game sessions for Ghost Orbits territory game';
COMMENT ON COLUMN ghost_orbits_sessions.period_id IS 'Class period identifier for session grouping';
COMMENT ON COLUMN ghost_orbits_sessions.round_number IS 'Current or final round number in the session';
COMMENT ON COLUMN ghost_orbits_sessions.final_rankings IS 'JSON array of {username, territory_percent, eliminations, place}';

COMMENT ON TABLE ghost_orbits_stats IS 'Lifetime player statistics for Ghost Orbits - one per user per cartridge';
COMMENT ON COLUMN ghost_orbits_stats.total_territory_percent IS 'Cumulative territory % across all games (for averages)';
COMMENT ON COLUMN ghost_orbits_stats.best_territory_percent IS 'Highest territory % achieved in a single game';
COMMENT ON COLUMN ghost_orbits_stats.longest_survival_ms IS 'Longest survival time in milliseconds';

COMMENT ON VIEW ghost_orbits_leaderboard IS 'Global leaderboard aggregating wins across all cartridges';
