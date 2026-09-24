import React from 'react';
import { Wifi, WifiOff, RefreshCw, ShieldCheck, Heart, Sparkles, Brain, Users, Phone, LayoutGrid } from 'lucide-react';
import { DementiaLanguageToggle } from './DementiaLanguageToggle';
import { useLocale } from '../context/LocaleContext';

export function Navbar({
  currentView,
  onSelectView,
  dialect,
  onSelectDialect,
  isOnline,
  isSyncing,
  onTriggerSync,
  onOpenConsent,
  consentSigned
}) {
  const { t, activeLang, regionInfo } = useLocale();

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF7] border-b-4 border-zinc-900 shadow-md">
      {/* Top Banner: Status & Dementia-Accessible 2-Way Language Bar */}
      <div className="bg-zinc-900 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
        {/* Connection & Offline Sync Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi className="w-4 h-4" />
                <span>{t('nav.online')} (Sync Active)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <WifiOff className="w-4 h-4" />
                <span>{t('nav.offline')} (Dexie Local Hub)</span>
              </span>
            )}
          </div>
          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1 text-xs bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg border border-zinc-700"
            title="Sync Dexie to Server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : t('nav.sync')}</span>
          </button>
        </div>

        {/* Location-Aware Dementia Language Switcher & Consent Button */}
        <div className="flex flex-wrap items-center gap-3">
          <DementiaLanguageToggle />

          <button
            onClick={onOpenConsent}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
              consentSigned 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900' 
                : 'bg-amber-950 text-amber-300 border-amber-700 hover:bg-amber-900 animate-pulse'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{consentSigned ? t('nav.consentSigned') : t('nav.signConsent')}</span>
          </button>
        </div>
      </div>

      {/* Main Bar: Brand & Tab Switcher (Minimum 72px touch targets for accessibility) */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => onSelectView('pitch')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-2xl border-2 border-zinc-900 shadow-[0_3px_0_#18181B] group-hover:scale-105 transition-transform">
            {regionInfo.nativeName ? regionInfo.nativeName.substring(0, 2) : 'ସ୍ମୃ'}
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight leading-none">
              {regionInfo.nativeName ? regionInfo.nativeName : 'ସ୍ମୃତିସେତୁ'} <span className="text-emerald-800">SmritiSetu</span>
            </h1>
            <p className="text-xs font-bold text-zinc-600 tracking-wide mt-1">
              {t('brandSubtitle')}
            </p>
          </div>
        </div>

        {/* Tab Navigation (Large Touch-Friendly Buttons) */}
        <nav className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSelectView('patient_games')}
            className={`min-h-[58px] px-4 rounded-2xl font-black text-base flex items-center gap-2 border-3 transition-all ${
              currentView === 'patient_games'
                ? 'bg-emerald-800 text-white border-zinc-900 shadow-[0_4px_0_#18181B]'
                : 'bg-white text-zinc-800 border-zinc-400 hover:border-zinc-900'
            }`}
          >
            <Brain className="w-5 h-5 text-emerald-400" />
            <span>{t('nav.cognitiveGames')}</span>
          </button>

          <button
            onClick={() => onSelectView('vault')}
            className={`min-h-[58px] px-4 rounded-2xl font-black text-base flex items-center gap-2 border-3 transition-all ${
              currentView === 'vault'
                ? 'bg-rose-700 text-white border-zinc-900 shadow-[0_4px_0_#18181B]'
                : 'bg-white text-zinc-800 border-zinc-400 hover:border-zinc-900'
            }`}
          >
            <Heart className="w-5 h-5 text-rose-300" />
            <span>{t('nav.memoryVault')}</span>
          </button>

          <button
            onClick={() => onSelectView('caregiver')}
            className={`min-h-[58px] px-4 rounded-2xl font-black text-base flex items-center gap-2 border-3 transition-all ${
              currentView === 'caregiver'
                ? 'bg-indigo-800 text-white border-zinc-900 shadow-[0_4px_0_#18181B]'
                : 'bg-white text-zinc-800 border-zinc-400 hover:border-zinc-900'
            }`}
          >
            <Users className="w-5 h-5 text-indigo-300" />
            <span>{t('nav.caregiverAnalytics')}</span>
          </button>

          <button
            onClick={() => onSelectView('asha')}
            className={`min-h-[58px] px-4 rounded-2xl font-black text-base flex items-center gap-2 border-3 transition-all ${
              currentView === 'asha'
                ? 'bg-teal-800 text-white border-zinc-900 shadow-[0_4px_0_#18181B]'
                : 'bg-white text-zinc-800 border-zinc-400 hover:border-zinc-900'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-teal-300" />
            <span>{t('nav.ashaTriage')}</span>
          </button>

          <button
            onClick={() => onSelectView('ivr')}
            className={`min-h-[58px] px-4 rounded-2xl font-black text-base flex items-center gap-2 border-3 transition-all ${
              currentView === 'ivr'
                ? 'bg-amber-800 text-white border-zinc-900 shadow-[0_4px_0_#18181B]'
                : 'bg-white text-zinc-800 border-zinc-400 hover:border-zinc-900'
            }`}
          >
            <Phone className="w-5 h-5 text-amber-300" />
            <span>{t('nav.ivrPhone')}</span>
          </button>

          <button
            onClick={() => onSelectView('pitch')}
            className={`min-h-[58px] px-4 rounded-2xl font-black text-base flex items-center gap-2 border-3 transition-all ${
              currentView === 'pitch'
                ? 'bg-zinc-900 text-white border-zinc-950 shadow-[0_4px_0_#18181B]'
                : 'bg-white text-zinc-800 border-zinc-400 hover:border-zinc-900'
            }`}
          >
            <LayoutGrid className="w-5 h-5 text-zinc-400" />
            <span>{t('nav.architecture')}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
