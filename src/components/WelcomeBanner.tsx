import React from 'react';
import { translations } from '../locales';
import { LanguageType } from '../types';
import { Sparkles, Camera, Shield, FileText } from 'lucide-react';

interface WelcomeBannerProps {
  language: LanguageType;
  onNavigate: (tab: string) => void;
}

export function WelcomeBanner({ language, onNavigate }: WelcomeBannerProps) {
  const t = translations[language];

  return (
    <div className="bg-gradient-to-tr from-[#007AFF] to-[#00C6FF] dark:from-blue-950/45 dark:via-neutral-900/40 dark:to-neutral-950/60 dark:border dark:border-white/10 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-100 dark:shadow-blue-glow transition-all duration-300">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-blue-400/20 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none" />

      <div className="relative z-10 max-w-2xl space-y-4">
        
        <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>{t.home.welcome_title}</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          {t.home.welcome_desc}
        </h3>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('scanner')}
            className="px-5 py-2.5 bg-white text-[#007AFF] hover:bg-gray-50 text-xs font-extrabold rounded-xl shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
            id="welcome-start-scan-btn"
          >
            {translations[language].scanner.title || 'Scan Document'}
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            {translations[language].nav.settings}
          </button>
        </div>

      </div>
    </div>
  );
}
