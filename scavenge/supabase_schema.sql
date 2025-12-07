-- Supabase Schema for AP Statistics Consensus Quiz
-- Run this in your Supabase SQL Editor (new dev project)
-- This matches the production schema + adds the new users table

-- ========================================
-- HELPER FUNCTION (must create first)
-- ========================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ANSWERS TABLE (matches production exactly)
-- ========================================
CREATE TABLE IF NOT EXISTS public.answers (
  id SERIAL NOT NULL,
  username TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer_value TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT answers_pkey PRIMARY KEY (username, question_id),
  CONSTRAINT answers_username_question_id_key UNIQUE (username, question_id)
);

-- Indexes (matches production)
CREATE INDEX IF NOT EXISTS idx_answers_username ON public.answers USING btree (username);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers USING btree (question_id);
CREATE INDEX IF NOT EXISTS idx_answers_timestamp ON public.answers USING btree ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_answers_updated_at_id ON public.answers USING btree (updated_at, id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_answers_updated ON answers;
CREATE TRIGGER on_answers_updated
  BEFORE UPDATE ON answers
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ========================================
-- USERS TABLE (NEW - for user management)
-- ========================================
CREATE TABLE IF NOT EXISTS public.users (
  username TEXT PRIMARY KEY,           -- Fruit_Animal format (e.g., "grape_fox")
  real_name TEXT NOT NULL,             -- Student's actual name (e.g., "Karolynn")
  password TEXT,                       -- Simple password (null until set)
  user_type TEXT DEFAULT 'student',    -- 'student' or 'teacher'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_real_name ON users(real_name);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Trigger for users updated_at
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow all access (pedagogy app, minimal security)
DROP POLICY IF EXISTS "Allow all access to answers" ON answers;
CREATE POLICY "Allow all access to answers" ON answers
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to users" ON users;
CREATE POLICY "Allow all access to users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- REALTIME SUBSCRIPTIONS
-- ========================================
-- Note: Run these separately if they fail (table might already be in publication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE answers;
-- ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ========================================
-- INITIAL USERS DATA (from student2username.csv)
-- Maps real names to Fruit_Animal usernames
-- ========================================
INSERT INTO users (username, real_name, user_type) VALUES
-- From your CSV roster
('grape_fox', 'Karolynn', 'student'),
('kiwi_panda', 'Edwin', 'student'),
('banana_goat', 'Tommy', 'student'),
('grape_koala', 'Chanlita', 'student'),
('cherry_monkey', 'Kyle', 'student'),
('apple_monkey', 'Edgar', 'student'),
('papaya_eagle', 'Ana', 'student'),
('apricot_horse', 'Justin', 'student'),
('mango_panda', 'Janelle', 'student'),
('apple_rabbit', 'Hazel', 'student'),
('guava_cat', 'Gabriella', 'student'),
('plum_iguana', 'Malinda', 'student'),
('papaya_goat', 'Jeysac', 'student'),
('grape_newt', 'Chanlita', 'student'),
('mango_dog', 'Sheyly', 'student'),
('berry_iguana', 'Valeria', 'student'),
('lemon_goat', 'Francois', 'student'),
('apricot_fox', 'Keily', 'student'),
('apricot_dog', 'Julissa', 'student'),
('guava_wolf', 'Ian', 'student'),
('lemon_eagle', 'Ghafour', 'student'),
('papaya_iguana', 'Ashley W', 'student'),
('papaya_fox', 'Ashley Z', 'student'),
('coconut_cat', 'Moshammed', 'student'),
('mango_tiger', 'London', 'student'),
('banana_fox', 'Julissa B', 'student'),
-- Additional usernames found in production data (need real names)
('bilberry_lemur', 'Student', 'student'),
('cherry_lemon', 'Student', 'student'),
('coconut_serval', 'Student', 'student'),
('honeydew_crocodile', 'Student', 'student'),
('kiwi_monkey', 'Student', 'student'),
('lemon_monkey', 'Student', 'student'),
('lime_lion', 'Student', 'student'),
('papaya_cat', 'Student', 'student'),
('tayberry_pelican', 'Student', 'student'),
-- Teacher account
('teacher_man', 'Teacher', 'teacher')
ON CONFLICT (username) DO UPDATE SET
  real_name = EXCLUDED.real_name,
  updated_at = NOW();
