-- Grid Wars v2.0: Hierarchical Territory Subdivision
-- Run this migration in Supabase SQL Editor
--
-- This migration adds support for fractal subdivision where macro cells
-- can be "developed" into 8x8 subcell grids. Same renderer, different data.

-- =============================================================================
-- STEP 1: Add new columns for hierarchical addressing
-- =============================================================================

-- Chess-notation address: "d5" (level 0), "d5.c3" (level 1), "d5.c3.a1" (level 2)
ALTER TABLE grid_wars_territories
ADD COLUMN IF NOT EXISTS address VARCHAR(32);

-- Parent address (NULL for level 0 macro cells)
ALTER TABLE grid_wars_territories
ADD COLUMN IF NOT EXISTS parent_address VARCHAR(32);

-- Is this cell developed (subdivided into 8x8 subcells)?
ALTER TABLE grid_wars_territories
ADD COLUMN IF NOT EXISTS is_developed BOOLEAN DEFAULT FALSE;

-- =============================================================================
-- STEP 2: Rename 'level' to 'cell_level' for clarity (if exists)
-- =============================================================================

-- Note: The v1.6 migration added 'level' column. Rename for clarity.
-- This is idempotent - will fail silently if already renamed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'grid_wars_territories' AND column_name = 'level'
  ) THEN
    ALTER TABLE grid_wars_territories RENAME COLUMN level TO cell_level;
  END IF;
END $$;

-- Ensure cell_level exists (in case level didn't exist)
ALTER TABLE grid_wars_territories
ADD COLUMN IF NOT EXISTS cell_level INTEGER DEFAULT 0;

-- =============================================================================
-- STEP 3: Populate addresses for existing territories
-- =============================================================================

-- Convert x,y coordinates to chess notation for existing cells
-- a=0, b=1, c=2, d=3, e=4, f=5, g=6, h=7 (columns)
-- 1=0, 2=1, 3=2, 4=3, 5=4, 6=5, 7=6, 8=7 (rows, 0-indexed internally)
UPDATE grid_wars_territories
SET address = CHR(ASCII('a') + x) || (y + 1)::TEXT,
    cell_level = 0,
    parent_address = NULL,
    is_developed = FALSE
WHERE address IS NULL;

-- =============================================================================
-- STEP 4: Add indexes for hierarchical queries
-- =============================================================================

-- Index for address lookups (primary query pattern for state)
CREATE INDEX IF NOT EXISTS idx_territories_address
ON grid_wars_territories(game_id, address);

-- Index for parent lookups (finding all subcells of a parent)
CREATE INDEX IF NOT EXISTS idx_territories_parent
ON grid_wars_territories(game_id, parent_address)
WHERE parent_address IS NOT NULL;

-- Index for level filtering (finding all macro or all subcells)
CREATE INDEX IF NOT EXISTS idx_territories_cell_level
ON grid_wars_territories(game_id, cell_level);

-- Composite index for developed cells (zoom-in candidates)
CREATE INDEX IF NOT EXISTS idx_territories_developed
ON grid_wars_territories(game_id, is_developed)
WHERE is_developed = TRUE;

-- =============================================================================
-- STEP 5: Add comments for documentation
-- =============================================================================

COMMENT ON COLUMN grid_wars_territories.address IS
  'Chess notation address: "d5" (level 0), "d5.c3" (level 1), "d5.c3.a1" (level 2)';

COMMENT ON COLUMN grid_wars_territories.parent_address IS
  'Parent cell address (NULL for macro cells at level 0)';

COMMENT ON COLUMN grid_wars_territories.is_developed IS
  'True if cell has been subdivided into 8x8 subcells';

COMMENT ON COLUMN grid_wars_territories.cell_level IS
  'Hierarchy depth: 0=macro, 1=first subdivision, 2=second subdivision';

-- =============================================================================
-- NOTES
-- =============================================================================
--
-- This migration:
-- 1. Adds address column (chess notation like "d5.c3")
-- 2. Adds parent_address for hierarchy navigation
-- 3. Adds is_developed flag for subdivision state
-- 4. Renames 'level' to 'cell_level' for clarity
-- 5. Populates addresses for existing macro cells
-- 6. Adds indexes for efficient hierarchy queries
--
-- The primary key remains (game_id, x, y) for now. The address column
-- is used for hierarchy queries but x,y are local coordinates within
-- their parent context.
--
-- Example hierarchy:
--   Macro cell d5:      address="d5", parent_address=NULL, cell_level=0
--   Subcell d5.c3:      address="d5.c3", parent_address="d5", cell_level=1
--   Sub-subcell d5.c3.a1: address="d5.c3.a1", parent_address="d5.c3", cell_level=2
--
-- Center 4 cells (retained by owner on develop): d4, d5, e4, e5
-- Corner cell (given to attacker on drill): a1
