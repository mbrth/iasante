import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
  /** Use 'light' on light backgrounds (landing), 'dark' on dark backgrounds (sidebar) */
  theme?: 'light' | 'dark';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '', theme = 'dark' }) => {
  const { locale, setLocale } = useLanguage();

  const isLight = theme === 'light';
  const containerClass = isLight
    ? 'flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-200 p-1'
    : 'flex items-center gap-1 rounded-xl bg-white/10 border border-white/20 p-1';
  const activeClass = isLight
    ? 'bg-brand-primary text-white'
    : 'bg-brand-primary text-white';
  const inactiveClass = isLight
    ? 'text-slate-500 hover:text-brand-primary hover:bg-slate-200/50'
    : 'text-slate-400 hover:text-white hover:bg-white/5';

  return (
    <div className={`${containerClass} ${className}`}>
      <button
        onClick={() => setLocale('fr')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          locale === 'fr' ? activeClass : inactiveClass
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          locale === 'en' ? activeClass : inactiveClass
        }`}
      >
        EN
      </button>
    </div>
  );
};
