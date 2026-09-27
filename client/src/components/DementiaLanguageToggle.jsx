import React from 'react';
import { useLocale } from '../context/LocaleContext';
import { Globe, Check } from 'lucide-react';

/**
 * Modern Formal Segmented Language Switcher & IP-based Region Pill
 */
export function DementiaLanguageToggle({ className = '', showRegionOnly = false, showToggleOnly = false }) {
  const {
    activeLang,
    availablePair,
    regionInfo,
    toggleLanguage
  } = useLocale();

  const [primaryLang, secondaryLang] = availablePair;

  const LANG_LABELS = {
    or: { native: 'ଓଡ଼ିଆ', english: 'ODIA' },
    gu: { native: 'ગુજરાતી', english: 'GUJARATI' },
    as: { native: 'অসমীয়া', english: 'ASSAMESE' },
    en: { native: 'English', english: 'EN-IN' }
  };

  const primaryMeta = LANG_LABELS[primaryLang] || { native: 'ଓଡ଼ିଆ', english: 'ODIA' };
  const isPrimaryActive = activeLang === primaryLang;

  // 1. Render ONLY Region Pill (No manual simulation buttons, displays IP-detected Region)
  if (showRegionOnly) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 text-slate-200 rounded-xl border border-slate-700/80 text-xs font-medium shadow-sm backdrop-blur ${className}`}>
        <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-slate-300">
          Region: <strong className="text-emerald-400 font-semibold">{regionInfo.stateName || 'Odisha'}</strong>
        </span>
      </div>
    );
  }

  // 2. Render Language Segmented Switch
  if (showToggleOnly) {
    return (
      <div className={`inline-flex items-center p-1 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-inner backdrop-blur ${className}`}>
        {/* State 1: Regional Language (e.g. Odia) */}
        <button
          type="button"
          role="switch"
          aria-checked={isPrimaryActive}
          onClick={() => { if (!isPrimaryActive) toggleLanguage(); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 select-none cursor-pointer ${
            isPrimaryActive
              ? 'bg-emerald-800 text-white border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {isPrimaryActive && <Check className="w-3.5 h-3.5 text-emerald-300" />}
          <span className="font-bold tracking-wide">{primaryMeta.native}</span>
          <span className="text-[10px] uppercase opacity-75">{primaryMeta.english}</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-700/60 mx-1" aria-hidden="true" />

        {/* State 2: English */}
        <button
          type="button"
          role="switch"
          aria-checked={!isPrimaryActive}
          onClick={() => { if (isPrimaryActive) toggleLanguage(); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 select-none cursor-pointer ${
            !isPrimaryActive
              ? 'bg-emerald-800 text-white border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {!isPrimaryActive && <Check className="w-3.5 h-3.5 text-emerald-300" />}
          <span className="font-bold">English</span>
          <span className="text-[10px] uppercase opacity-75">EN-IN</span>
        </button>
      </div>
    );
  }

  // Combined fallback
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {/* 2-State Language Toggle */}
      <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-700/80 rounded-xl shadow-inner">
        <button
          type="button"
          role="switch"
          aria-checked={isPrimaryActive}
          onClick={() => { if (!isPrimaryActive) toggleLanguage(); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none cursor-pointer ${
            isPrimaryActive
              ? 'bg-emerald-800 text-white border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {isPrimaryActive && <Check className="w-3.5 h-3.5 text-emerald-300" />}
          <span className="font-bold">{primaryMeta.native}</span>
          <span className="text-[10px] uppercase opacity-80">{primaryMeta.english}</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-700 mx-1" aria-hidden="true" />

        <button
          type="button"
          role="switch"
          aria-checked={!isPrimaryActive}
          onClick={() => { if (isPrimaryActive) toggleLanguage(); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none cursor-pointer ${
            !isPrimaryActive
              ? 'bg-emerald-800 text-white border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {!isPrimaryActive && <Check className="w-3.5 h-3.5 text-emerald-300" />}
          <span className="font-bold">English</span>
          <span className="text-[10px] uppercase opacity-80">EN-IN</span>
        </button>
      </div>

      {/* Sleek Region Pill (Auto IP) */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-slate-300 rounded-xl border border-slate-700/80 text-xs font-medium shadow-sm">
        <Globe className="w-3.5 h-3.5 text-emerald-400" />
        <span>Region: <strong className="text-emerald-400 font-semibold">{regionInfo.stateName || 'Odisha'}</strong></span>
      </div>
    </div>
  );
}
