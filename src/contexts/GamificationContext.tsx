import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  loadGamificationFromSupabase,
  saveGamificationToSupabase,
  loadPremiumFromSupabase,
  savePremiumToSupabase,
} from '../services/supabaseSyncService';
import {
  GamificationData,
  loadGamification,
  saveGamification,
  onMealLogged,
  canLogMeal,
  isPremium,
  setPremium,
  BADGES,
  getProgressToNextLevel,
} from '../services/gamificationService';

interface GamificationContextType {
  data: GamificationData;
  isPremium: boolean;
  canLogMeal: boolean;
  logMeal: () => { pointsEarned: number; newBadges: string[] } | null;
  refresh: () => void;
  upgradeToPremium: () => void;
  progressPercent: number;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<GamificationData>(loadGamification);
  const [premium, setPremiumState] = useState(isPremium);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (userId) {
      const remote = await loadGamificationFromSupabase(userId);
      if (remote) setData(remote);
      else setData(loadGamification()); // fallback localStorage ou défaut
      const p = await loadPremiumFromSupabase(userId);
      setPremiumState(p || isPremium());
    } else {
      setData(loadGamification());
      setPremiumState(isPremium());
    }
  }, [userId]);

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

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logMeal = useCallback((): { pointsEarned: number; newBadges: string[] } | null => {
    if (!canLogMeal(data)) return null;
    const result = onMealLogged(data);
    setData(result.data);
    if (userId) saveGamificationToSupabase(userId, result.data, premium).catch(console.error);
    return { pointsEarned: result.pointsEarned, newBadges: result.newBadges };
  }, [data, userId, premium]);

  const upgradeToPremium = useCallback(() => {
    setPremium(true);
    setPremiumState(true);
    setData(prev => {
      const next = {
        ...prev,
        badges: prev.badges.includes('premium') ? prev.badges : [...prev.badges, 'premium'],
      };
      if (userId) {
        savePremiumToSupabase(userId, true).catch(console.error);
        saveGamificationToSupabase(userId, next, true).catch(console.error);
      }
      return next;
    });
  }, [userId]);

  const progressPercent = getProgressToNextLevel(data.points);

  return (
    <GamificationContext.Provider
      value={{
        data,
        isPremium: premium,
        canLogMeal: canLogMeal(data),
        logMeal,
        refresh,
        upgradeToPremium,
        progressPercent,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
};

export { BADGES };
