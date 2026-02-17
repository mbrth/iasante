
import React, { useState } from 'react';
import { UserProfile, Pathology } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    pathologies: [],
    allergies: [],
    goals: [],
    preferences: [],
    treatments: []
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const calculateBMI = () => {
    if (profile.weight && profile.height) {
      return profile.weight / Math.pow(profile.height / 100, 2);
    }
    return 0;
  };

  const handleFinish = () => {
    const bmi = calculateBMI();
    onComplete({ ...profile, bmi } as UserProfile);
  };

  const toggleArrayItem = (key: keyof UserProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [key]: (prev[key] as any[]).includes(value)
        ? (prev[key] as any[]).filter(i => i !== value)
        : [...(prev[key] as any[]), value]
    }));
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(46,204,113,0.15)] w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-slate-100">
        {/* Left Visual Area */}
        <div className="md:w-2/5 bg-brand-secondary p-12 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10">
              <div className="w-16 h-16 bg-brand-primary rounded-3xl flex items-center justify-center mb-10 shadow-2xl shadow-brand-primary/40 rotate-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tighter">NutriPath<span className="text-brand-primary">AI</span></h2>
              <p className="text-slate-200 text-lg font-medium leading-relaxed">Let's build your AI-powered clinical nutrition profile in seconds.</p>
           </div>
           
           <div className="relative z-10">
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-2 rounded-full transition-all duration-500 ${step === i ? 'bg-brand-primary w-12' : 'bg-white/20 w-3'}`} />
                ))}
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">Step {step} of 3</p>
           </div>
           
           <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        {/* Form Area */}
        <div className="flex-1 p-12 md:p-20 flex flex-col justify-center">
          {step === 1 && (
            <div className="space-y-10">
              <div>
                <h3 className="text-3xl font-black text-brand-secondary tracking-tight mb-2">The Basics</h3>
                <p className="text-slate-400 font-medium">Your physical metrics help calibrate the AI engine.</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Age</label>
                  <input type="number" onChange={e => setProfile({...profile, age: Number(e.target.value)})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white transition-all outline-none font-bold text-lg" placeholder="Years" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Biological Sex</label>
                  <select onChange={e => setProfile({...profile, sex: e.target.value as any})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white transition-all outline-none font-bold text-lg appearance-none">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Height (cm)</label>
                  <input type="number" onChange={e => setProfile({...profile, height: Number(e.target.value)})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white transition-all outline-none font-bold text-lg" placeholder="175" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Weight (kg)</label>
                  <input type="number" onChange={e => setProfile({...profile, weight: Number(e.target.value)})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white transition-all outline-none font-bold text-lg" placeholder="70" />
                </div>
              </div>
              <button onClick={nextStep} className="w-full bg-brand-accent text-white font-black py-5 rounded-[2rem] hover:bg-brand-accent/90 transition-all shadow-xl shadow-brand-accent/20 uppercase tracking-widest text-sm">Continue</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10">
              <div>
                <h3 className="text-3xl font-black text-brand-secondary tracking-tight mb-2">Medical Profile</h3>
                <p className="text-slate-400 font-medium">Select your chronic conditions for specialized AI analysis.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                {Object.values(Pathology).map(path => (
                  <button
                    key={path}
                    onClick={() => toggleArrayItem('pathologies', path)}
                    className={`flex items-center justify-between px-6 py-4 rounded-2xl text-sm font-bold border-2 transition-all ${
                      profile.pathologies?.includes(path) 
                        ? 'bg-brand-primary/10 border-brand-primary text-brand-primary scale-[1.02]' 
                        : 'bg-white border-slate-100 text-slate-500 hover:border-brand-primary/30'
                    }`}
                  >
                    {path}
                    {profile.pathologies?.includes(path) && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 border-2 border-slate-100 text-slate-400 font-bold py-5 rounded-3xl hover:bg-slate-50 transition uppercase tracking-widest text-xs">Back</button>
                <button onClick={nextStep} className="flex-[2] bg-brand-accent text-white font-black py-5 rounded-3xl hover:bg-brand-accent/90 transition shadow-xl shadow-brand-accent/20 uppercase tracking-widest text-sm">Next</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10">
              <div>
                <h3 className="text-3xl font-black text-brand-secondary tracking-tight mb-2">Your Goals</h3>
                <p className="text-slate-400 font-medium">Define your primary health objective.</p>
              </div>
              <div className="space-y-3">
                {['Stabilize Blood Glucose', 'Lower Blood Pressure', 'Weight Management', 'Reduce Cholesterol'].map(goal => (
                  <button
                    key={goal}
                    onClick={() => toggleArrayItem('goals', goal)}
                    className={`w-full text-left px-6 py-4 rounded-2xl text-sm font-bold border-2 transition-all ${
                      profile.goals?.includes(goal) 
                        ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-md translate-x-1' 
                        : 'bg-white border-slate-100 text-slate-500 hover:border-brand-primary/30'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={prevStep} className="flex-1 border-2 border-slate-100 text-slate-400 font-bold py-5 rounded-3xl hover:bg-slate-50 transition uppercase tracking-widest text-xs">Back</button>
                <button onClick={handleFinish} className="flex-[2] bg-brand-accent text-white font-black py-5 rounded-3xl hover:bg-brand-accent/90 transition shadow-xl shadow-brand-accent/20 uppercase tracking-widest text-sm">Initialize System</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
