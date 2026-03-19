
import React, { useState, useRef } from 'react';
import { analyzeMealCapture } from '../services/geminiService';
import { fetchProductByBarcode, scaleProduct } from '../services/openFoodFactsService';
import { useGamification } from '../contexts/GamificationContext';
import { useDailySummary } from '../contexts/DailySummaryContext';
import { PremiumUpgradeModal } from '../components/PremiumUpgradeModal';
import { useLanguage } from '../i18n/LanguageContext';

export const MealsView: React.FC = () => {
  const { t } = useLanguage();
  const { canLogMeal, logMeal, isPremium, data, upgradeToPremium } = useGamification();
  const { addJournalEntry, data: dailyData } = useDailySummary();
  const [mealDescription, setMealDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [pointsToast, setPointsToast] = useState(false);
  const [pendingMeal, setPendingMeal] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
    sugar: number;
    summary: string;
    img: string;
    portionGrams?: number;
    per100g?: { calories: number; protein: number; carbs: number; fat: number; sodium: number; sugar: number };
  } | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


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
    if (!canLogMeal) {
      setShowPremiumModal(true);
      return;
    }
    setAnalyzing(true);
    try {
      const base64 = selectedImage ? selectedImage.split(',')[1] : undefined;
      const result = await analyzeMealCapture(mealDescription || "Meal photo provided", base64);

      setPendingMeal({
        name: result.name || "Custom Meal",
        calories: Number(result.calories) || 0,
        protein: Number(result.protein) || 0,
        carbs: Number(result.carbs) || 0,
        fat: Number(result.fat) || 0,
        sodium: Number(result.sodium) || 0,
        sugar: Number(result.sugar) || 0,
        summary: result.summary || "Optimized for your health profile.",
        img: selectedImage || `https://picsum.photos/seed/${Date.now()}/128/128`,
      });
      setMealDescription('');
      setSelectedImage(null);
    } catch (e) {
      console.error("Meal analysis failed", e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleValidateMeal = () => {
    if (!pendingMeal) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const entry = {
      id: Date.now().toString(),
      name: pendingMeal.name,
      calories: pendingMeal.calories,
      protein: pendingMeal.protein,
      carbs: pendingMeal.carbs,
      fat: pendingMeal.fat,
      sodium: pendingMeal.sodium,
      sugar: pendingMeal.sugar,
      date: timeStr,
      score: pendingMeal.summary.slice(0, 40) + (pendingMeal.summary.length > 40 ? '...' : ''),
      img: pendingMeal.img,
    };
    addJournalEntry(entry);
    setPendingMeal(null);
    const gamificationResult = logMeal();
    if (gamificationResult?.pointsEarned) {
      setPointsToast(true);
      setTimeout(() => setPointsToast(false), 2000);
    }
  };

  const handleCancelMeal = () => {
    setPendingMeal(null);
  };

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim() || !canLogMeal) {
      if (!canLogMeal) setShowPremiumModal(true);
      return;
    }
    setBarcodeError(null);
    setBarcodeLoading(true);
    try {
      const product = await fetchProductByBarcode(barcodeInput.trim());
      if (!product) {
        setBarcodeError(t('barcodeNotFound'));
        return;
      }
      const scaled = scaleProduct(product, 100);
      const gradeLabel = product.grade ? `Nutri-Score: ${product.grade.toUpperCase()}` : 'Données Open Food Facts';
      setPendingMeal({
        name: scaled.name,
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
        sodium: scaled.sodium,
        sugar: scaled.sugar,
        summary: gradeLabel,
        img: scaled.img || `https://images.openfoodfacts.org/images/icons/dist/openfoodfacts-logo-en.svg`,
        portionGrams: 100,
        per100g: product.per100g,
      });
      setBarcodeInput('');
    } catch (e) {
      console.error('Barcode fetch failed', e);
      setBarcodeError(t('barcodeNotFound'));
    } finally {
      setBarcodeLoading(false);
    }
  };

  const updatePortion = (grams: number) => {
    if (!pendingMeal?.per100g || grams <= 0) return;
    const ratio = grams / 100;
    setPendingMeal({
      ...pendingMeal,
      portionGrams: grams,
      calories: Math.round(pendingMeal.per100g.calories * ratio),
      protein: Math.round(pendingMeal.per100g.protein * ratio * 10) / 10,
      carbs: Math.round(pendingMeal.per100g.carbs * ratio * 10) / 10,
      fat: Math.round(pendingMeal.per100g.fat * ratio * 10) / 10,
      sodium: Math.round(pendingMeal.per100g.sodium * ratio),
      sugar: Math.round(pendingMeal.per100g.sugar * ratio * 10) / 10,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Meals limit indicator (free users) */}
      {!isPremium && (
        <div className="flex items-center justify-between px-4 py-3 bg-amber-50 rounded-2xl border border-amber-100">
          <span className="text-sm font-medium text-amber-800">
            {data.mealsLoggedToday}/3 {t('freeMealsToday')}
          </span>
          <button onClick={() => setShowPremiumModal(true)} className="text-amber-600 font-bold text-sm hover:underline">
            👑 Premium
          </button>
        </div>
      )}

      {pointsToast && (
        <div className="fixed top-4 right-4 z-40 px-6 py-3 bg-brand-primary text-white rounded-2xl font-black shadow-lg animate-bounce">
          {t('pointsEarned')}
        </div>
      )}

      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => { upgradeToPremium(); setShowPremiumModal(false); }}
        reason={!canLogMeal ? 'meals_limit' : 'feature'}
      />

      {/* Modal de validation du repas */}
      {pendingMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 space-y-6">
              <h3 className="text-xl font-black text-slate-800">{t('validateMealTitle')}</h3>
              <p className="text-slate-500 text-sm">{t('validateMealSubtitle')}</p>

              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-100 shrink-0">
                  <img src={pendingMeal.img} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('mealName')}</label>
                    <input
                      type="text"
                      value={pendingMeal.name}
                      onChange={(e) => setPendingMeal({ ...pendingMeal, name: e.target.value })}
                      className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('calories')} (kcal)</label>
                    <input
                      type="number"
                      value={pendingMeal.calories}
                      onChange={(e) => setPendingMeal({ ...pendingMeal, calories: Number(e.target.value) || 0 })}
                      className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {pendingMeal.per100g && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('portionGrams')}</label>
                  <input
                    type="number"
                    value={pendingMeal.portionGrams ?? 100}
                    onChange={(e) => updatePortion(Math.max(1, Number(e.target.value) || 100))}
                    className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white outline-none font-bold text-slate-800"
                  />
                </div>
              )}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-600 font-medium">{pendingMeal.summary}</p>
                <div className="flex gap-4 mt-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span>P: {pendingMeal.protein}g</span>
                  <span>G: {pendingMeal.carbs}g</span>
                  <span>L: {pendingMeal.fat}g</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelMeal}
                  className="flex-1 py-4 rounded-2xl font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleValidateMeal}
                  className="flex-1 py-4 rounded-2xl font-black bg-brand-primary text-white hover:bg-brand-primary/90 transition shadow-lg"
                >
                  {t('validateAndAdd')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search / Capture Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4">
        {/* Scan code-barres */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <input
            value={barcodeInput}
            onChange={(e) => { setBarcodeInput(e.target.value); setBarcodeError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()}
            placeholder={t('barcodePlaceholder')}
            className="flex-1 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-300 outline-none"
          />
          <button
            onClick={handleBarcodeSearch}
            disabled={barcodeLoading || !barcodeInput.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {barcodeLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ...
              </span>
            ) : (
              t('barcodeSearch')
            )}
          </button>
        </div>
        {barcodeError && (
          <p className="text-sm text-red-600 font-medium -mt-2">{barcodeError}</p>
        )}

        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            value={mealDescription}
            onChange={(e) => setMealDescription(e.target.value)}
            placeholder={t('describeMeal')}
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
                {t('analyzing')}
              </div>
            ) : t('analyze')}
          </button>
        </div>
        {selectedImage && (
          <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-indigo-100">
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
        <h3 className="font-bold text-slate-800 px-4">{t('dailyLogs')}</h3>
        <div className="grid grid-cols-1 gap-3">
          {dailyData.journalEntries.map((meal) => (
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
          <button
            onClick={() => setShowPremiumModal(true)}
            className="bg-white text-indigo-900 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition shadow-xl active:scale-95"
          >
            {isPremium ? '✓ Premium' : 'Unlock Premium'}
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800/20 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>
    </div>
  );
};
