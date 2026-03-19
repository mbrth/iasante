-- Migration: Journal, Daily Summary et Gamification dans Supabase
-- Exécute ce fichier dans le SQL Editor Supabase

-- 1. Ajouter img_url aux repas (pour le journal)
ALTER TABLE meals ADD COLUMN IF NOT EXISTS img_url TEXT;

-- 2. Table résumé quotidien (1 ligne par user par jour)
CREATE TABLE IF NOT EXISTS daily_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  water_glasses INTEGER NOT NULL DEFAULT 0,
  water_per_glass INTEGER NOT NULL DEFAULT 250,
  calories INTEGER NOT NULL DEFAULT 0,
  steps INTEGER NOT NULL DEFAULT 0,
  glucose DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 3. Table gamification (1 ligne par user)
CREATE TABLE IF NOT EXISTS gamification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_current INTEGER NOT NULL DEFAULT 0,
  streak_best INTEGER NOT NULL DEFAULT 0,
  last_log_date DATE,
  badges TEXT[] DEFAULT '{}',
  meals_logged_today INTEGER NOT NULL DEFAULT 0,
  meals_date DATE,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access own daily summary" ON daily_summary;
CREATE POLICY "Users can only access own daily summary" ON daily_summary FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access own gamification" ON gamification;
CREATE POLICY "Users can only access own gamification" ON gamification FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_daily_summary_user_date ON daily_summary(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_user ON gamification(user_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_daily_summary_updated_at ON daily_summary;
CREATE TRIGGER update_daily_summary_updated_at
  BEFORE UPDATE ON daily_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gamification_updated_at ON gamification;
CREATE TRIGGER update_gamification_updated_at
  BEFORE UPDATE ON gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Permissions
GRANT SELECT, INSERT, UPDATE ON daily_summary TO authenticated;
GRANT SELECT, INSERT, UPDATE ON gamification TO authenticated;
