import React, { useState } from 'react';
import { useGamification, BADGES } from '../contexts/GamificationContext';
import { useLanguage } from '../i18n/LanguageContext';

interface GamificationBarProps {
  variant?: 'dark' | 'light';
}

export const GamificationBar: React.FC<GamificationBarProps> = ({ variant = 'light' }) => {
  const { data, isPremium, progressPercent } = useGamification();
  const { t } = useLanguage();
  const [showBadges, setShowBadges] = useState(false);

  const levelProgress = progressPercent;
  const isLight = variant === 'light';

  return (
    <div className="relative">
      {/* Statut : Gratuit ou Premium */}
      <div className={`mb-1.5 px-2.5 py-1.5 rounded-lg text-center text-[10px] font-black uppercase ${
        isPremium
          ? 'bg-amber-500/30 text-amber-700 border border-amber-400/40'
          : isLight
            ? 'bg-slate-100 text-slate-500 border border-slate-200'
            : 'bg-white/10 text-slate-400 border border-white/10'
      }`}>
        {isPremium ? '👑 ' + t('yourStatusPremium') : t('yourStatusFree')}
      </div>
      <div
        className={`p-3 rounded-xl cursor-pointer transition ${
          isLight
            ? 'bg-white border border-slate-200 hover:bg-slate-50 shadow-sm'
            : 'bg-white/5 border border-white/10 hover:bg-white/10'
        }`}
        onClick={() => setShowBadges(!showBadges)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <div>
              <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest">
                {t('level')} {data.level}
              </p>
              <p className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>{data.points} pts</p>
            </div>
          </div>
          {data.streakCurrent > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 rounded-lg text-orange-600 text-xs font-bold">
              🔥 {data.streakCurrent}
            </span>
          )}
        </div>
        <div className={`mt-1.5 h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
          <div
            className="h-full bg-brand-primary rounded-full transition-all duration-500"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
      </div>

      {showBadges && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50">
          <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-3">
            {t('badges')}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.values(BADGES).map((badge) => {
              const hasBadge = data.badges.includes(badge.id);
              const isLocked = badge.premium && !isPremium;
              return (
                <div
                  key={badge.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
                    hasBadge ? 'bg-brand-primary/10 text-brand-secondary' : isLocked ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-slate-400'
                  }`}
                  title={badge.desc}
                >
                  <span>{hasBadge ? badge.icon : isLocked ? '🔒' : '○'}</span>
                  <span>{badge.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
