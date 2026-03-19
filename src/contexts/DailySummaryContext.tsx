import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import {
  loadDailySummaryFromSupabase,
  saveDailySummaryToSupabase,
  loadJournalFromSupabase,
  insertJournalEntryToSupabase,
} from '../services/supabaseSyncService';

const STORAGE_KEY = 'nutripath_daily_summary';

export interface ValidatedMeal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  sugar: number;
}

/** Entrée du journal (repas validé) - affichage + nutrition */
export interface JournalEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  sugar: number;
  date: string;
  score?: string;
  img?: string;
}

export interface DailySummaryData {
  date: string;
  waterGlasses: number;
  waterPerGlass: number;
  calories: number;
  steps: number;
  glucose: number | null;
  validatedMeals: ValidatedMeal[];
  journalEntries: JournalEntry[];
}

const getToday = () => new Date().toISOString().slice(0, 10);

const loadDailySummary = (): DailySummaryData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefault();
    const data = JSON.parse(raw) as Partial<DailySummaryData>;
    if (data.date !== getToday()) return getDefault();
    return { ...getDefault(), ...data, validatedMeals: data.validatedMeals ?? [], journalEntries: data.journalEntries ?? [] };
  } catch {
    return getDefault();
  }
};

const getDefault = (): DailySummaryData => ({
  date: getToday(),
  waterGlasses: 0,
  waterPerGlass: 250,
  calories: 0,
  steps: 0,
  glucose: null,
  validatedMeals: [],
  journalEntries: [],
});

const saveDailySummary = (data: DailySummaryData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

interface DailySummaryContextType {
  data: DailySummaryData;
  addWaterGlass: () => void;
  addCalories: (amount: number) => void;
  addMeal: (meal: ValidatedMeal) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  addSteps: (amount: number) => void;
  setGlucose: (value: number | null) => void;
  setWaterPerGlass: (ml: number) => void;
  waterLiters: number;
}

const DailySummaryContext = createContext<DailySummaryContextType | null>(null);

export const DailySummaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DailySummaryData>(loadDailySummary);
  const [userId, setUserId] = useState<string | null>(null);

  // Auth: récupérer l'utilisateur connecté
  useEffect(() => {
    if (!supabase?.auth) return;
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setUserId(sessionData?.session?.user?.id ?? null);
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Charger depuis Supabase si connecté, sinon localStorage
  useEffect(() => {
    if (!userId) {
      setData(loadDailySummary());
      return;
    }
    const load = async () => {
      const remote = await loadDailySummaryFromSupabase(userId);
      if (remote) setData(remote);
      else setData(loadDailySummary());
    };
    load();
  }, [userId]);

  // Sauvegarder : Supabase si connecté + localStorage en cache
  useEffect(() => {
    saveDailySummary(data);
    if (userId && isSupabaseConfigured()) {
      saveDailySummaryToSupabase(userId, data);
    }
  }, [data, userId]);

  const addWaterGlass = useCallback(() => {
    setData(prev => {
      if (prev.date !== getToday()) return { ...getDefault(), waterGlasses: 1, waterPerGlass: prev.waterPerGlass };
      return { ...prev, waterGlasses: prev.waterGlasses + 1 };
    });
  }, []);

  const addCalories = useCallback((amount: number) => {
    setData(prev => {
      if (prev.date !== getToday()) return { ...getDefault(), calories: amount };
      return { ...prev, calories: prev.calories + amount };
    });
  }, []);

  const addMeal = useCallback((meal: ValidatedMeal) => {
    setData(prev => {
      if (prev.date !== getToday()) return { ...getDefault(), calories: meal.calories, validatedMeals: [meal], journalEntries: [] };
      return {
        ...prev,
        calories: prev.calories + meal.calories,
        validatedMeals: [...prev.validatedMeals, meal],
      };
    });
  }, []);

  const addJournalEntry = useCallback((entry: JournalEntry) => {
    setData(prev => {
      const nutrition: ValidatedMeal = {
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        sodium: entry.sodium,
        sugar: entry.sugar,
      };
      if (prev.date !== getToday()) {
        return {
          ...getDefault(),
          calories: entry.calories,
          validatedMeals: [nutrition],
          journalEntries: [entry],
        };
      }
      return {
        ...prev,
        calories: prev.calories + entry.calories,
        validatedMeals: [...prev.validatedMeals, nutrition],
        journalEntries: [entry, ...prev.journalEntries],
      };
    });
    // Sync vers Supabase (meals) si connecté
    if (userId && isSupabaseConfigured()) {
      insertJournalEntryToSupabase(userId, entry).catch(console.error);
    }
  }, [userId]);

  const addSteps = useCallback((amount: number) => {
    setData(prev => {
      if (prev.date !== getToday()) return { ...getDefault(), steps: amount };
      return { ...prev, steps: prev.steps + amount };
    });
  }, []);

  const setGlucose = useCallback((value: number | null) => {
    setData(prev => {
      if (prev.date !== getToday()) return { ...getDefault(), glucose: value };
      return { ...prev, glucose: value };
    });
  }, []);

  const setWaterPerGlass = useCallback((ml: number) => {
    setData(prev => ({ ...prev, waterPerGlass: ml }));
  }, []);

  const waterLiters = (data.waterGlasses * data.waterPerGlass) / 1000;

  return (
    <DailySummaryContext.Provider
      value={{
        data,
        addWaterGlass,
        addCalories,
        addMeal,
        addJournalEntry,
        addSteps,
        setGlucose,
        setWaterPerGlass,
        waterLiters,
      }}
    >
      {children}
    </DailySummaryContext.Provider>
  );
};

export const useDailySummary = () => {
  const ctx = useContext(DailySummaryContext);
  if (!ctx) throw new Error('useDailySummary must be used within DailySummaryProvider');
  return ctx;
};
