-- Grid Wars v1.5.1: Point Events Table for Velocity Persistence
-- Run this migration in Supabase SQL Editor

-- Create the point_events table
CREATE TABLE IF NOT EXISTS point_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL DEFAULT 'lynn-classroom-2026',
  player_id TEXT NOT NULL,  -- v1.6.2: Renamed from username for consistency
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  cartridge_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for velocity calculation (player + recent time)
CREATE INDEX IF NOT EXISTS idx_point_events_player_time
ON point_events(game_id, player_id, created_at DESC);

-- Index for recent events only (partial index for performance)
CREATE INDEX IF NOT EXISTS idx_point_events_recent
ON point_events(created_at DESC)
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_point_events_cleanup
ON point_events(created_at);

-- Comment for documentation
COMMENT ON TABLE point_events IS 'Tracks point earnings for velocity calculation. Events older than 1 week are purged.';
COMMENT ON COLUMN point_events.delta IS 'Points earned (positive) or spent (negative)';
COMMENT ON COLUMN point_events.reason IS 'Source: star_earned, claim_cost, takeover_cost, bounty_bonus, etc.';
COMMENT ON COLUMN point_events.cartridge_id IS 'Which drill cartridge generated these points (for analytics)';
