
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface LoginViewProps {
  onLoginSuccess: () => void;
  onNavigateToSignup: () => void;
  onBack: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNavigateToSignup, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    await onLoginSuccess();
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] overflow-x-hidden text-[#2D3436] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl shadow-slate-900/5 p-12 relative overflow-hidden">
        <button onClick={onBack} className="absolute top-8 left-8 text-slate-400 hover:text-[#2ECC71] transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>

        <div className="text-center mb-10 pt-4">
          <div className="w-16 h-16 bg-[#2ECC71] rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-6 rotate-3">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-3xl font-black text-[#34495E] tracking-tighter">Content de vous revoir</h2>
          <p className="text-slate-400 font-medium mt-2">Accédez à votre intelligence santé</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Adresse Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#2ECC71] focus:bg-white transition-all outline-none font-bold text-slate-700" 
              placeholder="votre@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mot de passe</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#2ECC71] focus:bg-white transition-all outline-none font-bold text-slate-700" 
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end">
            <a href="#" className="text-xs font-bold text-[#2ECC71] hover:underline">Mot de passe oublié ?</a>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-500 text-center -mt-2 mb-4">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF7675] text-white font-black py-5 rounded-2xl shadow-2xl hover:bg-[#FF7675]/90 disabled:opacity-60 disabled:cursor-not-allowed transition uppercase tracking-widest text-xs hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? 'Connexion...' : 'Se Connecter'}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-slate-400 text-sm font-medium">
            Pas encore de compte ?{' '}
            <button onClick={onNavigateToSignup} className="text-[#2ECC71] font-black hover:underline">Créer un profil</button>
          </p>
        </div>
      </div>
    </div>
  );
};
