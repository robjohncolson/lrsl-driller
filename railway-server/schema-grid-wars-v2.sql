-- Grid Wars Schema v2: Contiguity Bonus + Class Goal
-- Run this in Supabase SQL Editor after deploying

-- Extend grid_wars_players for contiguity tracking
ALTER TABLE grid_wars_players ADD COLUMN IF NOT EXISTS largest_cluster INTEGER DEFAULT 0;

-- Extend grid_wars_games for class goal
ALTER TABLE grid_wars_games ADD COLUMN IF NOT EXISTS class_goal_target INTEGER DEFAULT 200;
ALTER TABLE grid_wars_games ADD COLUMN IF NOT EXISTS class_goal_current INTEGER DEFAULT 0;
