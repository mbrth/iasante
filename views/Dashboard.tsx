
import React, { useState, useEffect } from 'react';
import { UserProfile, HealthMetrics } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { analyzeHealthRisk } from '../services/geminiService';
import { generateMedicalReport } from '../services/pdfService';

const mockMetrics: HealthMetrics[] = [
  { date: '01/05', glucose: 95, systolicBP: 120, weight: 80, complianceScore: 85 },
  { date: '03/05', glucose: 105, systolicBP: 125, weight: 79.5, complianceScore: 90 },
  { date: '05/05', glucose: 88, systolicBP: 118, weight: 79.2, complianceScore: 95 },
  { date: '07/05', glucose: 115, systolicBP: 130, weight: 79.8, complianceScore: 70 },
  { date: '09/05', glucose: 92, systolicBP: 121, weight: 79.0, complianceScore: 88 },
  { date: '11/05', glucose: 94, systolicBP: 119, weight: 78.8, complianceScore: 92 },
  { date: '13/05', glucose: 90, systolicBP: 115, weight: 78.5, complianceScore: 98 },
];

type MetricType = 'glucose' | 'systolicBP' | 'weight';

interface DashboardProps {
  profile: UserProfile;
  isNewUser?: boolean;
  onDismissNewUser?: () => void;
  onUpdateProfile?: (profile: UserProfile) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, isNewUser, onDismissNewUser, onUpdateProfile }) => {
  const [riskData, setRiskData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<MetricType>('glucose');
  
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
        const result = await analyzeHealthRisk(profile, mockMetrics);
        setRiskData(result);
      } catch (e) {
        console.error("AI Analysis failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRisk();
  }, [profile]);

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
    generateMedicalReport(profile, mockMetrics, plan, riskData);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-1000">
      
      {/* Modal Clinique */}
      {showClinicalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-secondary/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 space-y-8 animate-in zoom-in-95 duration-500 border border-slate-100">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Indice de Poids', value: '78.5', unit: 'kg', color: 'brand-primary' },
          { label: 'Pic Glucose', value: '94', unit: 'mg/dL', color: 'brand-primary' },
          { label: 'Tension Moy.', value: '118/76', unit: 'mmHg', color: 'brand-accent' },
          { label: 'Observance', value: '92', unit: '%', color: 'brand-secondary' },
        ].map((m, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-500 group">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1 group-hover:text-brand-primary transition-colors">{m.label}</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black text-brand-secondary tracking-tighter`}>{m.value}</span>
              <span className="text-slate-400 font-bold text-[10px] uppercase">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CLINICAL GRADE CAPABILITIES */}
      <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl shadow-brand-primary/5 p-8 lg:p-12 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col items-center text-center max-w-6xl mx-auto space-y-12 relative z-10">
           <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full mb-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span>
                 <span className="text-brand-primary text-[9px] font-black uppercase tracking-widest">Clinical Grade Capabilities</span>
              </div>
              <h2 className="text-3xl font-black text-brand-secondary tracking-tight">
                Plateforme de <span className="text-brand-primary">décision clinique</span>
              </h2>
              <p className="text-slate-500 text-xs max-w-xl mx-auto">
                Analyses biométriques, scoring de risque et rapports partageables, avec un niveau de fiabilité proche d’un service hospitalier.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch w-full">
              
              {/* Left Column: Clinical Stream */}
              <div className="space-y-4 flex flex-col justify-center">
                 <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] text-left border-l-2 border-brand-primary pl-3">
                   Surveillance Temps Réel
                 </p>
                 <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 text-left space-y-1">
                    <p className="text-brand-secondary font-black text-[10px] uppercase">Stabilité Cardiaque</p>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Profil tensionnel suivi en continu avec seuils d’alerte cliniques.
                    </p>
                 </div>
                 <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 text-left space-y-1">
                    <p className="text-brand-secondary font-black text-[10px] uppercase">Régulation Glycémique</p>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Indice post-prandial comparé à des courbes de référence cliniques.
                    </p>
                 </div>
              </div>

              {/* CENTER: Status Shield */}
              <div className="flex flex-col items-center justify-center py-6 md:border-x md:border-slate-100/70 md:px-8">
                 <div className="w-full max-w-[280px] bg-gradient-to-b from-[#34495E] to-[#2C3E50] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary" />
                    
                    <div className="relative z-10 space-y-6">
                       <div className="flex justify-between items-center">
                          <span className="text-brand-primary text-[8px] font-black uppercase tracking-[0.4em]">Health Score</span>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
                             <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                             <span className="text-white text-[7px] font-black uppercase">Sync</span>
                          </div>
                       </div>
                       
                       <div className="flex flex-col items-center">
                          <span className="text-7xl font-black text-white tracking-tighter leading-none">{isLoading ? '--' : (riskData?.healthScore || '85')}</span>
                          <span className="text-brand-primary/70 text-[10px] font-black uppercase tracking-[0.2em] mt-3">
                            Indice de Résilience
                          </span>
                       </div>

                       <div className="space-y-2">
                          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                             <span>Stabilité Métabolique</span>
                             <span className="text-brand-primary">94%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-brand-primary rounded-full transition-all duration-[2000ms] shadow-[0_0_12px_rgba(46,204,113,0.5)]" style={{ width: '94%' }} />
                          </div>
                       </div>
                    </div>
                    
                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-1000" />
                 </div>
              </div>

              {/* Right Column: AI Insights */}
              <div className="flex flex-col justify-center space-y-4">
                 <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] text-right border-r-2 border-brand-accent pr-3">
                   Insights IA Signables
                 </p>
                 <div className="p-6 bg-gradient-to-br from-brand-accent/5 to-white rounded-3xl border border-brand-accent/10 shadow-sm text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                       <svg className="w-8 h-8 text-brand-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017V14H15.017C13.3601 14 12.017 12.6569 12.017 11V7C12.017 5.34315 13.3601 4 15.017 4H19.017C20.6738 4 22.017 5.34315 22.017 7V11C22.017 12.6569 20.6738 14 19.017 14V16C19.017 18.2091 17.2261 20 15.017 20L14.017 21Z" /></svg>
                    </div>
                    <p className="text-brand-secondary text-[11px] font-semibold leading-relaxed italic">
                       "{isLoading ? 'Analyse des biométries...' : (riskData?.aiFeedback || "Votre corps répond favorablement au protocole actuel. Priorisez les lipides insaturés ce soir.")}"
                    </p>
                 </div>
                 <button 
                    onClick={handleExportFullReport}
                    className="w-full bg-brand-accent text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-accent/20 hover:bg-brand-accent/90 transition active:scale-95"
                 >
                    Rapport Médical Complet
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Analytics Graph */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
           <div>
              <h3 className="text-2xl font-black text-brand-secondary tracking-tight">Analyse de Tendance</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Historique des 14 derniers jours</p>
           </div>
           <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200/50">
              {(Object.keys(metricConfig) as MetricType[]).map((mKey) => (
                <button 
                  key={mKey} 
                  onClick={() => setActiveMetric(mKey)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeMetric === mKey 
                      ? 'bg-white text-brand-secondary shadow-md border border-slate-200' 
                      : 'text-slate-400 hover:text-brand-primary'
                  }`}
                >
                  {metricConfig[mKey].label}
                </button>
              ))}
           </div>
        </div>
        <div className="h-[350px] w-full">
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMetrics}>
                <defs>
                  <linearGradient id="bioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metricConfig[activeMetric].color} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={metricConfig[activeMetric].color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.1)', padding: '20px' }}
                  formatter={(value: any) => [`${value} ${metricConfig[activeMetric].unit}`, metricConfig[activeMetric].label]}
                />
                <Area 
                  type="monotone" 
                  dataKey={activeMetric} 
                  stroke={metricConfig[activeMetric].color} 
                  strokeWidth={5} 
                  fillOpacity={1} 
                  fill="url(#bioGrad)" 
                  strokeLinecap="round" 
                  animationDuration={1500}
                />
              </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
