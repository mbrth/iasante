
export enum Pathology {
  DIABETES_T1 = 'Diabetes Type 1',
  DIABETES_T2 = 'Diabetes Type 2',
  HYPERTENSION = 'Hypertension',
  CARDIOVASCULAR = 'Cardiovascular Disease',
  OBESITY = 'Obesity',
  HYPERCHOLESTEROLEMIA = 'Hypercholesterolemia',
  METABOLIC_SYNDROME = 'Metabolic Syndrome'
}

/** Objectifs quotidiens personnalisés */
export interface DailyObjectives {
  caloriesGoal?: number;   // kcal
  waterGoalLiters?: number; // L
  stepsGoal?: number;     // pas
}

export interface UserProfile {
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  height: number;
  weight: number;
  bmi: number;
  birthDate: string; // Format: YYYY-MM-DD
  pathologies: Pathology[];
  treatments: string[];
  allergies: string[];
  preferences: string[];
  goals: string[];
  dailyObjectives?: DailyObjectives;
}

export interface HealthMetrics {
  date: string;
  glucose?: number;
  systolicBP?: number;
  diastolicBP?: number;
  weight: number;
  complianceScore: number;
}

export interface Meal {
  id: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  sugar: number;
  analysis?: string;
}

export interface NutritionPlan {
  day: string;
  meals: Meal[];
  totalCalories: number;
}
