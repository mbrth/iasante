
import React, { useState, useRef } from 'react';
import { analyzeMealCapture } from '../services/geminiService';
import { Pathology } from '../types';

export const MealsView: React.FC = () => {
  const [mealDescription, setMealDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [recentMeals, setRecentMeals] = useState<any[]>([
    { id: '1', name: 'Mediterranean Quinoa Salad', calories: 420, date: 'Today, 12:45 PM', score: 'Excellent for Heart', path: Pathology.DIABETES_T2 },
    { id: '2', name: 'Grilled Chicken with Asparagus', calories: 350, date: 'Today, 7:15 PM', score: 'Optimal for BP', path: Pathology.HYPERTENSION },
  ]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = async () => {
    if (!mealDescription && !selectedImage) return;
    setAnalyzing(true);
    try {
      // Extract pure base64 if image exists
      const base64 = selectedImage ? selectedImage.split(',')[1] : undefined;
      const result = await analyzeMealCapture(mealDescription || "Meal photo provided", base64);
      
      const newMeal = {
        id: Date.now().toString(),
        name: result.name || "Custom Meal",
        calories: result.calories || 0,
        date: 'Just now',
        score: result.summary ? result.summary.slice(0, 40) + '...' : 'Optimized',
        img: selectedImage || `https://picsum.photos/seed/${Date.now()}/64/64`
      };
      
      setRecentMeals([newMeal, ...recentMeals]);
      setMealDescription('');
      setSelectedImage(null);
    } catch (e) {
        console.error("Meal analysis failed", e);
    } finally {
        setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search / Capture Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            value={mealDescription}
            onChange={(e) => setMealDescription(e.target.value)}
            placeholder="Describe your meal or take a photo..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 font-medium placeholder:text-slate-400" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`p-3 rounded-2xl transition-all ${selectedImage ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageSelect} />
          
          <button 
              disabled={analyzing || (!mealDescription && !selectedImage)}
              onClick={handleCapture}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {analyzing ? (
              <div className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 Analyzing
              </div>
            ) : 'Log'}
          </button>
        </div>
        {selectedImage && (
          <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-indigo-100 animate-in zoom-in duration-200">
             <img src={selectedImage} className="w-full h-full object-cover" />
             <button 
               onClick={() => setSelectedImage(null)}
               className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black transition"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 px-4">Daily Logs</h3>
        <div className="grid grid-cols-1 gap-3">
          {recentMeals.map((meal) => (
            <div key={meal.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                  <img src={meal.img || `https://picsum.photos/seed/${meal.id}/128/128`} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{meal.name}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
                    <span className="text-indigo-600">{meal.calories} kcal</span>
                    <span>•</span>
                    <span>{meal.date}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right hidden sm:block">
                 <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-100">
                   {meal.score}
                 </span>
                 <div className="mt-2 text-indigo-600 hover:text-indigo-800 text-[10px] font-black uppercase tracking-widest cursor-pointer opacity-0 group-hover:opacity-100 transition">
                   Clinical Breakdown
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium CTA */}
      <div className="bg-indigo-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3">
               <h4 className="text-3xl font-black tracking-tight">Predictive Analytics</h4>
               <p className="text-indigo-200 max-w-md leading-relaxed">Our AI can predict glycemic responses up to 4 hours in advance based on your current nutritional trajectory.</p>
               <div className="flex gap-4 pt-2">
                  <div className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">Diabetes T2</div>
                  <div className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">Hypertension</div>
               </div>
            </div>
            <button className="bg-white text-indigo-900 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition shadow-xl active:scale-95">
               Unlock V2 Premium
            </button>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800/20 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>
    </div>
  );
};
