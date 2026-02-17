
import React, { useState, useEffect } from 'react';
import { UserProfile, NutritionPlan } from '../types';
import { generateNutritionPlan } from '../services/geminiService';

export const NutritionPlanView: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const [plan, setPlan] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const result = await generateNutritionPlan(profile);
      setPlan(result);
    } catch (error) {
      console.error("Failed to generate plan", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('nutripath_plan');
    if (saved) {
      setPlan(JSON.parse(saved));
    } else {
      fetchPlan();
    }
  }, []);

  useEffect(() => {
    if (plan.length > 0) {
      localStorage.setItem('nutripath_plan', JSON.stringify(plan));
    }
  }, [plan]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">AI is crafting your medical nutrition plan...</p>
      </div>
    );
  }

  const currentDay = plan[selectedDayIndex];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Your Weekly Protocol</h2>
        <button 
          onClick={fetchPlan}
          className="px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
        >
          Regenerate Plan
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
            {p.day}
          </button>
        ))}
      </div>

      {currentDay && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentDay.meals.map((meal) => (
            <div key={meal.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition group">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded-full tracking-widest">
                  {meal.type}
                </span>
                <span className="text-slate-400 font-bold text-sm">{meal.calories} kcal</span>
              </div>
              
              <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition">{meal.name}</h4>
              <p className="text-slate-500 text-sm mb-6 flex-grow leading-relaxed">
                {meal.analysis || "Optimized for your health profile."}
              </p>

              <div className="pt-4 border-t border-slate-50 grid grid-cols-3 gap-2 text-center">
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Protein</p>
                   <p className="font-bold text-slate-700">{meal.protein}g</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Carbs</p>
                   <p className="font-bold text-slate-700">{meal.carbs}g</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Fats</p>
                   <p className="font-bold text-slate-700">{meal.fat}g</p>
                 </div>
              </div>
            </div>
          ))}
          
          <div className="bg-indigo-900 rounded-3xl p-6 text-white flex flex-col justify-center items-center text-center space-y-4">
             <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
             </div>
             <h4 className="font-bold text-xl">Daily Target</h4>
             <p className="text-3xl font-bold">{currentDay.totalCalories} kcal</p>
             <p className="text-indigo-200 text-sm">Perfectly balanced for your metabolic needs.</p>
          </div>
        </div>
      )}
    </div>
  );
};
