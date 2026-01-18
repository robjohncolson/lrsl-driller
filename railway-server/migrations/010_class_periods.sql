-- Migration 010: Class Period Support for Teacher Roster Management
-- Allows teachers to organize students by class periods (A-G)

-- Add class_period column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS class_period VARCHAR(1)
  CHECK (class_period IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', NULL));

-- Index for filtering by period
CREATE INDEX IF NOT EXISTS idx_users_class_period ON users(class_period);

-- Comments
COMMENT ON COLUMN users.class_period IS 'Class period assignment (A-G), NULL for unassigned students';
