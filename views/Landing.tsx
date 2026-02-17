
import React from 'react';

interface LandingProps {
  onStart: () => void;
  onLogin: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onLogin }) => {
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
        <div className="flex items-center gap-6">
          <button onClick={onLogin} className="text-brand-secondary font-bold text-sm hover:text-brand-primary transition">Login</button>
          <button onClick={onStart} className="bg-brand-secondary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-brand-primary transition active:scale-95">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full text-brand-primary text-xs font-black uppercase tracking-widest border border-brand-primary/20">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
              Next-Gen Medical Nutrition
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-brand-secondary leading-[1.05] tracking-tighter">
              AI-Driven Nutrition for <span className="text-brand-primary">Chronic Care.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
              Precision diet protocols for Diabetes, Hypertension, and Cardiovascular health. Powered by clinical-grade AI that adapts to your biometrics in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={onStart} className="bg-brand-accent text-white px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-accent/30 hover:bg-brand-accent/90 transition hover:-translate-y-1 active:translate-y-0">
                Start My Free Analysis
              </button>
              <button className="bg-white text-brand-secondary px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl border border-slate-100 hover:bg-slate-50 transition">
                Watch Demo
              </button>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest pt-8">
              <span>Trusted by researchers at</span>
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Live AI Analysis</span>
                  </div>
                  <p className="font-bold text-lg leading-tight">"Glucose spike predicted in 45 mins. Recommendation: 200mg Magnesium & fiber."</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-brand-secondary py-32 text-white">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-20">
              <h2 className="text-4xl font-black mb-4 tracking-tight">Clinical Grade Capabilities</h2>
              <p className="text-brand-primary font-bold uppercase tracking-widest text-sm">Beyond a simple calorie counter</p>
           </div>
           <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Pathology Specific', desc: 'Custom engines for T2 Diabetes, Obesity, and CVD built by dietitians.', icon: 'M19.428 15.428a2 2 0 00-1.022-.547' },
                { title: 'Real-time Bio-sync', desc: 'Sync your glucose monitor or blood pressure cuff for dynamic meal adjustments.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                { title: 'Neural Meal Logic', desc: 'Log food via photos. Our AI breaks down clinical impacts, not just macros.', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89' },
              ].map((feat, i) => (
                <div key={i} className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition group">
                   <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feat.icon} />
                      </svg>
                   </div>
                   <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                   <p className="text-slate-300 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">© 2025 NutriPath AI. Medical Grade Nutrition.</p>
        <div className="flex gap-8">
          <a href="#" className="text-slate-400 hover:text-brand-primary text-xs font-bold uppercase tracking-widest transition">Privacy</a>
          <a href="#" className="text-slate-400 hover:text-brand-primary text-xs font-bold uppercase tracking-widest transition">Terms</a>
          <a href="#" className="text-slate-400 hover:text-brand-primary text-xs font-bold uppercase tracking-widest transition">Contact</a>
        </div>
      </footer>
    </div>
  );
};
