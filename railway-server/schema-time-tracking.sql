-- Time Tracking Tables for LSRL Driller
-- Run this in Supabase SQL editor to create the required tables

-- Session time tracking table
CREATE TABLE IF NOT EXISTS time_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  session_start TIMESTAMPTZ NOT NULL,
  active_time_ms BIGINT DEFAULT 0,
  total_time_ms BIGINT DEFAULT 0,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_time_sessions_username ON time_sessions(username);
CREATE INDEX IF NOT EXISTS idx_time_sessions_start ON time_sessions(session_start);

-- Problem time tracking table
CREATE TABLE IF NOT EXISTS time_problems (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  username TEXT NOT NULL,
  problem_id TEXT,
  cartridge_id TEXT,
  mode_id TEXT,
  active_time_ms BIGINT DEFAULT 0,
  total_time_ms BIGINT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  result JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_time_problems_username ON time_problems(username);
CREATE INDEX IF NOT EXISTS idx_time_problems_session ON time_problems(session_id);
CREATE INDEX IF NOT EXISTS idx_time_problems_completed_at ON time_problems(completed_at);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_problems ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (adjust as needed for production)
CREATE POLICY "Allow all operations on time_sessions" ON time_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on time_problems" ON time_problems FOR ALL USING (true);
