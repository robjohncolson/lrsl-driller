-- v4.3: Game Mode & Tiebreaker Expansion
-- Adds support for multiple game modes (CTF, KotH) and tiebreaker types
--
-- DEPRECATED (v4.8.0): CTF/KotH client modules were removed. These schemas are
-- retained for historical data preservation. Do not add new game mode features.

-- ============================================
-- GAME MODE SETTINGS TABLE
-- ============================================
-- Stores per-cartridge/period game mode and tiebreaker preferences

CREATE TABLE IF NOT EXISTS game_mode_settings (
  id SERIAL PRIMARY KEY,
  cartridge_id VARCHAR(100) NOT NULL,
  class_period VARCHAR(1) NOT NULL
    CHECK (class_period IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  game_mode VARCHAR(20) DEFAULT 'ctf'
    CHECK (game_mode IN ('ctf', 'koth')),
  tiebreaker_type VARCHAR(20) DEFAULT 'pong'
    CHECK (tiebreaker_type IN ('pong', 'quick_calc', 'reflex_duel')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cartridge_id, class_period)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_game_mode_settings_lookup
  ON game_mode_settings(cartridge_id, class_period);

-- ============================================
-- KING OF THE HILL GAMES TABLE
-- ============================================
-- Stores KotH game state per cartridge/period

CREATE TABLE IF NOT EXISTS koth_games (
  id SERIAL PRIMARY KEY,
  cartridge_id VARCHAR(100) NOT NULL,
  class_period VARCHAR(1) NOT NULL
    CHECK (class_period IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),

  -- Session management (same pattern as CTF)
  session_status VARCHAR(20) DEFAULT 'idle'
    CHECK (session_status IN ('idle', 'scheduled', 'active', 'tiebreaker', 'ended')),
  session_start_time TIME,
  session_end_time TIME,
  session_started_at TIMESTAMPTZ,
  session_ended_at TIMESTAMPTZ,

  -- KotH specific: banked time
  blue_banked_seconds INTEGER DEFAULT 0,
  red_banked_seconds INTEGER DEFAULT 0,

  -- Hill control tracking
  current_hill_holder VARCHAR(10)
    CHECK (current_hill_holder IS NULL OR current_hill_holder IN ('blue', 'red')),
  hill_control_since TIMESTAMPTZ,

  -- Game result
  end_reason VARCHAR(20)
    CHECK (end_reason IS NULL OR end_reason IN ('timeout', 'manual', 'tiebreaker_complete')),
  winner VARCHAR(10)
    CHECK (winner IS NULL OR winner IN ('blue', 'red')),
  tiebreaker_winner VARCHAR(10)
    CHECK (tiebreaker_winner IS NULL OR tiebreaker_winner IN ('blue', 'red')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cartridge_id, class_period)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_koth_games_lookup
  ON koth_games(cartridge_id, class_period);

-- ============================================
-- KING OF THE HILL PLAYERS TABLE
-- ============================================
-- Stores player assignments and stats for KotH

CREATE TABLE IF NOT EXISTS koth_players (
  id SERIAL PRIMARY KEY,
  cartridge_id VARCHAR(100) NOT NULL,
  class_period VARCHAR(1) NOT NULL
    CHECK (class_period IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  username VARCHAR(50) NOT NULL,
  team VARCHAR(10) NOT NULL
    CHECK (team IN ('blue', 'red')),

  -- Session-specific stats (reset each session)
  session_points INTEGER DEFAULT 0,
  first_point_at TIMESTAMPTZ,

  -- Lifetime stats for this cartridge/period
  total_points INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cartridge_id, class_period, username)
);

-- Index for team lookups
CREATE INDEX IF NOT EXISTS idx_koth_players_team
  ON koth_players(cartridge_id, class_period, team);

-- ============================================
-- KING OF THE HILL POINT EVENTS TABLE
-- ============================================
-- Stores individual point events for rolling window calculation
-- Points decay over 7 minutes using this event log

CREATE TABLE IF NOT EXISTS koth_point_events (
  id SERIAL PRIMARY KEY,
  cartridge_id VARCHAR(100) NOT NULL,
  class_period VARCHAR(1) NOT NULL
    CHECK (class_period IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  username VARCHAR(50) NOT NULL,
  team VARCHAR(10) NOT NULL
    CHECK (team IN ('blue', 'red')),
  points INTEGER NOT NULL,
  star_type VARCHAR(10)
    CHECK (star_type IS NULL OR star_type IN ('gold', 'silver', 'bronze', 'tin')),
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient rolling window queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_koth_point_events_rolling
  ON koth_point_events(cartridge_id, class_period, earned_at DESC);

-- Index for per-team queries
CREATE INDEX IF NOT EXISTS idx_koth_point_events_team
  ON koth_point_events(cartridge_id, class_period, team, earned_at DESC);

-- ============================================
-- TIEBREAKER MATCHES TABLE
-- ============================================
-- Unified tiebreaker match tracking for all game modes and minigame types
-- Replaces CTF-specific tiebreaker tracking

CREATE TABLE IF NOT EXISTS tiebreaker_matches (
  id SERIAL PRIMARY KEY,
  cartridge_id VARCHAR(100) NOT NULL,
  class_period VARCHAR(1) NOT NULL
    CHECK (class_period IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  game_mode VARCHAR(20) NOT NULL
    CHECK (game_mode IN ('ctf', 'koth')),
  tiebreaker_type VARCHAR(20) NOT NULL
    CHECK (tiebreaker_type IN ('pong', 'quick_calc', 'reflex_duel')),

  -- Match tracking
  match_number INTEGER NOT NULL
    CHECK (match_number >= 1 AND match_number <= 3),
  blue_player VARCHAR(50),
  red_player VARCHAR(50),

  -- Ready state
  blue_ready BOOLEAN DEFAULT FALSE,
  red_ready BOOLEAN DEFAULT FALSE,

  -- Match result
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'in_progress', 'complete', 'forfeit')),
  winner VARCHAR(10)
    CHECK (winner IS NULL OR winner IN ('blue', 'red')),
  blue_score INTEGER,
  red_score INTEGER,
  forfeit_reason TEXT,

  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cartridge_id, class_period, game_mode, match_number)
);

-- Index for active match lookups
CREATE INDEX IF NOT EXISTS idx_tiebreaker_matches_active
  ON tiebreaker_matches(cartridge_id, class_period, game_mode, status);

-- ============================================
-- TIEBREAKER CHAMPIONS TABLE
-- ============================================
-- Stores selected champions for tiebreaker series

CREATE TABLE IF NOT EXISTS tiebreaker_champions (
  id SERIAL PRIMARY KEY,
  cartridge_id VARCHAR(100) NOT NULL,
  class_period VARCHAR(1) NOT NULL
    CHECK (class_period IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  game_mode VARCHAR(20) NOT NULL
    CHECK (game_mode IN ('ctf', 'koth')),
  team VARCHAR(10) NOT NULL
    CHECK (team IN ('blue', 'red')),
  username VARCHAR(50) NOT NULL,

  -- Selection criteria
  champion_rank INTEGER NOT NULL
    CHECK (champion_rank >= 1 AND champion_rank <= 3),
  velocity DECIMAL(10, 4), -- points per minute

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cartridge_id, class_period, game_mode, team, champion_rank)
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate weighted rolling total for KotH
-- Called from server-side JavaScript, not as a DB function
-- (Complex decay calculation better done in application code)

-- Function to get or create game mode settings
CREATE OR REPLACE FUNCTION get_or_create_game_mode_settings(
  p_cartridge_id VARCHAR(100),
  p_class_period VARCHAR(1)
) RETURNS game_mode_settings AS $$
DECLARE
  result game_mode_settings;
BEGIN
  -- Try to get existing settings
  SELECT * INTO result
  FROM game_mode_settings
  WHERE cartridge_id = p_cartridge_id
    AND class_period = p_class_period;

  -- If not found, create with defaults
  IF NOT FOUND THEN
    INSERT INTO game_mode_settings (cartridge_id, class_period, game_mode, tiebreaker_type)
    VALUES (p_cartridge_id, p_class_period, 'ctf', 'pong')
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create KotH game
CREATE OR REPLACE FUNCTION get_or_create_koth_game(
  p_cartridge_id VARCHAR(100),
  p_class_period VARCHAR(1)
) RETURNS koth_games AS $$
DECLARE
  result koth_games;
BEGIN
  -- Try to get existing game
  SELECT * INTO result
  FROM koth_games
  WHERE cartridge_id = p_cartridge_id
    AND class_period = p_class_period;

  -- If not found, create new game
  IF NOT FOUND THEN
    INSERT INTO koth_games (cartridge_id, class_period)
    VALUES (p_cartridge_id, p_class_period)
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CLEANUP TRIGGER
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to new tables
DROP TRIGGER IF EXISTS update_game_mode_settings_updated_at ON game_mode_settings;
CREATE TRIGGER update_game_mode_settings_updated_at
  BEFORE UPDATE ON game_mode_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_koth_games_updated_at ON koth_games;
CREATE TRIGGER update_koth_games_updated_at
  BEFORE UPDATE ON koth_games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_koth_players_updated_at ON koth_players;
CREATE TRIGGER update_koth_players_updated_at
  BEFORE UPDATE ON koth_players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tiebreaker_matches_updated_at ON tiebreaker_matches;
CREATE TRIGGER update_tiebreaker_matches_updated_at
  BEFORE UPDATE ON tiebreaker_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
