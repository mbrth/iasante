
import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

interface LandingProps {
  onStart: () => void;
  onLogin: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onLogin }) => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-brand-bg overflow-x-hidden text-brand-text">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 rotate-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-brand-secondary font-black text-2xl tracking-tighter">NutriPath<span className="text-brand-primary">AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher theme="light" />
          <button onClick={onLogin} className="text-brand-secondary font-bold text-sm hover:text-brand-primary transition">{t('login')}</button>
          <button onClick={onStart} className="bg-brand-secondary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-brand-primary transition active:scale-95">{t('getStarted')}</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full text-brand-primary text-xs font-black uppercase tracking-widest border border-brand-primary/20">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
              {t('nextGenMedical')}
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-brand-secondary leading-[1.05] tracking-tighter">
              {t('aiDrivenNutrition')} <span className="text-brand-primary">{t('chronicCare')}</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
              {t('precisionDiet')}
            </p>
            <div className="p-5 bg-amber-50/80 border border-amber-200/60 rounded-2xl mb-6">
              <p className="text-amber-800 font-bold text-sm">
                🔐 {t('loginRequiredMessage')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button onClick={onStart} className="bg-brand-accent text-white px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-accent/30 hover:bg-brand-accent/90 transition hover:-translate-y-1 active:translate-y-0">
                {t('startFreeAnalysis')}
              </button>
              <button onClick={onLogin} className="bg-white text-brand-secondary px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl border border-slate-100 hover:bg-slate-50 transition">
                {t('login')}
              </button>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest pt-8">
              <span>{t('trustedBy')}</span>
              <div className="flex gap-4 opacity-50 grayscale">
                <span className="border-r border-slate-200 pr-4">HealthCare+</span>
                <span className="border-r border-slate-200 pr-4">BioLabs</span>
                <span>MedCore</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-brand-primary rounded-full blur-[120px] opacity-10 -translate-y-12"></div>
            <div className="relative bg-white p-4 rounded-[3rem] shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
               <img src="https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&q=80&w=1000" className="rounded-[2.5rem] w-full h-[500px] object-cover" alt="Health Visualization" />
               <div className="absolute -bottom-10 -left-10 bg-brand-secondary text-white p-8 rounded-[2.5rem] shadow-2xl max-w-xs animate-bounce-slow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{t('liveAiAnalysis')}</span>
                  </div>
                  <p className="font-bold text-lg leading-tight">"Glucose spike predicted in 45 mins. Recommendation: 200mg Magnesium & fiber."</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Grade Capabilities */}
      <section className="bg-brand-secondary py-32 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="w-64 h-64 bg-brand-primary/40 rounded-full blur-3xl -top-10 -left-10 absolute" />
          <div className="w-72 h-72 bg-brand-accent/30 rounded-full blur-3xl -bottom-16 -right-10 absolute" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
           <div className="text-center mb-20 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[11px] font-black uppercase tracking-[0.25em]">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                <span>{t('clinicalGrade')}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                {t('clinicalCapabilities')}
              </h2>
              <p className="text-slate-300 max-w-2xl mx-auto text-sm md:text-base font-medium">
                {t('clinicalDesc')}
              </p>
           </div>
           <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  title: t('pathologyEngines'), 
                  tag: t('pathologyTag'),
                  desc: t('pathologyDesc'), 
                  icon: 'M13 16h-1v-4H8l4-8h1v4h4l-4 8z' 
                },
                { 
                  title: t('realTimeBioSync'), 
                  tag: t('bioSyncTag'),
                  desc: t('bioSyncDesc'), 
                  icon: 'M5 13l4 4L19 7' 
                },
                { 
                  title: t('clinicianReports'), 
                  tag: t('reportsTag'),
                  desc: t('reportsDesc'), 
                  icon: 'M9 12l2 2 4-4m2-2a9 9 0 11-6.219-2.781' 
                },
              ].map((feat, i) => (
                <div 
                  key={i} 
                  className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 hover:border-brand-primary/60 transition group flex flex-col justify-between"
                >
                   <div>
                     <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-brand-primary/40">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feat.icon} />
                        </svg>
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary mb-2">
                       {feat.tag}
                     </p>
                     <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                     <p className="text-slate-300 leading-relaxed text-sm">{feat.desc}</p>
                   </div>
                   <div className="mt-6 h-px w-16 bg-gradient-to-r from-brand-primary to-transparent opacity-70 group-hover:w-24 transition-all" />
                </div>
              ))}
           </div>
          </div>
      </section>

      {/* Recommandations / À propos */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-brand-secondary tracking-tight mb-4">
            {t('landingWhyNutripath')}
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
            {t('landingWhyDesc')}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: t('landingReco1Title'), desc: t('landingReco1Desc') },
            { title: t('landingReco2Title'), desc: t('landingReco2Desc') },
            { title: t('landingReco3Title'), desc: t('landingReco3Desc') },
            { title: t('landingReco4Title'), desc: t('landingReco4Desc') },
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <h3 className="font-black text-slate-800 mb-2">{item.title}</h3>
              <p className="text-slate-500 text-sm font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{t('medicalGrade')}</p>
        <div className="flex gap-8">
          <a href="#" className="text-slate-400 hover:text-brand-primary text-xs font-bold uppercase tracking-widest transition">{t('privacy')}</a>
          <a href="#" className="text-slate-400 hover:text-brand-primary text-xs font-bold uppercase tracking-widest transition">{t('terms')}</a>
          <a href="#" className="text-slate-400 hover:text-brand-primary text-xs font-bold uppercase tracking-widest transition">{t('contact')}</a>
        </div>
      </footer>
    </div>
  );
};
