
import React, { useState, useEffect } from 'react';
import { Onboarding } from './views/Onboarding';
import { Dashboard } from './views/Dashboard';
import { MealsView } from './views/MealsView';
import { NutritionPlanView } from './views/NutritionPlanView';
import { AssistantView } from './views/AssistantView';
import { Landing } from './views/Landing';
import { LoginView } from './views/LoginView';
import { SignupView } from './views/SignupView';
import { ProfileView } from './views/ProfileView';
import { Sidebar } from './components/Sidebar';
import { UserProfile, Pathology } from './types';
import { generateMedicalReport } from './services/pdfService';
import { supabase } from './services/supabaseClient';

type View = 'landing' | 'login' | 'signup' | 'onboarding' | 'dashboard' | 'meals' | 'plan' | 'assistant' | 'profile';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<View>('landing');
  const [isNewUser, setIsNewUser] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const loadProfileFromSupabase = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session?.user) {
      setUserProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !data) {
      setUserProfile(null);
      return;
    }

    const profile: UserProfile = {
      age: data.age,
      sex: data.sex,
      height: data.height,
      weight: data.weight,
      bmi: data.bmi,
      pathologies: data.pathologies || [],
      treatments: data.treatments || [],
      allergies: data.allergies || [],
      preferences: data.preferences || [],
      goals: data.goals || [],
    };

    setUserProfile(profile);
  };

  useEffect(() => {
    const initAuth = async () => {
      await loadProfileFromSupabase();
      setIsAuthReady(true);
    };
    initAuth();
  }, []);

  const handleUpdateProfile = async (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    // Met à jour dans Supabase
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (session?.user) {
      await supabase.from('profiles').upsert({
        id: session.user.id,
        ...newProfile,
      });
    }
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setUserProfile(profile);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (session?.user) {
      await supabase.from('profiles').upsert({
        id: session.user.id,
        ...profile,
      });
    }

    setIsNewUser(true); // Déclenche le popup clinique
    setCurrentView('dashboard');
  };

  const handleLoginSuccess = async () => {
    await loadProfileFromSupabase();
    setIsNewUser(false);
    // Si pas de profil en BD, rediriger vers onboarding au lieu du dashboard
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    
    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();
      
      setCurrentView(data ? 'dashboard' : 'onboarding');
    }
  };

  const handleSignupSuccess = () => {
    setCurrentView('onboarding');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setCurrentView('landing');
  };

  const handleExportPDF = () => {
    if (!userProfile) return;
    
    const savedPlan = localStorage.getItem('nutripath_plan');
    const plan = savedPlan ? JSON.parse(savedPlan) : null;
    
    const riskData = {
      healthScore: 88,
      aiFeedback: "Stabilité métabolique confirmée. Excellente réponse au protocole actuel."
    };

    generateMedicalReport(userProfile, [], plan, riskData);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <span className="text-xs font-black tracking-[0.3em] uppercase text-slate-400">
          Initialisation de la session...
        </span>
      </div>
    );
  }

  if (currentView === 'landing') {
    return <Landing 
      onStart={() => setCurrentView('signup')} 
      onLogin={() => setCurrentView('login')} 
    />;
  }

  if (currentView === 'login') {
    return <LoginView 
      onLoginSuccess={handleLoginSuccess} 
      onNavigateToSignup={() => setCurrentView('signup')}
      onBack={() => setCurrentView('landing')}
    />;
  }

  if (currentView === 'signup') {
    return <SignupView 
      onSignupSuccess={handleSignupSuccess}
      onNavigateToLogin={() => setCurrentView('login')}
      onBack={() => setCurrentView('landing')}
    />;
  }

  if (currentView === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg text-brand-text">
      <Sidebar 
        currentView={currentView} 
        setView={(v) => setCurrentView(v as View)} 
        onLogout={handleLogout} 
      />
      
      <main className="flex-1 overflow-y-auto px-6 py-10 md:px-12 bg-brand-primary/5">
        {!userProfile ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <span className="text-xs font-black tracking-[0.3em] uppercase text-slate-400">
                Chargement de votre profil...
              </span>
            </div>
          </div>
        ) : (
        <>
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-brand-secondary tracking-tight">
              {currentView === 'dashboard' ? 'Health Overview' : 
               currentView === 'meals' ? 'Journal Nutritionnel' : 
               currentView === 'plan' ? 'Protocole IA' :
               currentView === 'profile' ? 'Dossier Médical' :
               'Assistant Santé'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span>
               <p className="text-brand-primary/60 font-black text-[10px] uppercase tracking-widest">IA : Surveillance Active</p>
            </div>
          </div>
          <div className="flex items-center gap-4 self-end md:self-auto">
             <button 
                onClick={handleExportPDF}
                className="hidden sm:flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 hover:bg-brand-primary hover:border-brand-primary hover:text-white transition-all shadow-sm uppercase tracking-widest active:scale-95"
             >
                <svg className="w-4 h-4 text-brand-primary group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Générer Rapport PDF
             </button>
             <img src={`https://ui-avatars.com/api/?name=${userProfile?.sex || 'U'}&background=2ECC71&color=fff&bold=true`} className="rounded-2xl w-12 h-12 border-4 border-white shadow-lg" />
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {currentView === 'dashboard' && userProfile && (
              <Dashboard 
                profile={userProfile} 
                isNewUser={isNewUser} 
                onDismissNewUser={() => setIsNewUser(false)}
                onUpdateProfile={handleUpdateProfile}
              />
            )}
            {currentView === 'meals' && <MealsView />}
            {currentView === 'plan' && userProfile && <NutritionPlanView profile={userProfile} />}
            {currentView === 'assistant' && userProfile && <AssistantView profile={userProfile} />}
            {currentView === 'profile' && userProfile && <ProfileView profile={userProfile} onUpdateProfile={handleUpdateProfile} />}
        </div>
      </>
      )}
      </main>
    </div>
  );
};

export default App;
