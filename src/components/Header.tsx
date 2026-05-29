import React from 'react';
import { Sun, Moon, Globe, HardDrive, RefreshCw, Signal, SignalZero } from 'lucide-react';
import { translations } from '../locales';
import { LanguageType, ThemeType } from '../types';

interface HeaderProps {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  storagePercentage: number;
  isOnline: boolean;
  onNavigate: (tab: string) => void;
  activeTab: string;
}

export function Header({
  language,
  setLanguage,
  theme,
  setTheme,
  storagePercentage,
  isOnline,
  onNavigate,
  activeTab
}: HeaderProps) {
  const t = translations[language];

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors duration-300 bg-white/95 dark:bg-black/40 border-gray-200 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Branding */}
        <div 
          onClick={() => onNavigate('home')} 
          className="flex items-center space-x-3 cursor-pointer group"
          id="hdr-logo-container"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#007AFF] to-[#00C6FF] flex items-center justify-center text-white font-bold text-lg shadow-md dark:shadow-blue-glow group-hover:scale-105 transition-transform animate-pulse">
            SP
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white" id="hdr-title">
              {t.app_title}
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium" id="hdr-subtitle">
              {t.app_subtitle}
            </p>
          </div>
        </div>

        {/* Right side operations */}
        <div className="flex items-center space-x-4">
          
          {/* Online/Offline Badge */}
          <div className={`hidden sm:flex items-center px-2.5 py-1 rounded-full text-xs font-semibold space-x-1.5 ${
            isOnline 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-transparent dark:border-emerald-500/20' 
              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-transparent dark:border-amber-500/20'
          }`} id="hdr-network-badge">
            {isOnline ? (
              <>
                <Signal className="w-3 h-3 text-emerald-500" />
                <span>ONLINE</span>
              </>
            ) : (
              <>
                <SignalZero className="w-3 h-3 text-amber-500" />
                <span>OFFLINE</span>
              </>
            )}
          </div>

          {/* Storage indicator */}
          <div className="hidden md:flex items-center space-x-2 text-xs" id="hdr-storage-indicator">
            <HardDrive className="w-3.5 h-3.5 text-gray-400" />
            <div className="flex flex-col">
              <span className="text-gray-550 dark:text-white/40 font-medium">DB Quota: {storagePercentage}%</span>
              <div className="w-20 bg-gray-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 dark:shadow-green-glow ${storagePercentage > 85 ? 'bg-rose-500' : 'bg-[#007AFF]'}`} 
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Language selection button */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="flex items-center space-x-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Switch Language"
            id="hdr-lang-toggle"
          >
            <Globe className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Theme selection button */}
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Toggle Visage Theme"
            id="hdr-theme-toggle"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#007AFF]" />}
          </button>

        </div>
      </div>
    </header>
  );
}
