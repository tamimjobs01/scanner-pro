import React, { useState } from 'react';
import { 
  History, Search, Filter, SortAsc, Grid, List, Trash2, Download, 
  Share2, FileText, CheckCircle, ChevronRight, RefreshCw, Layers, Sparkles
} from 'lucide-react';
import { translations } from '../locales';
import { LanguageType, ConversionHistoryItem } from '../types';

interface HistoryTabProps {
  language: LanguageType;
  historyList: ConversionHistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
}

export function HistoryTab({
  language,
  historyList,
  onDeleteHistoryItem,
  onClearHistory
}: HistoryTabProps) {
  const t = translations[language];

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search filter list computation
  const filteredList = historyList
    .filter((item) => {
      const matchSearch = item.filename.toLowerCase().includes(search.toLowerCase());
      if (filterType === 'All') return matchSearch;
      return matchSearch && item.type === filterType;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const handleShareLink = (id: string) => {
    // Elegant fallback: Copy simulation URL sharing link
    const pathStr = `${window.location.origin}/share/document_${id}`;
    navigator.clipboard.writeText(pathStr);
    setCopiedId(id);

    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="history-view">
      
      {/* Top Header Controls Panel */}
      <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <History className="w-5 h-5 text-[#007AFF]" />
              <span>{t.history.title}</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Browse your previously processed and enhanced outputs securely archived in client storage
            </p>
          </div>
          {historyList.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              Clear Entire Database File List
            </button>
          )}
        </div>

        {/* Dynamic Filters Strips */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          
          {/* Search bar input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder={t.history.search_placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm py-2.5 pl-10 pr-4 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-[#007AFF] rounded-xl transition-colors font-medium"
            />
          </div>

          {/* Format selection */}
          <div className="md:col-span-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full text-xs py-3 px-3 bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-[#007AFF] rounded-xl font-semibold cursor-pointer"
            >
              <option value="All">{t.history.all}</option>
              <option value="Image -> PDF">PDF Compilations</option>
              <option value="PDF -> Images">Zipped Scans</option>
              <option value="OCR">Gemini OCR Transcripts</option>
            </select>
          </div>

          {/* Sort selection */}
          <div className="md:col-span-3">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full text-xs py-3 px-3 bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 focus:outline-none focus:border-[#007AFF] rounded-xl font-semibold cursor-pointer"
            >
              <option value="newest">{t.history.newest}</option>
              <option value="oldest">{t.history.oldest}</option>
            </select>
          </div>

        </div>
      </div>

      {/* Primary List Results Display */}
      {filteredList.length === 0 ? (
        <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-16 text-center shadow-sm border border-gray-100 dark:border-white/10">
          <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.history.no_results}</h3>
          <p className="text-xs text-gray-500 mt-2">
            No stored historical database records matches your query. Run compilations first!
          </p>
        </div>
      ) : (
        <div className="space-y-3" id="history-results-root">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-white/5 dark:backdrop-blur-md p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#007AFF]/30 hover:shadow-blue-glow transition-all animate-fade-in"
            >
              
              {/* Type descriptors layout */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-950 border dark:border-gray-800 flex items-center justify-center">
                  {item.type === 'OCR' ? (
                    <Sparkles className="w-5 h-5 text-[#007AFF]" />
                  ) : (
                    <FileText className="w-5 h-5 text-[#007AFF]" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white break-all">
                    {item.filename}
                  </h4>
                  <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-semibold">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md text-gray-600 dark:text-gray-400">
                      {item.type}
                    </span>
                    <span>•</span>
                    <span>{item.date}</span>
                    <span>•</span>
                    <span className="text-gray-600 dark:text-gray-400">{item.size}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons list */}
              <div className="flex items-center space-x-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
                
                {/* Instant Share fallback wrapper API copy link */}
                <button
                  onClick={() => handleShareLink(item.id)}
                  className="p-2 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors cursor-pointer text-xs flex items-center space-x-1"
                  title="Copy Document Sharing Link to clipboard"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{copiedId === item.id ? 'Copied Link' : 'Share'}</span>
                </button>

                {/* Instant Download Base64 stream */}
                {item.url && (
                  <a
                    href={item.url}
                    download={item.filename}
                    className="p-2 border border-[#007AFF] text-[#007AFF] hover:bg-[#007AFF]/5 rounded-xl transition-colors cursor-pointer text-xs flex items-center space-x-1 font-bold"
                    title="Download document base64 payload to disk"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Download</span>
                  </a>
                )}

                {/* Delete Individual entry item */}
                <button
                  onClick={() => onDeleteHistoryItem(item.id)}
                  className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  title="Permadelete scan report"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
