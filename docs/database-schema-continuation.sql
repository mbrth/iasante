-- Suite du script : les types (pathology_enum, etc.) existent déjà
-- Copie ce fichier dans le SQL Editor Supabase et exécute-le

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  age INTEGER NOT NULL,
  sex sex_enum NOT NULL,
  height DECIMAL(5,2) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  bmi DECIMAL(4,2) NOT NULL,
  birth_date DATE,
  pathologies pathology_enum[],
  treatments TEXT[],
  allergies TEXT[],
  preferences TEXT[],
  goals TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health metrics table
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  glucose DECIMAL(5,2),
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  weight DECIMAL(5,2) NOT NULL,
  compliance_score DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type meal_type_enum NOT NULL,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(5,2) NOT NULL,
  carbs DECIMAL(5,2) NOT NULL,
  fat DECIMAL(5,2) NOT NULL,
  sodium DECIMAL(5,2) NOT NULL,
  sugar DECIMAL(5,2) NOT NULL,
  analysis TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nutrition plans table
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  meals JSONB NOT NULL,
  total_calories INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access own profile" ON profiles;
CREATE POLICY "Users can only access own profile" ON profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can only access own health metrics" ON health_metrics;
CREATE POLICY "Users can only access own health metrics" ON health_metrics FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access own meals" ON meals;
CREATE POLICY "Users can only access own meals" ON meals FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access own nutrition plans" ON nutrition_plans;
CREATE POLICY "Users can only access own nutrition plans" ON nutrition_plans FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON health_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_user_day ON nutrition_plans(user_id, day DESC);

-- Trigger pour créer le profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, age, sex, height, weight, bmi)
  VALUES (NEW.id, 0, 'Other', 0, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON health_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON nutrition_plans TO authenticated;
