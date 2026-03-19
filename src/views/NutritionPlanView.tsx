
import React, { useState, useEffect } from 'react';
import { UserProfile, NutritionPlan } from '../types';
import { generateNutritionPlan } from '../services/geminiService';
import { getCurrentWeekPlans, saveFullNutritionPlan } from '../services/nutritionPlansService';
import { kMeansClustering } from '../services/mlService';
import { useLanguage } from '../i18n/LanguageContext';
import { useDailySummary } from '../contexts/DailySummaryContext';
import { useGamification } from '../contexts/GamificationContext';
import { PremiumUpgradeModal } from '../components/PremiumUpgradeModal';

export const NutritionPlanView: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const { t, locale } = useLanguage();
  const { addJournalEntry } = useDailySummary();
  const { canLogMeal, logMeal, upgradeToPremium } = useGamification();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [plan, setPlan] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const fetchPlan = async (isRegeneration = false) => {
    setLoading(true);
    try {
      // If not regeneration, try loading from DB first
      if (!isRegeneration) {
        const existingPlans = await getCurrentWeekPlans();
        if (existingPlans && existingPlans.length > 0) {
          // Sort plans by day number if they are named "Day X"
          const sorted = [...existingPlans].sort((a, b) => {
            const numA = parseInt(a.day.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.day.replace(/\D/g, '')) || 0;
            return numA - numB;
          });
          setPlan(sorted);
          setLoading(false);
          return;
        }
      }

      // Generate new plan (in user's language)
      const result = await generateNutritionPlan(profile, locale);
      setPlan(result);
      
      // Persist to Supabase
      await saveFullNutritionPlan(result);
    } catch (error) {
      console.error("Failed to handle nutrition plan", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan(false);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">{t('aiCraftingPlan')}</p>
      </div>
    );
  }

  const currentDay = plan[selectedDayIndex];

  // ML LOGIC: Cluster all meals across the 7 days to find nutritional "Personas"
  const allMeals = plan.flatMap(d => d.meals);
  const clusters = allMeals.length >= 3 ? kMeansClustering(allMeals, 3) : [];
  
  // Helper to find which persona a meal belongs to
  const getMealPersona = (mealId: string) => {
    const clusterIdx = clusters.findIndex(c => c.meals.some(m => m.id === mealId));
    if (clusterIdx === -1) return null;

    // Identify persona based on centroid features [calories, protein, carbs, fat]
    const centroid = clusters[clusterIdx].centroid;
    const proteinWeight = centroid[1];
    const calorieWeight = centroid[0];

    if (proteinWeight > 0.4) return { label: 'Protéiné', color: 'bg-orange-100 text-orange-600', icon: '🍗' };
    if (calorieWeight > 0.5) return { label: 'Énergétique', color: 'bg-yellow-100 text-yellow-600', icon: '⚡' };
    return { label: 'Léger & Sain', color: 'bg-teal-100 text-teal-600', icon: '🥗' };
  };

  return (
    <div className="space-y-6">
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => { upgradeToPremium(); setShowPremiumModal(false); }}
        reason={!canLogMeal ? 'meals_limit' : 'feature'}
      />
      <div className="flex justify-between items-center">
        <div className="space-y-1">
           <h2 className="text-xl font-bold text-slate-800">{t('yourWeeklyProtocol')}</h2>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
              Analysé par K-Means Clustering (ML Engine)
           </p>
        </div>
        <button 
          onClick={() => fetchPlan(true)}
          className="px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
        >
          {t('regeneratePlan')}
        </button>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {plan.map((p, idx) => (
          <button
            key={p.day}
            onClick={() => setSelectedDayIndex(idx)}
            className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
              selectedDayIndex === idx 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'bg-white text-slate-500 border border-slate-100 hover:border-indigo-300'
            }`}
          >
            {p.day.includes('-') ? `${t('dayLabel')} ${idx + 1}` : p.day}
          </button>
        ))}
      </div>

      {currentDay && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentDay.meals.map((meal) => {
            const persona = getMealPersona(meal.id);
            return (
              <div key={meal.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition group overflow-hidden relative">
                {persona && (
                  <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest ${persona.color} flex items-center gap-1.5`}>
                     <span>{persona.icon}</span>
                     <span>{persona.label}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded-full tracking-widest">
                    {t(meal.type)}
                  </span>
                  <span className="text-slate-400 font-bold text-sm">{meal.calories} kcal</span>
                </div>
                
                <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition">{meal.name}</h4>
                <p className="text-slate-500 text-sm mb-6 flex-grow leading-relaxed">
                  {meal.analysis || t('optimizedForProfile')}
                </p>

                <div className="pt-4 border-t border-slate-50 grid grid-cols-3 gap-2 text-center">
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase">{t('protein')}</p>
                     <p className="font-bold text-slate-700">{meal.protein}g</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase">{t('carbs')}</p>
                     <p className="font-bold text-slate-700">{meal.carbs}g</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase">{t('fats')}</p>
                     <p className="font-bold text-slate-700">{meal.fat}g</p>
                   </div>
                </div>

                <button
                  onClick={() => {
                    if (!canLogMeal) {
                      setShowPremiumModal(true);
                      return;
                    }
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
                    addJournalEntry({
                      id: `${meal.id}-${Date.now()}`,
                      name: meal.name,
                      calories: meal.calories,
                      protein: meal.protein,
                      carbs: meal.carbs,
                      fat: meal.fat,
                      sodium: meal.sodium ?? 0,
                      sugar: meal.sugar ?? 0,
                      date: timeStr,
                      score: meal.analysis,
                    });
                    logMeal();
                  }}
                  className="mt-4 w-full py-3 rounded-xl bg-brand-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-primary/90 transition"
                >
                  {t('addToJournal')}
                </button>
              </div>
            );
          })}
          
          <div className="bg-indigo-900 rounded-3xl p-6 text-white flex flex-col justify-center items-center text-center space-y-4">
             <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
             </div>
             <h4 className="font-bold text-xl">{t('dailyTarget')}</h4>
             <p className="text-3xl font-bold">{currentDay.totalCalories} kcal</p>
             <p className="text-indigo-200 text-sm">{t('perfectlyBalanced')}</p>
          </div>
        </div>
      )}
    </div>
  );
};
