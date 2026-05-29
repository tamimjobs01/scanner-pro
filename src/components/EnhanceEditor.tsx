import React, { useState, useEffect, useRef } from 'react';
import { applyImageEnhancements } from '../imageUtils';
import { Sliders, RotateCw, RefreshCw, Scissors, Sparkles, Check, ChevronRight, Eye } from 'lucide-react';
import { translations } from '../locales';
import { LanguageType, ScannedPage } from '../types';

interface EnhanceEditorProps {
  language: LanguageType;
  page: ScannedPage;
  onSave: (updatedPage: ScannedPage) => void;
  onCancel: () => void;
}

export function EnhanceEditor({
  language,
  page,
  onSave,
  onCancel
}: EnhanceEditorProps) {
  const t = translations[language];

  // Clone active state config
  const [config, setConfig] = useState<ScannedPage>({ ...page });
  const [processedUrl, setProcessedUrl] = useState<string>(page.enhancedUrl || page.originalUrl);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [compareMode, setCompareMode] = useState<'both' | 'original' | 'enhanced'>('enhanced');

  // Trigger real-time canvas render when filters/sliders change
  useEffect(() => {
    let active = true;
    const renderTimer = setTimeout(async () => {
      setIsProcessing(true);
      try {
        const outBase64 = await applyImageEnhancements(page.originalUrl, config);
        if (active) {
          setProcessedUrl(outBase64);
        }
      } catch (err) {
        console.error('Enhancer pixel loop crashed:', err);
      } finally {
        if (active) setIsProcessing(false);
      }
    }, 180); // Debounce slider events slightly for flawless UI response

    return () => {
      active = false;
      clearTimeout(renderTimer);
    };
  }, [
    config.rotation,
    config.brightness,
    config.contrast,
    config.saturation,
    config.sharpness,
    config.bwEnabled,
    config.bwThreshold,
    config.filter,
    config.cropRect
  ]);

  const updateSetting = (key: keyof ScannedPage, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // Preset rotation handlers
  const rotateRight = () => {
    const current = config.rotation;
    updateSetting('rotation', (current + 90) % 360);
  };

  // Quick preset filter button selects
  const toggleBw = () => {
    updateSetting('bwEnabled', !config.bwEnabled);
  };

  const handleSavePage = () => {
    // Copy computed enhanced url as final output
    onSave({
      ...config,
      enhancedUrl: processedUrl
    });
  };

  const handleReset = () => {
    setConfig({
      ...page,
      rotation: 0,
      brightness: 50,
      contrast: 50,
      saturation: 50,
      sharpness: 0,
      bwEnabled: false,
      bwThreshold: 128,
      filter: 'none',
      cropRect: null
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6" id="enhance-viewport">
      
      {/* Editor top navigation bar */}
      <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-[#007AFF] animate-spin-slow" />
              <span>{t.enhance.title}</span>
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Apply structural sharpening, white thresholds, and contrast enhancements
            </p>
          </div>
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl cursor-pointer transition-colors"
            >
              {t.scanner.cancel}
            </button>
            <button
              onClick={handleSavePage}
              className="px-5 py-2.5 bg-[#007AFF] hover:bg-[#0051D5] text-white text-sm font-semibold rounded-xl shadow-md cursor-pointer transition-transform hover:scale-[1.02] flex items-center space-x-2"
              id="enhance-save-btn"
            >
              <Check className="w-4 h-4" />
              <span>{t.enhance.save_btn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Picture Display, featuring compare slider triggers */}
        <div className="lg:col-span-7 bg-gray-50 dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-4 border border-gray-200 dark:border-white/10 flex flex-col justify-between space-y-4">
          
          {/* Comparison Mode Toggles */}
          <div className="flex items-center justify-between bg-white dark:bg-white/5 dark:backdrop-blur-sm p-1.5 rounded-xl border border-gray-105 dark:border-white/10">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-bold px-2 uppercase tracking-wide">
              {t.enhance.original_v_enhanced}
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => setCompareMode('original')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                  compareMode === 'original' 
                    ? 'bg-[#007AFF]/10 text-[#007AFF]' 
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Before
              </button>
              <button
                onClick={() => setCompareMode('enhanced')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                  compareMode === 'enhanced' 
                    ? 'bg-[#007AFF]/10 text-[#007AFF]' 
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                After
              </button>
            </div>
          </div>

          {/* Core Image Preview Area */}
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-checkerboard flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-900">
            {isProcessing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-30 flex items-center justify-center text-white text-xs font-bold space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#007AFF]" />
                <span>{t.enhance.processing}</span>
              </div>
            )}
            
            <img
              src={compareMode === 'original' ? page.originalUrl : processedUrl}
              alt="Processed Viewport"
              className="max-w-full max-h-full object-contain shadow-lg rounded-sm rounded-borders transition-opacity filter duration-200"
              id="enhance-preview-view"
            />
          </div>

          <div className="text-center">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Drag filters and sliders below. Processing executes client-side using offscreen HTML5 canvas render buffers.
            </p>
          </div>

        </div>

        {/* Right Side: Slider & Rotator Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Preset Multi-Filters Panel */}
          <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors duration-300">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#007AFF]" />
              <span>{t.enhance.filters}</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'none', label: 'Original Dynamic' },
                { key: 'sepia', label: 'Sepia Retro' },
                { key: 'grayscale', label: 'Grayscale Slate' },
                { key: 'invert', label: 'Invert Film' }
              ].map((filt) => (
                <button
                  key={filt.key}
                  onClick={() => updateSetting('filter', filt.key)}
                  className={`py-2 px-3 border text-xs font-semibold rounded-xl cursor-pointer transition-all text-center ${
                    config.filter === filt.key
                      ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {filt.label}
                </button>
              ))}
            </div>

            {/* B&W conversions */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
              <button
                onClick={toggleBw}
                className={`w-full py-2.5 px-4 border text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                  config.bwEnabled
                    ? 'border-[#007AFF] bg-[#007AFF] text-white shadow-md'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span>{t.enhance.bw_toggle}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${config.bwEnabled ? 'bg-white animate-ping' : 'bg-gray-400'}`} />
              </button>

              {config.bwEnabled && (
                <div className="space-y-1.5 animate-slide-down">
                  <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span>{t.enhance.bw_threshold}</span>
                    <span>{config.bwThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="240"
                    value={config.bwThreshold}
                    onChange={(e) => updateSetting('bwThreshold', Number(e.target.value))}
                    className="w-full accent-[#007AFF] cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Quick Manual Shapers & Rotators */}
          <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors duration-300">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-1.5">
              <RotateCw className="w-4 h-4 text-[#007AFF]" />
              <span>{t.enhance.rotation}</span>
            </h3>

            <div className="flex gap-2">
              <button
                onClick={rotateRight}
                className="flex-1 py-2.5 px-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold rounded-xl text-gray-700 dark:text-gray-300 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>90°</span>
              </button>
              <button
                onClick={() => updateSetting('rotation', 0)}
                className="py-2.5 px-4 border border-gray-200 dark:border-gray-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 text-xs font-bold rounded-xl cursor-pointer"
                title="Reset rotation angles"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Interactive Manual Sliders panel */}
          <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors duration-300 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-[#007AFF]" />
              <span>{t.enhance.sliders}</span>
            </h3>

            {/* Brightness slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span>{t.enhance.brightness}</span>
                <span>{config.brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.brightness}
                onChange={(e) => updateSetting('brightness', Number(e.target.value))}
                className="w-full accent-[#007AFF] cursor-pointer"
              />
            </div>

            {/* Contrast slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span>{t.enhance.contrast}</span>
                <span>{config.contrast}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.contrast}
                onChange={(e) => updateSetting('contrast', Number(e.target.value))}
                className="w-full accent-[#007AFF] cursor-pointer"
              />
            </div>

            {/* Saturation slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span>{t.enhance.saturation}</span>
                <span>{config.saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.saturation}
                onChange={(e) => updateSetting('saturation', Number(e.target.value))}
                className="w-full accent-[#007AFF] cursor-pointer"
              />
            </div>

            {/* Sharpness slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span>{t.enhance.sharpness}</span>
                <span>{config.sharpness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.sharpness}
                onChange={(e) => updateSetting('sharpness', Number(e.target.value))}
                className="w-full accent-[#007AFF] cursor-pointer"
              />
            </div>

            {/* Preset ratios selectors */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-extrabold rounded-xl cursor-pointer transition-colors"
              >
                {t.enhance.reset_btn}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
