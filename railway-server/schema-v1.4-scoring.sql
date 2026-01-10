-- Grid Wars v1.4: Add cartridge/mode tracking to lsrl_progress
-- This enables future recomputation of weighted scores
-- Run this in Supabase SQL Editor

-- Add cartridge_id column (which cartridge the star was earned in)
ALTER TABLE lsrl_progress
ADD COLUMN IF NOT EXISTS cartridge_id TEXT;

-- Add mode_id column (which level/mode within the cartridge)
ALTER TABLE lsrl_progress
ADD COLUMN IF NOT EXISTS mode_id TEXT;

-- Add level_index column (0-based position of level in cartridge)
ALTER TABLE lsrl_progress
ADD COLUMN IF NOT EXISTS level_index INTEGER;

-- Add total_levels column (how many levels in the cartridge at time of earning)
ALTER TABLE lsrl_progress
ADD COLUMN IF NOT EXISTS total_levels INTEGER;

-- Create index for efficient cartridge-based queries
CREATE INDEX IF NOT EXISTS idx_lsrl_progress_cartridge
ON lsrl_progress(cartridge_id, mode_id);

-- Note: Existing records will have NULL for these columns (grandfathered)
-- New records going forward will have proper cartridge/level data
