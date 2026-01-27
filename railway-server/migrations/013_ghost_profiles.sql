-- Ghost Profiles Table
-- Stores neural network state and behavioral metrics for student ghosts
-- Each student has one ghost per cartridge

CREATE TABLE IF NOT EXISTS ghost_profiles (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  cartridge_id TEXT NOT NULL,

  -- Neural network state (serialized weights)
  weights JSONB NOT NULL,

  -- Experience replay buffer (last 50 interactions)
  buffer JSONB,

  -- Derived metrics
  total_interactions INTEGER DEFAULT 0,
  proficiency_score FLOAT DEFAULT 0,
  color TEXT DEFAULT 'white',
  opacity FLOAT DEFAULT 0.1,

  -- Sync metadata
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One ghost per user per cartridge
  UNIQUE(username, cartridge_id)
);

-- Index for leaderboard queries (sorted by proficiency)
CREATE INDEX idx_ghost_profiles_cartridge_proficiency
  ON ghost_profiles(cartridge_id, proficiency_score DESC);

-- Index for user lookups
CREATE INDEX idx_ghost_profiles_username
  ON ghost_profiles(username);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_ghost_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ghost_profiles_updated
  BEFORE UPDATE ON ghost_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_ghost_timestamp();

-- Add comment for documentation
COMMENT ON TABLE ghost_profiles IS 'Neural network behavioral models for student ghosts - one per user per cartridge';
COMMENT ON COLUMN ghost_profiles.weights IS 'Serialized TensorFlow.js model weights (516 parameters)';
COMMENT ON COLUMN ghost_profiles.buffer IS 'Experience replay buffer - last 50 interactions for training';
COMMENT ON COLUMN ghost_profiles.proficiency_score IS 'Derived from test predictions, determines color (0-1)';
COMMENT ON COLUMN ghost_profiles.opacity IS 'Derived from interaction count (0.1-1.0)';
COMMENT ON COLUMN ghost_profiles.version IS 'For optimistic locking / conflict resolution';
