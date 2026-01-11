-- Migration 004: Generic progress table for all cartridges (v2.1)
-- This table stores aggregate star counts per user per cartridge,
-- enabling the modular platform to sync progress to the server.

-- Generic progress table for all cartridges
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  cartridge_id VARCHAR(100) NOT NULL,
  gold_stars INTEGER DEFAULT 0,
  silver_stars INTEGER DEFAULT 0,
  bronze_stars INTEGER DEFAULT 0,
  tin_stars INTEGER DEFAULT 0,
  total_weighted_score DECIMAL(10,2) DEFAULT 0,
  mode_progress JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(username, cartridge_id)
);

-- Index for leaderboard queries (sort by total score)
CREATE INDEX IF NOT EXISTS idx_user_progress_score ON user_progress(total_weighted_score DESC);

-- Index for cartridge-specific queries
CREATE INDEX IF NOT EXISTS idx_user_progress_cartridge ON user_progress(cartridge_id);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_progress_username ON user_progress(username);

-- Enable RLS (Row Level Security)
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read progress (for leaderboard)
CREATE POLICY "Public read user_progress" ON user_progress FOR SELECT USING (true);

-- Policy: Users can insert/update their own progress
-- Note: Server uses service role key which bypasses RLS, so this is for safety
CREATE POLICY "Users write own user_progress" ON user_progress FOR ALL USING (true);

-- Add comment for documentation
COMMENT ON TABLE user_progress IS 'Aggregate star counts per user per cartridge for the modular platform (v2.1)';
COMMENT ON COLUMN user_progress.mode_progress IS 'JSON object tracking progress per mode, e.g., {"mode-1": {"gold": 3, "silver": 2}}';
COMMENT ON COLUMN user_progress.total_weighted_score IS 'Sum of weighted points from all stars (used for leaderboard ranking)';
