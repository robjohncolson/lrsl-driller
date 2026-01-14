-- Migration 008: Teacher-configurable progression overrides
-- Allows teachers to adjust gold star requirements per level per cartridge

-- Table to store teacher progression overrides
CREATE TABLE IF NOT EXISTS progression_overrides (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(100) NOT NULL DEFAULT 'default',
  cartridge_id VARCHAR(100) NOT NULL,
  mode_id VARCHAR(100) NOT NULL,
  gold_required INTEGER NOT NULL CHECK (gold_required >= 1 AND gold_required <= 10),
  updated_by VARCHAR(100),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, cartridge_id, mode_id)
);

-- Index for efficient lookups by game and cartridge
CREATE INDEX IF NOT EXISTS idx_progression_overrides_lookup
ON progression_overrides(game_id, cartridge_id);

-- Comment for documentation
COMMENT ON TABLE progression_overrides IS 'Teacher-configurable gold star requirements per level. Overrides manifest defaults.';
COMMENT ON COLUMN progression_overrides.game_id IS 'Game session ID (default for global)';
COMMENT ON COLUMN progression_overrides.cartridge_id IS 'Cartridge identifier (e.g., adding-subtracting-polynomials)';
COMMENT ON COLUMN progression_overrides.mode_id IS 'Level/mode identifier within the cartridge';
COMMENT ON COLUMN progression_overrides.gold_required IS 'Number of gold stars required to unlock the next level (1-10)';
COMMENT ON COLUMN progression_overrides.updated_by IS 'Username of teacher who last modified this override';
