-- Avatar System Migration
-- Adds avatar display format, position, and health to players
-- Adds health to territories

-- Add avatar and position columns to players
ALTER TABLE grid_wars_players
ADD COLUMN IF NOT EXISTS avatar_format TEXT DEFAULT 'A' CHECK (avatar_format IN ('A', 'B'));

ALTER TABLE grid_wars_players
ADD COLUMN IF NOT EXISTS position_x INT DEFAULT 10;

ALTER TABLE grid_wars_players
ADD COLUMN IF NOT EXISTS position_y INT DEFAULT 10;

ALTER TABLE grid_wars_players
ADD COLUMN IF NOT EXISTS health INT DEFAULT 100;

-- Add health to territories
ALTER TABLE grid_wars_territories
ADD COLUMN IF NOT EXISTS health INT DEFAULT 100;

-- Create index for quick position lookups
CREATE INDEX IF NOT EXISTS idx_gw_players_position
ON grid_wars_players(game_id, position_x, position_y);

-- Function to get spawn position (far from others, away from edges)
-- This is a helper for the server to call
CREATE OR REPLACE FUNCTION get_spawn_position(p_game_id TEXT, p_map_size INT DEFAULT 20)
RETURNS TABLE(spawn_x INT, spawn_y INT) AS $$
DECLARE
  margin INT := 3;  -- Stay 3 cells from edges
  best_x INT;
  best_y INT;
  best_distance FLOAT := 0;
  test_x INT;
  test_y INT;
  min_dist FLOAT;
  dist FLOAT;
  player RECORD;
BEGIN
  -- Try to find the position farthest from all existing players
  FOR test_x IN margin..(p_map_size - margin - 1) LOOP
    FOR test_y IN margin..(p_map_size - margin - 1) LOOP
      -- Calculate minimum distance to any existing player
      min_dist := 999999;

      FOR player IN
        SELECT position_x, position_y
        FROM grid_wars_players
        WHERE game_id = p_game_id AND position_x IS NOT NULL
      LOOP
        dist := sqrt(power(test_x - player.position_x, 2) + power(test_y - player.position_y, 2));
        IF dist < min_dist THEN
          min_dist := dist;
        END IF;
      END LOOP;

      -- If no players exist, min_dist stays at 999999 (good)
      -- If this position is better than our best, use it
      IF min_dist > best_distance THEN
        best_distance := min_dist;
        best_x := test_x;
        best_y := test_y;
      END IF;
    END LOOP;
  END LOOP;

  -- If no position found (shouldn't happen), use center
  IF best_x IS NULL THEN
    best_x := p_map_size / 2;
    best_y := p_map_size / 2;
  END IF;

  spawn_x := best_x;
  spawn_y := best_y;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
