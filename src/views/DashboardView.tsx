import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, HealthMetrics } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { analyzeHealthRisk } from '../services/geminiService';
import { generateMedicalReport } from '../services/pdfService';
import { predictWeightTrend, calculateHealthRiskScore, RiskAssessment, predictMetricTrend, calculateMetabolicStability, generateHealthAlerts, calculateNutritionScore, calculateCardiovascularRisk } from '../services/mlService';
import { Pathology } from '../types';
import { useDailySummary } from '../contexts/DailySummaryContext';
import { useLanguage } from '../i18n/LanguageContext';

/** Build metrics from user profile when no real history exists */
const buildProfileMetrics = (profile: UserProfile, dailyGlucose: number | null): HealthMetrics[] => {
  const w = profile?.weight ?? 70;
  const g = dailyGlucose ?? 100;
  const bp = 120;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      glucose: g,
      systolicBP: bp,
      weight: w,
      complianceScore: 90,
    };
  });
};

type MetricType = 'glucose' | 'systolicBP' | 'weight';

interface DashboardViewProps {
  profile: UserProfile;
  isNewUser?: boolean;
  onDismissNewUser?: () => void;
  onUpdateProfile?: (profile: UserProfile) => void;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class DashboardErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard Crash:", error, errorInfo);
  }

  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="p-20 text-center space-y-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-black text-slate-800">Désolé, une erreur d'affichage est survenue.</h2>
          <p className="text-slate-500 font-medium">Nous travaillons à rétablir le tableau de bord. Essayez de recharger la page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-10 py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition shadow-lg active:scale-95"
          >
            Recharger la page
          </button>
        </div>
      );
    }
    return children;
  }
}

export const Dashboard: React.FC<DashboardViewProps> = ({ profile, isNewUser, onDismissNewUser, onUpdateProfile }) => {
  const { t } = useLanguage();
  const { data: dailyData, addWaterGlass, addSteps, waterLiters, waterPerGlass, setWaterPerGlass } = useDailySummary();
  const profileMetrics = useMemo(
    () => buildProfileMetrics(profile, dailyData.glucose),
    [profile?.weight, profile?.age, dailyData.glucose]
  );
  const [stepsInput, setStepsInput] = useState('');
  const [showAppleWatchHelp, setShowAppleWatchHelp] = useState(false);
  const [riskData, setRiskData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<MetricType>('glucose');
  const [mlInsights, setMlInsights] = useState<{
    weightPrediction: any,
    deterministicRisk: RiskAssessment | null,
    nutritionAnalysis: any,
    metabolicStability: number,
    cvRisk: number,
    alerts: any[]
  }>({
    weightPrediction: null,
    deterministicRisk: null,
    nutritionAnalysis: null,
    metabolicStability: 0,
    cvRisk: 0,
    alerts: []
  });
  const [predictionDistance, setPredictionDistance] = useState<number>(7);
  const [timeframe, setTimeframe] = useState<'min' | 'hour' | 'day'>('day');

  const [showClinicalModal, setShowClinicalModal] = useState(false);
  const [treatmentInput, setTreatmentInput] = useState('');
  const [allergyInput, setAllergyInput] = useState('');

  const metricConfig = {
    glucose: { label: 'Glucose', color: '#2ECC71', unit: 'mg/dL' },
    systolicBP: { label: 'Tension', color: '#FF7675', unit: 'mmHg' },
    weight: { label: 'Poids', color: '#34495E', unit: 'kg' }
  };

  useEffect(() => {
    if (isNewUser) setShowClinicalModal(true);
  }, [isNewUser]);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        // AI Analysis (Gemini)
        const result = await analyzeHealthRisk(profile, profileMetrics);
        setRiskData(result);

        const latestMetric = profileMetrics[profileMetrics.length - 1];
        const weightPred = predictWeightTrend(profileMetrics, predictionDistance);
        const deterministicRisk = calculateHealthRiskScore(profile, latestMetric);
        const metabolicStability = calculateMetabolicStability(profileMetrics);
        const alerts = generateHealthAlerts(latestMetric, profile);
        const cvRisk = calculateCardiovascularRisk(profile, latestMetric);

        // Nutrition score from validated meals only
        const todayMeals = dailyData.validatedMeals.map(m => ({
          id: '', type: 'Lunch' as const, name: '', analysis: '',
          ...m
        }));
        const nutritionAnalysis = calculateNutritionScore(todayMeals);

        setMlInsights({
          weightPrediction: weightPred,
          deterministicRisk,
          nutritionAnalysis,
          metabolicStability,
          cvRisk,
          alerts
        });
      } catch (e) {
        console.error("Analysis failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRisk();
  }, [profile, predictionDistance, profileMetrics, dailyData.validatedMeals]);

  const chartData = useMemo(() => {
    // 1. Generate core data based on timeframe
    let baseData: any[] = [];
    const now = new Date();

    if (timeframe === 'min') {
      // Last 30 minutes, every minute
      baseData = Array.from({ length: 30 }).map((_, i) => {
        const d = new Date(now.getTime() - (29 - i) * 60000);
        return {
          date: `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`,
          glucose: 90 + Math.random() * 20,
          systolicBP: 115 + Math.random() * 10,
          weight: profile.weight + (Math.random() - 0.5) * 0.2,
          complianceScore: 80 + Math.random() * 20
        };
      });
    } else if (timeframe === 'hour') {
      // Last 24 hours
      baseData = Array.from({ length: 24 }).map((_, i) => {
        const d = new Date(now.getTime() - (23 - i) * 3600000);
        return {
          date: `${d.getHours()}h`,
          glucose: 95 + Math.random() * 30,
          systolicBP: 120 + Math.random() * 15,
          weight: profile.weight + (Math.random() - 0.5) * 0.5,
          complianceScore: 75 + Math.random() * 25
        };
      });
    } else {
      // Jours (données profil)
      baseData = [...profileMetrics];
    }

    // 2. Calculate prediction for the active metric
    const prediction = predictMetricTrend(baseData, activeMetric, predictionDistance);

    // 3. Add predicted points
    const lastPoint = baseData[baseData.length - 1];
    const finalData = [...baseData];

    const step = (prediction.predicted - lastPoint[activeMetric]) / predictionDistance;

    for (let i = 1; i <= predictionDistance; i++) {
      let dateStr = "";
      if (timeframe === 'min') {
        const d = new Date(now.getTime() + i * 60000);
        dateStr = `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
      } else if (timeframe === 'hour') {
        const d = new Date(now.getTime() + i * 3600000);
        dateStr = `${d.getHours()}h`;
      } else {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
      }

      const prevVal = i === 1 ? lastPoint[activeMetric] : (finalData[finalData.length - 1] as any).isPredicted ? (finalData[finalData.length - 1] as any)[activeMetric] : lastPoint[activeMetric];

      finalData.push({
        date: dateStr,
        [activeMetric]: Number((prevVal + step).toFixed(1)),
        isPredicted: true,
        displayValue: Number((prevVal + step).toFixed(1)) // For tooltip
      } as any);
    }

    // Final mapping for two-series visualization
    const results = finalData.map((d, i) => {
      try {
        return {
          ...d,
          realValue: d.isPredicted ? (i > 0 && finalData[i - 1] && !finalData[i - 1].isPredicted ? (d[activeMetric] ?? null) : null) : (d[activeMetric] ?? null),
          predictedValue: d.isPredicted || (i < finalData.length - 1 && finalData[i + 1] && finalData[i + 1].isPredicted) ? (d[activeMetric] ?? null) : null
        };
      } catch (e) {
        console.error("[Dashboard] Error mapping chart data point:", e, d);
        return { ...d, realValue: null, predictedValue: null };
      }
    });

    // Defensive check to ensure we always return a valid array for Recharts
    if (!results || results.length === 0) return [{ date: '', realValue: 0, predictedValue: 0 }];
    if (!results[0] || results[0].realValue === undefined) return [{ date: '', realValue: 0, predictedValue: 0 }];
    
    return results;
  }, [timeframe, activeMetric, predictionDistance, profile?.weight, profileMetrics]);

  const handleSaveClinicalInfo = () => {
    const treatments = treatmentInput.split(',').map(t => t.trim()).filter(t => t !== '');
    const allergies = allergyInput.split(',').map(a => a.trim()).filter(a => a !== '');

    const updatedProfile = {
      ...profile,
      treatments: Array.from(new Set([...profile.treatments, ...treatments])),
      allergies: Array.from(new Set([...profile.allergies, ...allergies]))
    };

    if (onUpdateProfile) onUpdateProfile(updatedProfile);
    setShowClinicalModal(false);
    if (onDismissNewUser) onDismissNewUser();
  };

  const handleExportFullReport = () => {
    const savedPlan = localStorage.getItem('nutripath_plan');
    const plan = savedPlan ? JSON.parse(savedPlan) : null;
    generateMedicalReport(profile, profileMetrics, plan, riskData, mlInsights);
  };

const healthScore = mlInsights?.deterministicRisk?.score || 85;
const strokeDashoffset = useMemo(() => {
  const scoreFactor = typeof healthScore === 'number' ? healthScore : 85;
  // healthScore is risk (higher is worse), we show 100 - healthScore (health)
  const displayScore = Math.max(0, Math.min(100, 100 - scoreFactor));
  return 628 - (628 * displayScore) / 100;
}, [healthScore]);

return (
  <DashboardErrorBoundary>
    <div className="space-y-8 pb-12">

      {/* Modal Clinique */}
      {showClinicalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-secondary/70 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 space-y-8 border border-slate-100">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-brand-primary/20">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-brand-secondary tracking-tight">Paramétrage Thérapeutique</h3>
              <p className="text-slate-500 text-sm font-medium">Synchronisez vos traitements pour une précision IA maximale.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Médicaments Actuels</label>
                <input value={treatmentInput} onChange={e => setTreatmentInput(e.target.value)} className="w-full px-6 py-4 rounded-xl bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white transition-all outline-none font-bold text-slate-700" placeholder="ex: Metformine, Lisinopril..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Allergies Médicales</label>
                <input value={allergyInput} onChange={e => setAllergyInput(e.target.value)} className="w-full px-6 py-4 rounded-xl bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white transition-all outline-none font-bold text-slate-700" placeholder="ex: Pénicilline, Gluten..." />
              </div>
            </div>

            <button onClick={handleSaveClinicalInfo} className="w-full bg-brand-accent text-white font-black py-5 rounded-xl shadow-xl shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all uppercase tracking-widest text-xs active:scale-95">Valider le Dossier</button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Poids', value: profile?.weight?.toString() || '-', unit: 'kg' },
          { label: 'IMC', value: profile?.bmi?.toFixed(1) || '-', unit: '' },
          { label: 'Âge', value: profile?.age?.toString() || '-', unit: 'ans' },
          { label: 'Taille', value: profile?.height?.toString() || '-', unit: 'cm' },
          { label: 'Né(e)', value: profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString('fr-FR') : '-', unit: '' },
        ].map((m, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-500 group">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1 group-hover:text-brand-primary transition-colors">{m.label}</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black text-brand-secondary tracking-tighter`}>{m.value}</span>
              {m.unit && <span className="text-slate-400 font-bold text-[10px] uppercase">{m.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* 1️⃣ INFORMATIONS CRITIQUES (Score, Alertes, Résumé) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Score Santé & Résilience */}
        <div className="lg:col-span-4 bg-gradient-to-br from-brand-secondary to-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group min-h-[460px] flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-center">
              <span className="text-brand-primary text-[10px] font-black uppercase tracking-[0.4em]">Score de Santé</span>
              <div className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-[8px] font-black uppercase">Temps Réel</div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative">
                <svg className="w-56 h-56 transform -rotate-90">
                  <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                  <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={628} strokeDashoffset={isNaN(strokeDashoffset) ? 628 : strokeDashoffset} strokeLinecap="round" className="text-brand-primary transition-all duration-[2000ms]" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-7xl font-black tracking-tighter">{isLoading ? '--' : Math.max(0, 100 - (mlInsights?.deterministicRisk?.score || 0))}</span>
                  <span className="text-white/40 text-[10px] font-bold uppercase">/ 100</span>
                </div>
              </div>
              <p className="mt-6 text-xl font-bold tracking-tight text-center">
                État métabolique : <span className="text-brand-primary">
                  {isLoading ? 'Chargement...' :
                    (mlInsights?.deterministicRisk?.score || 0) < 20 ? 'Excellent' :
                      (mlInsights?.deterministicRisk?.score || 0) < 50 ? 'Stable' : 'À surveiller'}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] text-white/60 leading-relaxed text-center italic">
                "{mlInsights?.deterministicRisk?.description || 'Analyse en cours...'}"
              </p>
              <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                Voir les détails du score
              </button>
            </div>
          </div>
        </div>

        {/* Alertes & Résumé du jour */}
        <div className="lg:col-span-8 space-y-8">

          {/* Section Alertes Santé */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <h3 className="text-lg font-black text-brand-secondary tracking-tight">Alertes Santé Importantes</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mlInsights?.alerts && mlInsights.alerts.length > 0 ? mlInsights.alerts.map((alert, i) => (
                <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl border ${alert?.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
                  alert?.type === 'warning' ? 'bg-orange-50 border-orange-100 text-orange-700' :
                    'bg-green-50 border-green-100 text-green-700'
                  }`}>
                  <span className="text-xl">{alert?.type === 'error' ? '🔴' : alert?.type === 'warning' ? '🟡' : '🟢'}</span>
                  <p className="text-sm font-bold">{alert?.message || 'Alerte sans message'}</p>
                </div>
              )) : <p className="text-slate-400 text-sm col-span-2">Aucune alerte</p>}
            </div>
          </div>

          {/* Résumé du Jour */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
            <h3 className="text-lg font-black text-brand-secondary tracking-tight mb-8">{t('dailySummary')}</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Glycémie - vide si non renseignée */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('avgGlucose')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-brand-secondary">
                    {dailyData.glucose != null ? dailyData.glucose : '--'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">mg/dL</span>
                </div>
              </div>

              {/* Hydratation - avec bouton +1 verre + barre objectif */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('hydration')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-brand-secondary">
                    {dailyData.waterGlasses > 0 ? waterLiters.toFixed(1) : '--'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">L</span>
                  {profile.dailyObjectives?.waterGoalLiters != null && (
                    <span className="text-[9px] text-slate-400">/ {profile.dailyObjectives.waterGoalLiters}</span>
                  )}
                </div>
                {profile.dailyObjectives?.waterGoalLiters != null && (
                  <div className="mt-2">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (waterLiters / profile.dailyObjectives!.waterGoalLiters!) * 100)}%` }}
                      />
                    </div>
                    {waterLiters >= (profile.dailyObjectives?.waterGoalLiters ?? 0) && (
                      <p className="text-[9px] font-bold text-green-600 mt-1">✓ {t('goalReached')}</p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={addWaterGlass}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold hover:bg-blue-100 transition"
                  >
                    +1 {t('glass')}
                  </button>
                  <select
                    value={waterPerGlass}
                    onChange={(e) => setWaterPerGlass(Number(e.target.value))}
                    className="text-[9px] font-bold text-slate-500 bg-slate-50 rounded-lg px-2 py-1 border border-slate-100"
                  >
                    <option value={200}>200 ml</option>
                    <option value={250}>250 ml</option>
                    <option value={300}>300 ml</option>
                    <option value={330}>330 ml</option>
                  </select>
                </div>
              </div>

              {/* Calories - depuis repas validés + barre objectif */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('calories')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-brand-secondary">
                    {dailyData.calories > 0 ? dailyData.calories : '--'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">kcal</span>
                  {profile.dailyObjectives?.caloriesGoal != null && (
                    <span className="text-[9px] text-slate-400">/ {profile.dailyObjectives.caloriesGoal}</span>
                  )}
                </div>
                {profile.dailyObjectives?.caloriesGoal != null && (
                  <div className="mt-2">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (dailyData.calories / profile.dailyObjectives!.caloriesGoal!) * 100)}%` }}
                      />
                    </div>
                    {dailyData.calories >= (profile.dailyObjectives?.caloriesGoal ?? 0) && (
                      <p className="text-[9px] font-bold text-green-600 mt-1">✓ {t('goalReached')}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Activité / Pas + barre objectif */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('activity')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-brand-secondary">
                    {dailyData.steps > 0 ? dailyData.steps.toLocaleString() : '--'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">{t('steps')}</span>
                  {profile.dailyObjectives?.stepsGoal != null && (
                    <span className="text-[9px] text-slate-400">/ {profile.dailyObjectives.stepsGoal.toLocaleString()}</span>
                  )}
                </div>
                {profile.dailyObjectives?.stepsGoal != null && (
                  <div className="mt-2">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (dailyData.steps / profile.dailyObjectives!.stepsGoal!) * 100)}%` }}
                      />
                    </div>
                    {dailyData.steps >= (profile.dailyObjectives?.stepsGoal ?? 0) && (
                      <p className="text-[9px] font-bold text-green-600 mt-1">✓ {t('goalReached')}</p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <input
                    type="number"
                    placeholder="+ pas"
                    value={stepsInput}
                    onChange={(e) => setStepsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(stepsInput, 10);
                        if (!isNaN(val) && val > 0) {
                          addSteps(val);
                          setStepsInput('');
                        }
                      }
                    }}
                    className="w-20 px-2 py-1.5 text-[10px] font-bold rounded-lg bg-slate-50 border border-slate-100"
                  />
                  <button
                    onClick={() => {
                      const val = parseInt(stepsInput, 10);
                      if (!isNaN(val) && val > 0) {
                        addSteps(val);
                        setStepsInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-green-50 text-green-600 rounded-xl text-[10px] font-bold hover:bg-green-100 transition"
                  >
                    {t('add')}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        const val = parseInt(text.replace(/\D/g, ''), 10);
                        if (!isNaN(val) && val > 0) {
                          addSteps(val);
                        }
                      } catch {
                        setShowAppleWatchHelp(true);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-200 transition"
                    title={t('pasteFromAppleWatch')}
                  >
                    {t('pasteFromAppleWatch')}
                  </button>
                  <button
                    onClick={() => setShowAppleWatchHelp(true)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
                    title={t('appleWatchHelp')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                </div>
                {showAppleWatchHelp && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAppleWatchHelp(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
                      <h3 className="text-lg font-black text-slate-800">{t('appleWatchHelpTitle')}</h3>
                      <p className="text-sm text-slate-600">{t('appleWatchHelpDesc')}</p>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
                        <li>{t('appleWatchStep1')}</li>
                        <li>{t('appleWatchStep2')}</li>
                        <li>{t('appleWatchStep3')}</li>
                        <li>{t('appleWatchStep4')}</li>
                        <li>{t('appleWatchStep5')}</li>
                      </ol>
                      <button onClick={() => setShowAppleWatchHelp(false)} className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold">
                        {t('close')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {!profile.dailyObjectives?.caloriesGoal && !profile.dailyObjectives?.waterGoalLiters && !profile.dailyObjectives?.stepsGoal && (
              <p className="mt-6 text-xs text-slate-400 italic">{t('setObjectivesInProfile')}</p>
            )}
          </div>
        </div>
      </div>

      {/* 2️⃣ SUIVI SANTÉ (Graphiques & Tendances) */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative group">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
          <div>
            <h3 className="text-2xl font-black text-brand-secondary tracking-tight">Analyse de vos Tendances</h3>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Échelle d'affichage :</p>
              <div className="flex gap-2">
                {['min', 'hour', 'day'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t as any)}
                    className={`text-[8px] font-black uppercase px-2 py-1 rounded-md transition-all ${timeframe === t ? 'bg-brand-primary text-white' : 'bg-slate-50 text-slate-400'}`}
                  >
                    {t === 'min' ? 'Minutes' : t === 'hour' ? 'Heures' : 'Jours'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200/50">
              {(Object.keys(metricConfig) as MetricType[]).map((mKey) => (
                <button
                  key={mKey}
                  onClick={() => setActiveMetric(mKey)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMetric === mKey
                    ? 'bg-white text-brand-secondary shadow-md border border-slate-200'
                    : 'text-slate-400 hover:text-brand-primary'
                    }`}
                >
                  {metricConfig[mKey]?.label || mKey}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pr-2">
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Prévision à :</p>
              <div className="flex gap-1.5">
                {[1, 2, 7].map(d => (
                  <button
                    key={d}
                    onClick={() => setPredictionDistance(d)}
                    className={`w-8 h-8 rounded-full text-[10px] font-black flex items-center justify-center transition-all ${predictionDistance === d ? 'bg-brand-accent text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
                  >
                    {d}j
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full min-h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData || []}>
              <defs>
                <linearGradient id="bioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricConfig[activeMetric]?.color || '#000'} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={metricConfig[activeMetric]?.color || '#000'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
              <Tooltip
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.1)', padding: '20px' }}
                formatter={(value: any, name: any, props: any) => {
                  if (!props || !props.payload) return [value, name];
                  const isPredicted = props.payload.isPredicted;
                  if (value === null || value === undefined) return [null, null];
                  return [`${value} ${metricConfig[activeMetric]?.unit || ''}${isPredicted ? ' (Prédit)' : ''}`, metricConfig[activeMetric]?.label || ''];
                }}
              />
              <Area 
                type="monotone" 
                dataKey="realValue" 
                stroke={metricConfig[activeMetric]?.color || '#000'} 
                strokeWidth={5} 
                fillOpacity={1} 
                fill="url(#bioGrad)" 
                strokeLinecap="round" 
                isAnimationActive={false} 
              />
              <Area 
                type="monotone" 
                dataKey="predictedValue" 
                stroke={metricConfig[activeMetric]?.color || '#000'} 
                strokeWidth={3} 
                strokeDasharray="10 10" 
                fillOpacity={0} 
                strokeLinecap="round" 
                isAnimationActive={false} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3️⃣ ANALYSE AVANCÉE (Prédictions, Nutrition, Plan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] mb-1">Prévisions basées sur votre historique</p>
          <h3 className="text-2xl font-black text-brand-secondary tracking-tight">Projections Santé</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase">Évolution Poids</p>
              <p className="text-xl font-black text-brand-secondary">{(mlInsights?.weightPrediction?.predicted || 0).toFixed(1)} kg</p>
            </div>
            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase">Risque Cardiovasculaire</p>
              <p className="text-xl font-black text-brand-secondary">{mlInsights?.cvRisk || 0}%</p>
            </div>
            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase">Stabilité Métabolique</p>
              <p className="text-xl font-black text-brand-secondary">{mlInsights?.metabolicStability || 0}%</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] mb-1">Qualité Alimentaire</p>
          <h3 className="text-2xl font-black text-brand-secondary tracking-tight">Nutrition : {mlInsights?.nutritionAnalysis?.score ?? '--'}/100</h3>
          <div className="py-6 space-y-3">
            {mlInsights?.nutritionAnalysis?.analysis && mlInsights.nutritionAnalysis.analysis.length > 0 ? mlInsights.nutritionAnalysis.analysis.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className={item && item.includes('Alerte') ? 'text-red-500' : 'text-brand-primary'}>●</span>
                <span className="text-[11px] font-bold text-slate-700 uppercase">{item || 'Analyse...'}</span>
              </div>
            )) : <span className="text-slate-400 text-xs">En cours d'analyse...</span>}
          </div>
        </div>

        <div className="lg:col-span-1 bg-brand-accent rounded-[2.5rem] p-10 text-white shadow-xl shadow-brand-accent/20">
          <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.3em] mb-1">Votre Coach Santé</p>
          <h3 className="text-2xl font-black tracking-tight mb-6">Actions à faire</h3>
          <div className="space-y-3">
            {mlInsights?.deterministicRisk?.recommendations && mlInsights.deterministicRisk.recommendations.length > 0 ? mlInsights.deterministicRisk.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-4 bg-white/10 p-4 rounded-xl border border-white/10">
                <span className="text-xs font-bold leading-tight">{rec || 'Recommandation...'}</span>
              </div>
            )) : <span className="text-white/60 text-xs">En cours d'analyse...</span>}
          </div>
        </div>
      </div>

      {/* Clinical Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pathologies & Treatments */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4">Pathologies</p>
            <div className="space-y-2">
              {profile.pathologies && profile.pathologies.length > 0 ? (
                profile.pathologies.map((pathology, idx) => (
                  <div key={idx} className="px-4 py-2 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-red-700 text-sm font-bold">{t(pathology as any) || pathology}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs italic">Aucune pathologie enregistrée</p>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4">Traitements</p>
            <div className="space-y-2">
              {profile.treatments && profile.treatments.length > 0 ? (
                profile.treatments.map((treatment, idx) => (
                  <div key={idx} className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-blue-700 text-sm font-bold">{treatment}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs italic">Aucun traitement enregistré</p>
              )}
            </div>
          </div>
        </div>

        {/* Allergies & Preferences */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4">Allergies</p>
            <div className="space-y-2">
              {profile.allergies && profile.allergies.length > 0 ? (
                profile.allergies.map((allergy, idx) => (
                  <div key={idx} className="px-4 py-2 bg-yellow-50 rounded-xl border border-yellow-100">
                    <p className="text-yellow-700 text-sm font-bold">{allergy}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs italic">Aucune allergie enregistrée</p>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4">Préférences Alimentaires</p>
            <div className="space-y-2">
              {profile.preferences && profile.preferences.length > 0 ? (
                profile.preferences.map((preference, idx) => (
                  <div key={idx} className="px-4 py-2 bg-purple-50 rounded-xl border border-purple-100">
                    <p className="text-purple-700 text-sm font-bold">{preference}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs italic">Aucune préférence définie</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SHARE WITH PROFESIONALS & ASSISTANT (PRIORITY) */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleExportFullReport}
          className="flex-1 bg-white border-2 border-slate-100 hover:border-brand-primary text-brand-secondary p-6 rounded-3xl flex items-center justify-between group transition-all"
        >
          <div className="text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partage Professionnel</p>
            <h4 className="text-lg font-black tracking-tight">Partager mon rapport médical</h4>
          </div>
          <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-brand-primary group-hover:text-white rounded-2xl flex items-center justify-center transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
        </button>

        <button className="flex-1 bg-brand-primary p-6 rounded-3xl text-white flex items-center justify-between hover:shadow-xl hover:shadow-brand-primary/20 transition-all group">
          <div className="text-left">
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Support Médical IA</p>
            <h4 className="text-lg font-black tracking-tight">Poser une question à l'assistant</h4>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
        </button>
      </div>


      </div>
    </DashboardErrorBoundary>
  );
};
