-- Grid Wars Schema v3: Contestation, Decay, Resource Nodes, Surge Events
-- Run this in Supabase SQL Editor after v2 schema is applied

-- ============================================
-- Extend grid_wars_territories for contestation and strength
-- ============================================
-- Strength for decay (isolated cells lose strength over time)
ALTER TABLE grid_wars_territories ADD COLUMN IF NOT EXISTS strength INTEGER DEFAULT 3;

-- Contestation tracking (who is contesting this cell)
ALTER TABLE grid_wars_territories ADD COLUMN IF NOT EXISTS contested_by TEXT REFERENCES users(username) ON DELETE SET NULL;
ALTER TABLE grid_wars_territories ADD COLUMN IF NOT EXISTS contested_since TIMESTAMPTZ;

-- Resource node type (amplifier, beacon, anchor, or null for regular cells)
ALTER TABLE grid_wars_territories ADD COLUMN IF NOT EXISTS node_type TEXT CHECK (node_type IN ('amplifier', 'beacon', 'anchor'));

-- ============================================
-- Extend grid_wars_players for buffs and activity tracking
-- ============================================
-- Track when player last answered a question (for active drilling bonus)
ALTER TABLE grid_wars_players ADD COLUMN IF NOT EXISTS last_answer_at TIMESTAMPTZ;

-- Active buffs stored as JSONB
-- Example: {"amplifier": {"remaining": 5}, "beacon": {"expires": "2026-01-08T17:00:00Z"}, "anchor": {"expires": "..."}}
ALTER TABLE grid_wars_players ADD COLUMN IF NOT EXISTS active_buffs JSONB DEFAULT '{}';

-- ============================================
-- Extend grid_wars_games for surge events
-- ============================================
-- Surge cell location and expiration
ALTER TABLE grid_wars_games ADD COLUMN IF NOT EXISTS surge_cell_x INTEGER CHECK (surge_cell_x >= 0 AND surge_cell_x < 20);
ALTER TABLE grid_wars_games ADD COLUMN IF NOT EXISTS surge_cell_y INTEGER CHECK (surge_cell_y >= 0 AND surge_cell_y < 20);
ALTER TABLE grid_wars_games ADD COLUMN IF NOT EXISTS surge_expires TIMESTAMPTZ;

-- ============================================
-- Index for contestation queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_gw_territories_contested ON grid_wars_territories(contested_by) WHERE contested_by IS NOT NULL;

-- Index for active drilling queries (recent answers)
CREATE INDEX IF NOT EXISTS idx_gw_players_last_answer ON grid_wars_players(last_answer_at) WHERE last_answer_at IS NOT NULL;

-- ============================================
-- Function to initialize resource nodes for a new game
-- Called once when creating a new game
-- ============================================
CREATE OR REPLACE FUNCTION init_resource_nodes(p_game_id TEXT)
RETURNS VOID AS $$
DECLARE
  node_positions INTEGER[][] := ARRAY[
    ARRAY[10, 10],  -- Center: Amplifier
    ARRAY[4, 4],    -- Top-left quadrant: Beacon
    ARRAY[15, 15]   -- Bottom-right quadrant: Anchor
  ];
  node_types TEXT[] := ARRAY['amplifier', 'beacon', 'anchor'];
  i INTEGER;
BEGIN
  FOR i IN 1..3 LOOP
    INSERT INTO grid_wars_territories (game_id, x, y, owner, node_type, strength)
    VALUES (p_game_id, node_positions[i][1], node_positions[i][2], NULL, node_types[i], 3)
    ON CONFLICT (game_id, x, y) DO UPDATE SET node_type = EXCLUDED.node_type;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- View for active contestations (helps with server tick queries)
-- ============================================
CREATE OR REPLACE VIEW grid_wars_active_contestations AS
SELECT
  t.game_id,
  t.x,
  t.y,
  t.owner,
  t.contested_by,
  t.contested_since,
  EXTRACT(EPOCH FROM (NOW() - t.contested_since)) AS seconds_contested,
  p_owner.health AS owner_health,
  p_contester.health AS contester_health,
  p_contester.position_x AS contester_x,
  p_contester.position_y AS contester_y
FROM grid_wars_territories t
JOIN grid_wars_players p_owner ON t.game_id = p_owner.game_id AND t.owner = p_owner.username
LEFT JOIN grid_wars_players p_contester ON t.game_id = p_contester.game_id AND t.contested_by = p_contester.username
WHERE t.contested_by IS NOT NULL;
