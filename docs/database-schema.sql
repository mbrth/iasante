-- SQL Script to initialize NutriPath AI Database
-- Run this in Supabase SQL Editor after creating your project

-- Create enum for pathologies
CREATE TYPE pathology_enum AS ENUM (
  'Diabetes Type 1',
  'Diabetes Type 2',
  'Hypertension',
  'Cardiovascular Disease',
  'Obesity',
  'Hypercholesterolemia',
  'Metabolic Syndrome'
);

-- Create enum for sex
CREATE TYPE sex_enum AS ENUM ('Male', 'Female', 'Other');

-- Create enum for meal type
CREATE TYPE meal_type_enum AS ENUM ('Breakfast', 'Lunch', 'Dinner', 'Snack');

-- User profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  age INTEGER NOT NULL,
  sex sex_enum NOT NULL,
  height DECIMAL(5,2) NOT NULL, -- in cm
  weight DECIMAL(5,2) NOT NULL, -- in kg
  bmi DECIMAL(4,2) NOT NULL,
  birth_date DATE, -- optional
  pathologies pathology_enum[],
  treatments TEXT[],
  allergies TEXT[],
  preferences TEXT[],
  goals TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If table already exists, run this to make birth_date optional:
-- ALTER TABLE profiles ALTER COLUMN birth_date DROP NOT NULL;

-- Health metrics table
CREATE TABLE health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  glucose DECIMAL(5,2), -- mg/dL
  systolic_bp INTEGER, -- mmHg
  diastolic_bp INTEGER, -- mmHg
  weight DECIMAL(5,2) NOT NULL, -- kg
  compliance_score DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Meals table
CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type meal_type_enum NOT NULL,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(5,2) NOT NULL, -- grams
  carbs DECIMAL(5,2) NOT NULL, -- grams
  fat DECIMAL(5,2) NOT NULL, -- grams
  sodium DECIMAL(5,2) NOT NULL, -- mg
  sugar DECIMAL(5,2) NOT NULL, -- grams
  analysis TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nutrition plans table
CREATE TABLE nutrition_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  meals JSONB NOT NULL, -- Array of meals
  total_calories INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - CRITICAL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can only access own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Health metrics: Users can only access their own health metrics
CREATE POLICY "Users can only access own health metrics" ON health_metrics
  FOR ALL USING (auth.uid() = user_id);

-- Meals: Users can only access their own meals
CREATE POLICY "Users can only access own meals" ON meals
  FOR ALL USING (auth.uid() = user_id);

-- Nutrition plans: Users can only access their own plans
CREATE POLICY "Users can only access own nutrition plans" ON nutrition_plans
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_health_metrics_user_date ON health_metrics(user_id, date DESC);
CREATE INDEX idx_meals_user_date ON meals(user_id, date DESC);
CREATE INDEX idx_nutrition_plans_user_day ON nutrition_plans(user_id, day DESC);

-- =====================================================
-- FUNCTION TO AUTOMATICALLY CREATE PROFILE ON SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, age, sex, height, weight, bmi)
  VALUES (
    NEW.id,
    0, -- Default values - user must update
    'Other',
    0,
    0,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNCTION TO UPDATE updated_at TIMESTAMP
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Allow authenticated users to select their own data
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON health_metrics TO authenticated;
GRANT SELECT ON meals TO authenticated;
GRANT SELECT ON nutrition_plans TO authenticated;

-- Allow authenticated users to insert/update their own data
GRANT INSERT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT INSERT ON health_metrics TO authenticated;
GRANT UPDATE ON health_metrics TO authenticated;
GRANT INSERT ON meals TO authenticated;
GRANT UPDATE ON meals TO authenticated;
GRANT DELETE ON meals TO authenticated;
GRANT INSERT ON nutrition_plans TO authenticated;
GRANT UPDATE ON nutrition_plans TO authenticated;

-- =====================================================
-- DONE! Your database is now configured with:
-- - All required tables
-- - Row Level Security (RLS) policies
-- - Performance indexes
-- - Automatic profile creation on signup
-- - Updated timestamp tracking
-- =====================================================
