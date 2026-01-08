-- Add weighted points columns to lsrl_progress
-- Run this in Supabase SQL Editor

-- Add level_multiplier column (0.5 to 5.0 based on level position)
ALTER TABLE lsrl_progress
ADD COLUMN IF NOT EXISTS level_multiplier DECIMAL(3,2) DEFAULT 1.0;

-- Add weighted_points column (star_base_points * level_multiplier)
ALTER TABLE lsrl_progress
ADD COLUMN IF NOT EXISTS weighted_points DECIMAL(5,2) DEFAULT 0;

-- Create index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_lsrl_progress_weighted
ON lsrl_progress(username, weighted_points);

-- Backfill existing records with simple points (no multiplier data available)
-- Gold=4, Silver=3, Bronze=2, Tin=1
UPDATE lsrl_progress
SET weighted_points = CASE star_type
  WHEN 'gold' THEN 4.0
  WHEN 'silver' THEN 3.0
  WHEN 'bronze' THEN 2.0
  WHEN 'tin' THEN 1.0
  ELSE 0
END,
level_multiplier = 1.0
WHERE weighted_points = 0 OR weighted_points IS NULL;
