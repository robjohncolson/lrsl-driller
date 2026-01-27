-- Migration 014: Ghost Battle System
-- Adds tables for ghost-vs-ghost battle simulation, ratings, and history

-- ============================================
-- GHOST BATTLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ghost_battles (
  id SERIAL PRIMARY KEY,
  cartridge_id VARCHAR(100) NOT NULL,

  -- Participants
  challenger_username VARCHAR(50) NOT NULL,
  defender_username VARCHAR(50) NOT NULL,

  -- Battle configuration
  challenge_type VARCHAR(20) NOT NULL
    CHECK (challenge_type IN ('random', 'specific', 'rematch', 'leaderboard')),
  seed BIGINT NOT NULL,  -- For reproducibility

  -- Results
  winner VARCHAR(50),  -- NULL for draw
  winner_side INTEGER NOT NULL
    CHECK (winner_side IN (0, 1, 2)), -- 0=draw, 1=challenger, 2=defender

  -- Statistics
  challenger_time FLOAT NOT NULL,
  challenger_correct INTEGER NOT NULL,
  defender_time FLOAT NOT NULL,
  defender_correct INTEGER NOT NULL,
  margin FLOAT NOT NULL,

  -- Ratings (snapshot at battle time)
  challenger_rating_before INTEGER NOT NULL,
  defender_rating_before INTEGER NOT NULL,
  challenger_rating_after INTEGER NOT NULL,
  defender_rating_after INTEGER NOT NULL,

  -- Timeline data (full battle log as JSON)
  battle_log JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ghost_battles_cartridge
  ON ghost_battles(cartridge_id);

CREATE INDEX IF NOT EXISTS idx_ghost_battles_challenger
  ON ghost_battles(challenger_username);

CREATE INDEX IF NOT EXISTS idx_ghost_battles_defender
  ON ghost_battles(defender_username);

CREATE INDEX IF NOT EXISTS idx_ghost_battles_created
  ON ghost_battles(created_at DESC);

-- Composite index for user battle history
CREATE INDEX IF NOT EXISTS idx_ghost_battles_user_history
  ON ghost_battles(cartridge_id, created_at DESC)
  WHERE challenger_username IS NOT NULL;

-- ============================================
-- GHOST RATINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ghost_ratings (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  cartridge_id VARCHAR(100) NOT NULL,

  -- Rating data
  rating INTEGER DEFAULT 1200,
  battles_fought INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,

  -- Streak tracking
  current_streak INTEGER DEFAULT 0,  -- Positive = wins, negative = losses
  best_streak INTEGER DEFAULT 0,

  -- Last battle timestamp (for matchmaking)
  last_battle_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One rating per user per cartridge
  UNIQUE(username, cartridge_id)
);

-- Index for leaderboard queries (sorted by rating)
CREATE INDEX IF NOT EXISTS idx_ghost_ratings_leaderboard
  ON ghost_ratings(cartridge_id, rating DESC);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_ghost_ratings_username
  ON ghost_ratings(username);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

-- Reuse existing trigger function if available, otherwise create
CREATE OR REPLACE FUNCTION update_ghost_ratings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ghost_ratings_updated_at ON ghost_ratings;
CREATE TRIGGER ghost_ratings_updated_at
  BEFORE UPDATE ON ghost_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_ghost_ratings_timestamp();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get or create rating record
CREATE OR REPLACE FUNCTION get_or_create_ghost_rating(
  p_username VARCHAR(50),
  p_cartridge_id VARCHAR(100)
)
RETURNS ghost_ratings AS $$
DECLARE
  v_rating ghost_ratings;
BEGIN
  -- Try to get existing
  SELECT * INTO v_rating
  FROM ghost_ratings
  WHERE username = p_username AND cartridge_id = p_cartridge_id;

  -- Create if not exists
  IF v_rating IS NULL THEN
    INSERT INTO ghost_ratings (username, cartridge_id, rating)
    VALUES (p_username, p_cartridge_id, 1200)
    RETURNING * INTO v_rating;
  END IF;

  RETURN v_rating;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE ghost_battles IS 'Battle history for ghost-vs-ghost competitions';
COMMENT ON COLUMN ghost_battles.seed IS 'Random seed for reproducible battle simulation';
COMMENT ON COLUMN ghost_battles.winner_side IS '0=draw, 1=challenger won, 2=defender won';
COMMENT ON COLUMN ghost_battles.battle_log IS 'Full timeline of problem-by-problem results (JSON)';

COMMENT ON TABLE ghost_ratings IS 'Elo-style ratings for ghost battle competitions';
COMMENT ON COLUMN ghost_ratings.current_streak IS 'Positive = win streak, negative = loss streak';
COMMENT ON COLUMN ghost_ratings.best_streak IS 'Highest win streak achieved';
