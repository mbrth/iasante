
import React from 'react';

interface SidebarProps {
  currentView: string;
  setView: (view: any) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { id: 'meals', label: 'Journal', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
    { id: 'plan', label: 'Protocol', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'assistant', label: 'Assistant', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { id: 'profile', label: 'Profil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  return (
    <aside className="w-20 md:w-72 bg-brand-secondary flex flex-col items-center py-10 transition-all duration-500">
      <div className="flex items-center gap-3 mb-16 px-6">
        <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-xl shadow-brand-primary/40 transform rotate-3">
           <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
           </svg>
        </div>
        <div className="hidden md:block">
          <span className="text-white font-black text-2xl tracking-tighter block leading-none">NutriPath</span>
          <span className="text-brand-primary text-[10px] font-black uppercase tracking-[0.2em]">Bio Intelligence</span>
        </div>
      </div>
      
      <nav className="flex-1 w-full px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all duration-300 group ${
              currentView === item.id 
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 translate-x-1' 
                : 'text-slate-400 hover:text-brand-primary hover:bg-white/5'
            }`}
          >
            <svg className={`w-6 h-6 shrink-0 transition-transform ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="hidden md:block ml-4 font-bold text-sm tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto px-4 w-full space-y-4">
         <div className="hidden md:block p-5 bg-white/5 rounded-3xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Medical Link</p>
            </div>
            <p className="text-xs font-bold text-slate-300">Live Sync Enabled</p>
         </div>
         <button 
           onClick={onLogout}
           className="w-full flex items-center px-5 py-4 rounded-2xl text-slate-500 hover:bg-brand-accent/10 hover:text-brand-accent transition-all font-bold"
         >
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden md:block ml-4 text-sm">Sign Out</span>
         </button>
      </div>
    </aside>
  );
};
