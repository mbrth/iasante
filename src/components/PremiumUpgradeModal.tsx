import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  reason?: 'meals_limit' | 'feature' | 'general';
}

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  reason = 'general',
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const features = [
    { icon: '♾️', text: t('premiumUnlimitedMeals') },
    { icon: '🤖', text: t('premiumAiPlan') },
    { icon: '📊', text: t('premiumAdvancedAnalytics') },
    { icon: '📄', text: t('premiumPdfExport') },
    { icon: '💎', text: t('premiumExclusiveBadges') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-8 text-white text-center">
          <span className="text-5xl block mb-4">👑</span>
          <h3 className="text-2xl font-black tracking-tight">{t('premiumTitle')}</h3>
          <p className="text-amber-100 text-sm mt-2">{t('premiumSubtitle')}</p>
        </div>

        <div className="p-6 space-y-6">
          {reason === 'meals_limit' && (
            <p className="text-sm text-slate-600 font-medium text-center bg-amber-50 py-3 px-4 rounded-xl">
              {t('premiumMealsLimitMessage')}
            </p>
          )}

          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm font-medium text-slate-700">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-slate-800">9,99€<span className="text-sm font-normal text-slate-500">/mois</span></p>
            <p className="text-xs text-slate-500 mt-1">ou 79,99€/an (-33%)</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              {t('premiumMaybeLater')}
            </button>
            <button
              onClick={onUpgrade}
              className="flex-1 py-4 rounded-2xl font-black bg-amber-500 text-white hover:bg-amber-600 transition shadow-lg"
            >
              {t('premiumUpgradeNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
