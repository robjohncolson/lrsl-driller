-- LSRL Trainer - Supabase Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  real_name TEXT,
  password TEXT NOT NULL,  -- plaintext ok for classroom pedagogy app
  user_type TEXT DEFAULT 'student' CHECK (user_type IN ('student', 'teacher')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LSRL PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lsrl_progress (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  scenario_topic TEXT NOT NULL,

  -- Scores (E=Essentially Correct, P=Partially Correct, I=Incorrect)
  slope_score TEXT CHECK (slope_score IN ('E', 'P', 'I')),
  intercept_score TEXT CHECK (intercept_score IN ('E', 'P', 'I')),
  correlation_score TEXT CHECK (correlation_score IN ('E', 'P', 'I')),

  -- Gamification
  hints_used INTEGER DEFAULT 0 CHECK (hints_used >= 0 AND hints_used <= 3),
  star_type TEXT CHECK (star_type IN ('gold', 'silver', 'bronze', 'tin') OR star_type IS NULL),
  all_correct BOOLEAN DEFAULT FALSE,

  -- Metadata
  grading_mode TEXT CHECK (grading_mode IN ('keywords', 'ai', 'both')),
  ai_provider TEXT CHECK (ai_provider IN ('gemini', 'groq') OR ai_provider IS NULL),

  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_progress_username ON lsrl_progress(username);
CREATE INDEX IF NOT EXISTS idx_progress_completed ON lsrl_progress(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_star ON lsrl_progress(star_type) WHERE star_type IS NOT NULL;

-- ============================================
-- USER SETTINGS TABLE (API key backup)
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  username TEXT PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
  gemini_key TEXT,
  groq_key TEXT,
  preferred_provider TEXT DEFAULT 'groq' CHECK (preferred_provider IN ('gemini', 'groq', 'none')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEADERBOARD VIEW
-- ============================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.username,
  u.real_name,
  COALESCE(SUM(CASE WHEN p.star_type = 'gold' THEN 1 ELSE 0 END), 0) AS gold,
  COALESCE(SUM(CASE WHEN p.star_type = 'silver' THEN 1 ELSE 0 END), 0) AS silver,
  COALESCE(SUM(CASE WHEN p.star_type = 'bronze' THEN 1 ELSE 0 END), 0) AS bronze,
  COALESCE(SUM(CASE WHEN p.star_type = 'tin' THEN 1 ELSE 0 END), 0) AS tin,
  COALESCE(
    SUM(CASE WHEN p.star_type = 'gold' THEN 4 ELSE 0 END) +
    SUM(CASE WHEN p.star_type = 'silver' THEN 3 ELSE 0 END) +
    SUM(CASE WHEN p.star_type = 'bronze' THEN 2 ELSE 0 END) +
    SUM(CASE WHEN p.star_type = 'tin' THEN 1 ELSE 0 END),
    0
  ) AS weighted_score,
  COUNT(p.id) AS total_attempts,
  COALESCE(SUM(CASE WHEN p.all_correct THEN 1 ELSE 0 END), 0) AS perfect_runs,
  MAX(p.completed_at) AS last_active
FROM users u
LEFT JOIN lsrl_progress p ON u.username = p.username
WHERE u.user_type = 'student'
GROUP BY u.username, u.real_name
ORDER BY weighted_score DESC, perfect_runs DESC;

-- ============================================
-- LEADERBOARD BY PERIOD FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION get_leaderboard(period TEXT DEFAULT 'all', limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  username TEXT,
  real_name TEXT,
  gold BIGINT,
  silver BIGINT,
  bronze BIGINT,
  tin BIGINT,
  weighted_score BIGINT,
  total_attempts BIGINT,
  perfect_runs BIGINT,
  last_active TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.username,
    u.real_name,
    COALESCE(SUM(CASE WHEN p.star_type = 'gold' THEN 1 ELSE 0 END), 0)::BIGINT AS gold,
    COALESCE(SUM(CASE WHEN p.star_type = 'silver' THEN 1 ELSE 0 END), 0)::BIGINT AS silver,
    COALESCE(SUM(CASE WHEN p.star_type = 'bronze' THEN 1 ELSE 0 END), 0)::BIGINT AS bronze,
    COALESCE(SUM(CASE WHEN p.star_type = 'tin' THEN 1 ELSE 0 END), 0)::BIGINT AS tin,
    COALESCE(
      SUM(CASE WHEN p.star_type = 'gold' THEN 4 ELSE 0 END) +
      SUM(CASE WHEN p.star_type = 'silver' THEN 3 ELSE 0 END) +
      SUM(CASE WHEN p.star_type = 'bronze' THEN 2 ELSE 0 END) +
      SUM(CASE WHEN p.star_type = 'tin' THEN 1 ELSE 0 END),
      0
    )::BIGINT AS weighted_score,
    COUNT(p.id)::BIGINT AS total_attempts,
    COALESCE(SUM(CASE WHEN p.all_correct THEN 1 ELSE 0 END), 0)::BIGINT AS perfect_runs,
    MAX(p.completed_at) AS last_active
  FROM users u
  LEFT JOIN lsrl_progress p ON u.username = p.username
    AND (
      CASE
        WHEN period = 'today' THEN p.completed_at >= CURRENT_DATE
        WHEN period = 'week' THEN p.completed_at >= CURRENT_DATE - INTERVAL '7 days'
        ELSE TRUE
      END
    )
  WHERE u.user_type = 'student'
  GROUP BY u.username, u.real_name
  ORDER BY weighted_score DESC, perfect_runs DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (Optional but recommended)
-- ============================================
-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lsrl_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to users (for dropdown list)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Allow public insert for new user registration
CREATE POLICY "Anyone can register" ON users
  FOR INSERT WITH CHECK (true);

-- Allow public read access to progress (for leaderboard)
CREATE POLICY "Progress is viewable by everyone" ON lsrl_progress
  FOR SELECT USING (true);

-- Allow public insert for progress (server will validate)
CREATE POLICY "Anyone can insert progress" ON lsrl_progress
  FOR INSERT WITH CHECK (true);

-- Settings are private - only the owner can read/write
-- (In practice, the Railway server handles auth, so we allow public access)
CREATE POLICY "Settings viewable by everyone" ON user_settings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert settings" ON user_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update settings" ON user_settings
  FOR UPDATE USING (true);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment to add test users:
/*
INSERT INTO users (username, real_name, password, user_type) VALUES
  ('Mango_Tiger', 'Test Student 1', 'test123', 'student'),
  ('Apple_Bear', 'Test Student 2', 'test123', 'student'),
  ('Kiwi_Wolf', 'Test Student 3', 'test123', 'student'),
  ('teacher', 'Mr. Smith', 'teacherpass', 'teacher')
ON CONFLICT (username) DO NOTHING;

INSERT INTO lsrl_progress (username, scenario_topic, slope_score, intercept_score, correlation_score, hints_used, star_type, all_correct, grading_mode) VALUES
  ('Mango_Tiger', 'Student Performance', 'E', 'E', 'E', 0, 'gold', true, 'both'),
  ('Mango_Tiger', 'Car Value', 'E', 'P', 'E', 1, NULL, false, 'both'),
  ('Apple_Bear', 'Sleep & Grades', 'E', 'E', 'E', 1, 'silver', true, 'keywords'),
  ('Kiwi_Wolf', 'Temperature & Sales', 'E', 'E', 'E', 2, 'bronze', true, 'both');
*/
