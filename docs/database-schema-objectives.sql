-- Migration: Objectifs quotidiens personnalisés
-- Exécute dans le SQL Editor Supabase

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calories_goal INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS water_goal_liters DECIMAL(3,1);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS steps_goal INTEGER;
