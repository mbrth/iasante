/**
 * Synchronisation Supabase : journal, résumé quotidien, gamification
 * Fallback sur localStorage si non connecté ou Supabase non configuré
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { DailySummaryData, JournalEntry } from '../contexts/DailySummaryContext';
import type { GamificationData } from './gamificationService';

const getToday = () => new Date().toISOString().slice(0, 10);

// --- Daily Summary ---

export const loadDailySummaryFromSupabase = async (userId: string): Promise<DailySummaryData | null> => {
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('daily_summary')
    .select('*')
    .eq('user_id', userId)
    .eq('date', getToday())
    .single();
  if (error || !data) return null;
  const journal = await loadJournalFromSupabase(userId);
  const validatedMeals = (journal ?? []).map(m => ({
    calories: m.calories,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
    sodium: m.sodium,
    sugar: m.sugar,
  }));
  const calories = validatedMeals.reduce((s, m) => s + m.calories, 0);
  return {
    date: data.date,
    waterGlasses: data.water_glasses ?? 0,
    waterPerGlass: data.water_per_glass ?? 250,
    calories,
    steps: data.steps ?? 0,
    glucose: data.glucose != null ? Number(data.glucose) : null,
    validatedMeals,
    journalEntries: journal ?? [],
  };
};

export const saveDailySummaryToSupabase = async (userId: string, data: DailySummaryData): Promise<boolean> => {
  if (!supabase || !isSupabaseConfigured()) return false;
  const { error } = await supabase.from('daily_summary').upsert({
    user_id: userId,
    date: data.date,
    water_glasses: data.waterGlasses,
    water_per_glass: data.waterPerGlass,
    calories: data.calories,
    steps: data.steps,
    glucose: data.glucose,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,date' });
  return !error;
};

// --- Journal (meals) ---

export const loadJournalFromSupabase = async (userId: string): Promise<JournalEntry[]> => {
  if (!supabase || !isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .eq('date', getToday())
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(m => ({
    id: m.id,
    name: m.name,
    calories: m.calories,
    protein: Number(m.protein),
    carbs: Number(m.carbs),
    fat: Number(m.fat),
    sodium: Number(m.sodium),
    sugar: Number(m.sugar),
    date: new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    score: m.analysis ?? undefined,
    img: m.img_url ?? undefined,
  }));
};

export const insertJournalEntryToSupabase = async (userId: string, entry: JournalEntry): Promise<string | null> => {
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('meals').insert({
    user_id: userId,
    type: 'Lunch',
    name: entry.name,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    sodium: entry.sodium,
    sugar: entry.sugar,
    analysis: entry.score ?? null,
    date: getToday(),
    img_url: entry.img ?? null,
  }).select('id').single();
  if (error || !data) return null;
  return data.id;
};

// --- Gamification ---

export const loadGamificationFromSupabase = async (userId: string): Promise<GamificationData | null> => {
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('gamification')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  const today = getToday();
  let mealsLoggedToday = data.meals_logged_today ?? 0;
  let mealsDate = data.meals_date ?? '';
  if (data.meals_date !== today) {
    mealsLoggedToday = 0;
    mealsDate = today;
  }
  return {
    points: data.points ?? 0,
    level: data.level ?? 1,
    streakCurrent: data.streak_current ?? 0,
    streakBest: data.streak_best ?? 0,
    lastLogDate: data.last_log_date ?? '',
    badges: data.badges ?? [],
    mealsLoggedToday,
    mealsDate,
  };
};

export const saveGamificationToSupabase = async (userId: string, data: GamificationData, isPremiumUser?: boolean): Promise<boolean> => {
  if (!supabase || !isSupabaseConfigured()) return false;
  const isPremium = isPremiumUser ?? false;
  const { error } = await supabase.from('gamification').upsert({
    user_id: userId,
    points: data.points,
    level: data.level,
    streak_current: data.streakCurrent,
    streak_best: data.streakBest,
    last_log_date: data.lastLogDate || null,
    badges: data.badges,
    meals_logged_today: data.mealsLoggedToday,
    meals_date: data.mealsDate || null,
    is_premium: isPremium,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  return !error;
};

export const loadPremiumFromSupabase = async (userId: string): Promise<boolean> => {
  if (!supabase || !isSupabaseConfigured()) return false;
  const { data } = await supabase.from('gamification').select('is_premium').eq('user_id', userId).single();
  return data?.is_premium ?? false;
};

export const savePremiumToSupabase = async (userId: string, isPremium: boolean): Promise<boolean> => {
  if (!supabase || !isSupabaseConfigured()) return false;
  const { error } = await supabase.from('gamification').upsert({
    user_id: userId,
    is_premium: isPremium,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  return !error;
};
