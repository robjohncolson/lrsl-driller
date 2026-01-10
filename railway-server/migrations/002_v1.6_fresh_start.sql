-- Grid Wars v1.6: The Bitcoin Refactor
-- Run this migration in Supabase SQL Editor

-- =============================================================================
-- STEP 1: Clear existing territories for fresh 8×8 start
-- =============================================================================

-- Delete all territories (fresh start)
DELETE FROM grid_wars_territories WHERE game_id = 'lynn-classroom-2026';

-- Reset player territory counts (keep points!)
UPDATE grid_wars_players
SET territories_count = 0,
    largest_cluster = 0,
    position_x = 4,  -- Center of 8×8
    position_y = 4
WHERE game_id = 'lynn-classroom-2026';

-- =============================================================================
-- STEP 2: Fractal subdivision groundwork (schema only, not active)
-- =============================================================================

-- Add level column for future subdivision (0 = macro, 1+ = subdivided)
ALTER TABLE grid_wars_territories
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0;

-- Add parent reference for subdivided cells
ALTER TABLE grid_wars_territories
ADD COLUMN IF NOT EXISTS parent_x INTEGER;

ALTER TABLE grid_wars_territories
ADD COLUMN IF NOT EXISTS parent_y INTEGER;

-- Index for level queries (future use)
CREATE INDEX IF NOT EXISTS idx_territories_level
ON grid_wars_territories(game_id, level);

-- =============================================================================
-- STEP 3: Add comments for documentation
-- =============================================================================

COMMENT ON COLUMN grid_wars_territories.level IS 'Fractal level: 0=macro cell, 1+=subdivided (v1.6 prep, not active)';
COMMENT ON COLUMN grid_wars_territories.parent_x IS 'Parent cell X coord if this is a subdivided cell (future use)';
COMMENT ON COLUMN grid_wars_territories.parent_y IS 'Parent cell Y coord if this is a subdivided cell (future use)';

-- =============================================================================
-- NOTES
-- =============================================================================
-- This migration:
-- 1. Clears all territory for fresh 8×8 start
-- 2. Preserves player points (lifetime_earned and action_points)
-- 3. Resets player positions to center of new 8×8 map
-- 4. Adds fractal schema columns for future subdivision feature
--
-- The actual map size (8×8 vs 25×25) is controlled by:
--   shared/gridwars.config.js: mapSize: 8
--
-- Fractal subdivision (v2.0 future):
-- - Level 0 cell (3, 5) can subdivide into Level 1 cells (3, 5, 0, 0) through (3, 5, 7, 7)
-- - Total addressable: 64 × 64 = 4,096 cells
-- - Not implementing now — just preparing schema
