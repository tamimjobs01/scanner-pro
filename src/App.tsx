import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WelcomeBanner } from './components/WelcomeBanner';
import { ScannerTab } from './components/ScannerTab';
import { EnhanceEditor } from './components/EnhanceEditor';
import { ConverterTab } from './components/ConverterTab';
import { HistoryTab } from './components/HistoryTab';
import { SettingsTab } from './components/SettingsTab';

import { 
  getAllScans, saveScan, deleteScan, 
  getAllConversions, saveConversion, deleteConversion, clearAllConversions, 
  getStorageEstimate 
} from './db';
import { translations } from './locales';
import { 
  ScannedPage, ScannedDoc, ConversionHistoryItem, 
  LanguageType, ThemeType 
} from './types';

import { 
  Camera, FileText, History, Settings, Sparkles, HardDrive, 
  Crop, Trash2, ArrowRight, Share2, HelpCircle, Eye, RefreshCw, Grid, Layers, List
} from 'lucide-react';

export default function App() {
  // Navigation & Core States
  const [activeTab, setActiveTab] = useState<string>('home');
  const [language, setLanguage] = useState<LanguageType>('en');
  const [theme, setTheme] = useState<ThemeType>('light');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // IndexedDB archives
  const [scannedCount, setScannedCount] = useState<number>(0);
  const [conversions, setConversions] = useState<ConversionHistoryItem[]>([]);
  const [storagePercentage, setStoragePercentage] = useState<number>(12);

  // Active capturing session pages state memory
  const [sessionPages, setSessionPages] = useState<ScannedPage[]>([]);
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);

  // Sync network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Hydrate preferences and IndexedDB totals
  useEffect(() => {
    // 1. Language
    const savedLang = localStorage.getItem('scanner_lang') as LanguageType;
    if (savedLang) {
      setLanguage(savedLang);
    }

    // 2. Theme
    const savedTheme = localStorage.getItem('scanner_theme') as ThemeType;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    // 3. Database hydration
    hydrateDatabaseMeta();
  }, []);

  // Apply theme class to document body
  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-[#0A0A0A]', 'text-white');
      document.body.classList.remove('bg-white', 'text-gray-900');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('bg-white', 'text-gray-900');
      document.body.classList.remove('bg-[#0A0A0A]', 'text-white');
    }
    localStorage.setItem('scanner_theme', theme);
  }, [theme]);

  // Sync selected language preference
  const handleLanguageChange = (lang: LanguageType) => {
    setLanguage(lang);
    localStorage.setItem('scanner_lang', lang);
  };

  const hydrateDatabaseMeta = async () => {
    try {
      const convs = await getAllConversions();
      setConversions(convs || []);
      
      const quota = await getStorageEstimate();
      setStoragePercentage(quota.percentage);
    } catch (err) {
      console.warn('DB hydration error:', err);
    }
  };

  // Add individual page captured in session
  const handlePageCaptured = (page: ScannedPage) => {
    setSessionPages(prev => [...prev, page]);
    // Immediately navigate to workspace of session pages
    setActiveTab('batch');
  };

  // Enhance page details
  const handleApplyPageEnhance = (updated: ScannedPage) => {
    if (editingPageIndex !== null) {
      setSessionPages(prev => {
        const copy = [...prev];
        copy[editingPageIndex] = updated;
        return copy;
      });
      setEditingPageIndex(null);
      setActiveTab('batch');
    }
  };

  // Add a final finished document or file translation to database
  const handleAddConversionToHistory = async (item: ConversionHistoryItem) => {
    try {
      await saveConversion(item);
      await hydrateDatabaseMeta();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete history action item
  const handleDeleteHistoryItem = async (id: string) => {
    try {
      await deleteConversion(id);
      await hydrateDatabaseMeta();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearHistoryList = async () => {
    try {
      await clearAllConversions();
      await hydrateDatabaseMeta();
    } catch (err) {
      console.error(err);
    }
  };

  // Export database items download backup JSON
  const handleExportBackupJson = () => {
    const dataStrStr = JSON.stringify({
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      conversions: conversions
    }, null, 2);

    const blob = new Blob([dataStrStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ScannerPro_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Restore database backups
  const handleImportBackupJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.conversions && Array.isArray(parsed.conversions)) {
          for (const item of parsed.conversions) {
            await saveConversion(item);
          }
          await hydrateDatabaseMeta();
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  // Quick preset shortcuts navigation
  const handleTabShortcut = (tab: string) => {
    setActiveTab(tab);
  };

  const t = translations[language];

  return (
    <div className="min-h-screen flex flex-col justify-between transition-colors duration-300">
      
      {/* Dynamic Navigation Header Panel */}
      <Header
        language={language}
        setLanguage={handleLanguageChange}
        theme={theme}
        setTheme={setTheme}
        storagePercentage={storagePercentage}
        isOnline={isOnline}
        onNavigate={handleTabShortcut}
        activeTab={activeTab}
      />

      {/* Main Viewport Content Block */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-28">
        
        {/* VIEW 1: HOME PANEL */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in relative" id="home-dashboard">
            {/* Ambient Background Light Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
            
            {/* Onboarding welcome banner */}
            <WelcomeBanner language={language} onNavigate={handleTabShortcut} />

            {/* Quick launcher nodes list */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t.home.quick_actions}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="home-cards-grid">
                
                {[
                  { id: 'scanner', title: t.scanner.title, desc: 'Capture paper scans', color: 'from-[#007AFF] to-[#00C6FF]', icon: Camera },
                  { id: 'converter', title: t.nav.converter, desc: 'Image to PDF sytes', color: 'from-[#0A84FF] to-[#30B0FF]', icon: FileText },
                  { id: 'history', title: t.history.title, desc: 'Library local items', color: 'from-blue-600 to-indigo-500', icon: History },
                  { id: 'settings', title: t.settings.title, desc: 'Hue theme config options', color: 'from-gray-700 to-gray-500 dark:from-gray-800 dark:to-gray-600', icon: Settings }
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.id}
                      onClick={() => handleTabShortcut(card.id)}
                      className="bg-white dark:bg-white/5 dark:backdrop-blur-md p-5 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-[#007AFF]/30 dark:hover:border-[#007AFF]/60 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-blue-glow flex flex-col justify-between h-36 z-10"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-sm`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-1">
                          <span>{card.title}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-semibold break-words">
                          {card.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>

            {/* Offline-First notifications warning banner */}
            {!isOnline && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/10 rounded-2xl flex items-start space-x-3 text-amber-600 dark:text-amber-400">
                <HardDrive className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h5 className="font-extrabold text-sm">Offline Workspace Active</h5>
                  <p className="text-xs leading-relaxed mt-1 font-medium text-amber-700 dark:text-amber-500">
                    You can capture new photos, apply high-contrast shaders, and export fully compiled PDFs seamlessly without internet connection. Cloud-based Gemini OCR text translation services will automatically resume when online network connection is restored.
                  </p>
                </div>
              </div>
            )}

            {/* Recent Activites table */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t.home.recent_activity}
              </h3>

              {conversions.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-gray-150 dark:border-white/10 bg-white dark:bg-white/5 dark:backdrop-blur-md z-10 relative">
                  <FileText className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-650 mb-2" />
                  <p className="text-xs text-gray-400 dark:text-white/40">
                    {t.home.no_activity}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 z-10 relative">
                  {conversions.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-white/5 dark:backdrop-blur-md p-4 rounded-xl border border-gray-100 dark:border-white/10 flex items-center justify-between hover:border-[#007AFF]/40 transition-colors"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 flex items-center justify-center text-[#007AFF]">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white break-all">{item.filename}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-semibold">
                            {item.type} • {item.date} • {item.size}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTabShortcut('history')}
                        className="text-xs text-gray-500 hover:text-[#007AFF] font-bold"
                      >
                        Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW 2: CAMERA CAPTURING MODULES */}
        {activeTab === 'scanner' && (
          <ScannerTab
            language={language}
            onPageCaptured={handlePageCaptured}
            onNavigate={handleTabShortcut}
            scannedCount={sessionPages.length}
          />
        )}

        {/* VIEW 3: IMAGE ENHANCE SLIDERS MODULES */}
        {activeTab === 'enhance' && editingPageIndex !== null && (
          <EnhanceEditor
            language={language}
            page={sessionPages[editingPageIndex]}
            onSave={handleApplyPageEnhance}
            onCancel={() => {
              setEditingPageIndex(null);
              setActiveTab('batch');
            }}
          />
        )}

        {/* VIEW 4: BATCH CHRONOLOGY LIST PAGES */}
        {activeTab === 'batch' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative" id="batch-workspace">
            <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-[#007AFF]" />
                  <span>{t.batch.title} ({sessionPages.length} {sessionPages.length === 1 ? 'Page' : 'Pages'})</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t.batch.swipe_hint}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('scanner')}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {t.batch.add_page}
                </button>
                <button
                  onClick={() => setSessionPages([])}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 hover:text-rose-600 text-rose-505 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {t.batch.delete_all}
                </button>
              </div>
            </div>

            {sessionPages.length === 0 ? (
              <div className="p-16 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl bg-white dark:bg-white/5 dark:backdrop-blur-md">
                <Camera className="w-12 h-12 mx-auto text-gray-300 dark:text-white/20 mb-4 animate-bounce" />
                <h3 className="text-sm font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">{t.home.no_activity}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Launch the camera scanner viewport and snapshot original sheets to compile.
                </p>
                <button
                  onClick={() => setActiveTab('scanner')}
                  className="mt-6 px-6 py-3 bg-[#007AFF] hover:bg-[#0051D5] text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105 shadow-blue-glow"
                >
                  Open Document Camera
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Thumbnails grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" id="batch-thumbs-grid">
                  {sessionPages.map((page, index) => (
                    <div
                      key={page.id}
                      className="bg-white dark:bg-white/5 p-3 rounded-2xl border border-gray-150 dark:border-white/10 hover:border-[#007AFF]/30 shadow-xs relative flex flex-col justify-between transition-all hover:scale-[1.01]"
                    >
                      <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white z-10">
                        Page {index + 1}
                      </span>
                      
                      {/* Delete node shortcut */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionPages(prev => prev.filter(p => p.id !== page.id));
                        }}
                        className="absolute top-4 right-4 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded shadow-md z-10 cursor-pointer"
                      >
                        <Trash2 className="w-3" />
                      </button>

                      {/* Display page */}
                      <div 
                        onClick={() => {
                          setEditingPageIndex(index);
                          setActiveTab('enhance');
                        }}
                        className="aspect-[3/4] rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 cursor-pointer relative group"
                      >
                        <img
                          src={page.enhancedUrl || page.originalUrl}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold space-x-1">
                          <Crop className="w-4.5 h-4.5" />
                          <span>Tap to Enhance</span>
                        </div>
                      </div>

                      {/* Custom filters indicators status labels */}
                      <div className="mt-3 flex justify-between items-center text-[10px] text-gray-400 font-semibold uppercase">
                        <span>Rot: {page.rotation}°</span>
                        <span>BW: {page.bwEnabled ? 'On' : 'Off'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compilation routing shortcuts */}
                <div className="p-6 bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl shadow-xs border border-gray-150 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-left">
                    <span className="text-[10px] font-extrabold uppercase text-[#007AFF] tracking-wider">Session complete</span>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 font-sans">Ready to compiled into single Digital PDF document?</h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('converter')}
                    className="px-6 py-3 bg-[#007AFF] hover:bg-[#0051D5] text-white font-bold text-sm rounded-xl shadow-md shadow-blue-glow flex items-center space-x-2 cursor-pointer animate-pulse"
                  >
                    <span>{t.batch.convert_pdf}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

        {/* VIEW 5: MULTI FORMAT CONVERTER TASKS */}
        {activeTab === 'converter' && (
          <ConverterTab
            language={language}
            pages={sessionPages}
            onAddConversionHistory={handleAddConversionToHistory}
            onNavigate={handleTabShortcut}
          />
        )}

        {/* VIEW 6: HISTORY ARCHIVES LIST */}
        {activeTab === 'history' && (
          <HistoryTab
            language={language}
            historyList={conversions}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistoryList}
          />
        )}

        {/* VIEW 7: APP SETTINGS OPTIONS */}
        {activeTab === 'settings' && (
          <SettingsTab
            language={language}
            setLanguage={handleLanguageChange}
            theme={theme}
            setTheme={setTheme}
            storagePercentage={storagePercentage}
            onClearHistoryList={handleClearHistoryList}
            onExportBackupJson={handleExportBackupJson}
            onImportBackupJson={handleImportBackupJson}
            onNavigate={handleTabShortcut}
          />
        )}

      </main>

      {/* FOOTER MOBILE TAB NAVIGATION BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/60 border-t border-gray-200 dark:border-white/10 backdrop-blur-xl py-2 shadow-2xl transition-colors duration-300">
        <div className="max-w-md mx-auto px-6 flex justify-between items-center">
          {[
            { id: 'home', label: t.nav.home, icon: FileText },
            { id: 'scanner', label: t.nav.scanner, icon: Camera },
            { id: 'converter', label: t.nav.converter, icon: Sparkles },
            { id: 'history', label: t.nav.history, icon: History },
            { id: 'settings', label: t.nav.settings, icon: Settings }
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id || (item.id === 'scanner' && activeTab === 'batch') || (item.id === 'scanner' && activeTab === 'enhance');
            return (
              <button
                key={item.id}
                onClick={() => handleTabShortcut(item.id)}
                className={`flex flex-col items-center justify-center py-1 cursor-pointer select-none outline-none focus:outline-none transition-colors duration-200 relative ${
                  active 
                    ? 'text-[#007AFF] dark:text-blue-500 font-bold drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' 
                    : 'text-gray-400 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/60'
                }`}
                style={{ width: '60px' }}
                id={`footer-nav-${item.id}`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] tracking-tight truncate">{item.label}</span>
                {active && (
                  <span className="absolute bottom-0 w-5 h-0.5 bg-[#007AFF] dark:bg-blue-500 rounded-full shadow-green-glow" />
                )}
              </button>
            );
          })}
        </div>
      </footer>

    </div>
  );
}
