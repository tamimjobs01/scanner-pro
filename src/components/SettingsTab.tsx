import React, { useRef, useState } from 'react';
import { 
  Settings, Sun, Moon, Sparkles, HardDrive, Cpu, ShieldCheck, 
  Trash2, Download, Upload, HelpCircle, Heart, CheckCircle, Info, FileUp
} from 'lucide-react';
import { translations } from '../locales';
import { LanguageType, ThemeType, UserPreferences } from '../types';

interface SettingsTabProps {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  storagePercentage: number;
  onClearHistoryList: () => void;
  onExportBackupJson: () => void;
  onImportBackupJson: (file: File) => void;
  onNavigate: (tab: string) => void;
}

export function SettingsTab({
  language,
  setLanguage,
  theme,
  setTheme,
  storagePercentage,
  onClearHistoryList,
  onExportBackupJson,
  onImportBackupJson,
  onNavigate
}: SettingsTabProps) {
  const t = translations[language];

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cacheNotification, setCacheNotification] = useState<boolean>(false);
  const [importNotification, setImportNotification] = useState<boolean>(false);

  const handleClearCache = () => {
    onClearHistoryList();
    setCacheNotification(true);
    setTimeout(() => {
      setCacheNotification(false);
    }, 2500);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportBackupJson(e.target.files[0]);
      setImportNotification(true);
      setTimeout(() => {
        setImportNotification(false);
        onNavigate('home');
      }, 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="settings-view">
      
      {/* Title block */}
      <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors duration-300">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <Settings className="w-5 h-5 text-[#007AFF]" />
          <span>{t.settings.title}</span>
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tailor international display locales, visual theme preferences, and offline storage archives
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left column Settings */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Theme panel */}
          <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors duration-300">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-1.5">
              <Sun className="w-4 h-4 text-[#007AFF]" />
              <span>{t.settings.appearance}</span>
            </h3>
            
            <div className="space-y-3">
              <span className="text-xs font-semibold text-gray-400">{t.settings.theme}</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'auto', label: 'System', icon: Cpu }
                ].map((th) => {
                  const Icon = th.icon;
                  return (
                    <button
                      key={th.id}
                      onClick={() => setTheme(th.id as any)}
                      className={`py-3 px-2 border text-xs font-bold rounded-xl flex flex-col items-center justify-center space-y-1.5 cursor-pointer transition-all ${
                        theme === th.id
                          ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                          : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{th.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Languages selection panel */}
          <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors duration-300">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-[#007AFF]" />
              <span>{t.settings.language}</span>
            </h3>

            <div className="space-y-4">
              <span className="text-xs font-semibold text-gray-400">{t.settings.lang_label}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'en', label: t.settings.en_label },
                  { id: 'bn', label: t.settings.bn_label }
                ].map((lan) => (
                  <button
                    key={lan.id}
                    onClick={() => setLanguage(lan.id as any)}
                    className={`py-3 px-4 border text-center text-xs font-bold rounded-xl cursor-pointer transition-all ${
                      language === lan.id
                        ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                        : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {lan.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Database management panels */}
          <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors duration-300 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
              <HardDrive className="w-4 h-4 text-[#007AFF]" />
              <span>{t.settings.storage}</span>
            </h3>

            {/* Quota indicator bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                <span>Database Used Quota</span>
                <span>{storagePercentage}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${storagePercentage > 85 ? 'bg-rose-500' : 'bg-[#007AFF]'}`} 
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
            </div>

            {/* Action buttons triggers */}
            <div className="pt-4 border-t border-gray-150 dark:border-gray-800 space-y-2">
              
              <div className="grid grid-cols-2 gap-2">
                {/* Export JSON backup */}
                <button
                  onClick={onExportBackupJson}
                  className="py-2.5 px-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#007AFF]" />
                  <span>Download Backup</span>
                </button>

                {/* Import JSON backup file input */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Restore Import</span>
                </button>
              </div>

              {/* Secret hidden picker */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFileChange}
                className="hidden"
              />

              {/* Cache purge */}
              <button
                onClick={handleClearCache}
                className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-center space-x-2 border border-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.settings.clear_cache}</span>
              </button>

              {cacheNotification && (
                <div className="p-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-500/20 text-xs font-bold rounded-lg text-center animate-slide-up">
                  {t.settings.cache_cleaned}
                </div>
              )}

              {importNotification && (
                <div className="p-2 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 border border-emerald-500/20 text-xs font-bold rounded-lg text-center animate-slide-up">
                  {t.settings.import_success}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Right column Information */}
        <div className="md:col-span-5 space-y-6">
          
          {/* About metadata description info panel */}
          <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors duration-300 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-[#007AFF]" />
              <span>{t.settings.about}</span>
            </h3>

            <div className="space-y-3 font-semibold text-xs text-gray-500 dark:text-gray-400">
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800">
                <span>{t.settings.version}</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">v1.2.0 (Stable)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800">
                <span>License</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">MIT Open Source</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800">
                <span>Developer Email</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">tamimsjob@gmail.com</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Target Node Ports</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">3000 Ingress</span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-tr from-[#007AFF]/10 to-[#00C6FF]/5 dark:from-[#007AFF]/20 rounded-xl space-y-2 border border-[#007AFF]/10">
              <h4 className="text-xs font-bold text-[#007AFF] flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Sandbox Security</span>
              </h4>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
                No user credentials or scanned document pages are ever tracked or streamed to external third-party services. Scanner Pro remains a 100% free offline utility.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-105 dark:border-white/10 transition-colors duration-300 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-[#007AFF]" />
              <span>Bilingual Guide FAQ</span>
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">How do I crop images?</p>
                <p className="text-[11px] text-gray-500 mt-0.5 font-semibold">Open the capture page workspace and tap "Apply Enhancements" to access the cropping canvas tool.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">কীভাবে ওসিআর অনুবাদ কাজ করে?</p>
                <p className="text-[11px] text-gray-500 mt-0.5 font-semibold">"রূপান্তরক" ট্যাবে গিয়ে ওসিআর নির্বাচন করুন এবং "ওসিআর রূপান্তর অপারেশন চালান" বাটনটি ক্লিক করুন।</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
