/**
 * Gamification: points, levels, streaks, badges
 * Free: 3 meals/day, basic badges
 * Premium: unlimited, exclusive badges
 */

const STORAGE_KEY = 'nutripath_gamification';
const PREMIUM_KEY = 'nutripath_premium';

export interface GamificationData {
  points: number;
  level: number;
  streakCurrent: number;
  streakBest: number;
  lastLogDate: string; // YYYY-MM-DD
  badges: string[];
  mealsLoggedToday: number;
  mealsDate: string;
}

const POINTS_PER_MEAL = 10;
const POINTS_PERFECT_WEEK = 50;
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000];

export const BADGES = {
  // Free badges
  DEBUTANT: { id: 'debutant', name: 'Débutant', desc: 'Premier repas enregistré', icon: '🌱', premium: false },
  ENGAGE: { id: 'engage', name: 'Engagé', desc: '10 repas enregistrés', icon: '📝', premium: false },
  STREAK_3: { id: 'streak_3', name: 'Régulier', desc: '3 jours consécutifs', icon: '🔥', premium: false },
  STREAK_7: { id: 'streak_7', name: 'Champion', desc: '7 jours consécutifs', icon: '⭐', premium: false },
  LEVEL_5: { id: 'level_5', name: 'Expert', desc: 'Niveau 5 atteint', icon: '🏆', premium: false },
  // Premium badges
  EQUILIBRE: { id: 'equilibre', name: 'Équilibre parfait', desc: 'Semaine parfaite', icon: '💎', premium: true },
  PREMIUM: { id: 'premium', name: 'Premium', desc: 'Membre Premium', icon: '👑', premium: true },
} as const;

export const getDefaultData = (): GamificationData => ({
  points: 0,
  level: 1,
  streakCurrent: 0,
  streakBest: 0,
  lastLogDate: '',
  badges: [],
  mealsLoggedToday: 0,
  mealsDate: '',
});

export const loadGamification = (): GamificationData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const data = JSON.parse(raw) as GamificationData;
    const today = new Date().toISOString().slice(0, 10);
    if (data.mealsDate !== today) {
      data.mealsLoggedToday = 0;
      data.mealsDate = today;
    }
    return data;
  } catch {
    return getDefaultData();
  }
};

export const saveGamification = (data: GamificationData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getLevel = (points: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

export const getPointsForNextLevel = (points: number): number => {
  for (const thresh of LEVEL_THRESHOLDS) {
    if (points < thresh) return thresh;
  }
  return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
};

export const getProgressToNextLevel = (points: number): number => {
  const current = getPointsForNextLevel(points) - 100;
  const next = getPointsForNextLevel(points);
  const currentLevelStart = LEVEL_THRESHOLDS[getLevel(points) - 2] || 0;
  const range = next - currentLevelStart;
  const progress = points - currentLevelStart;
  return Math.min(100, (progress / range) * 100);
};

export const isPremium = (): boolean => {
  return localStorage.getItem(PREMIUM_KEY) === 'true';
};

export const setPremium = (value: boolean) => {
  localStorage.setItem(PREMIUM_KEY, value ? 'true' : 'false');
};

export const FREE_MEALS_PER_DAY = 3;

export const canLogMeal = (data: GamificationData): boolean => {
  if (isPremium()) return true;
  return data.mealsLoggedToday < FREE_MEALS_PER_DAY;
};

export const onMealLogged = (data: GamificationData): { data: GamificationData; pointsEarned: number; newBadges: string[] } => {
  const today = new Date().toISOString().slice(0, 10);
  const newData = { ...data };

  if (newData.mealsDate !== today) {
    newData.mealsLoggedToday = 0;
    newData.mealsDate = today;
    // Check streak
    if (newData.lastLogDate) {
      const last = new Date(newData.lastLogDate);
      const now = new Date(today);
      const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newData.streakCurrent = (newData.streakCurrent || 0) + 1;
      } else if (diffDays > 1) {
        newData.streakCurrent = 1;
      }
    } else {
      newData.streakCurrent = 1;
    }
    newData.lastLogDate = today;
  }

  newData.mealsLoggedToday = (newData.mealsLoggedToday || 0) + 1;
  newData.points = (newData.points || 0) + POINTS_PER_MEAL;
  newData.level = getLevel(newData.points);

  if (newData.streakCurrent > (newData.streakBest || 0)) {
    newData.streakBest = newData.streakCurrent;
  }

  const newBadges: string[] = [];
  if (!newData.badges.includes('debutant') && newData.points >= 10) {
    newBadges.push('debutant');
    newData.badges = [...(newData.badges || []), 'debutant'];
  }
  if (!newData.badges.includes('engage') && newData.points >= 100) {
    newBadges.push('engage');
    newData.badges = [...newData.badges, 'engage'];
  }
  if (!newData.badges.includes('streak_3') && newData.streakCurrent >= 3) {
    newBadges.push('streak_3');
    newData.badges = [...newData.badges, 'streak_3'];
  }
  if (!newData.badges.includes('streak_7') && newData.streakCurrent >= 7) {
    newBadges.push('streak_7');
    newData.badges = [...newData.badges, 'streak_7'];
  }
  if (!newData.badges.includes('level_5') && newData.level >= 5) {
    newBadges.push('level_5');
    newData.badges = [...newData.badges, 'level_5'];
  }
  if (isPremium() && !newData.badges.includes('premium')) {
    newBadges.push('premium');
    newData.badges = [...newData.badges, 'premium'];
  }

  saveGamification(newData);
  return { data: newData, pointsEarned: POINTS_PER_MEAL, newBadges };
};
