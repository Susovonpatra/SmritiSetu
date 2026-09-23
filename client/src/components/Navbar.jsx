import React from 'react';
import { Wifi, WifiOff, RefreshCw, ShieldCheck, Heart, Sparkles, Brain, Users, Phone, LayoutGrid } from 'lucide-react';

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
  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF7] border-b-4 border-zinc-900 shadow-md">
      {/* Top Banner: Status & Language Bar */}
      <div className="bg-zinc-900 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi className="w-4 h-4" />
                <span>Online (Sync Active)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <WifiOff className="w-4 h-4" />
                <span>Offline Mode (Dexie Local Hub)</span>
              </span>
            )}
          </div>
          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1 text-xs bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg border border-zinc-700"
            title="Sync Dexie to FastAPI"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>

        {/* Dialect Selector & Consent Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
            <span className="text-xs text-zinc-400 pl-2">Dialect:</span>
            {['Assamese', 'Manipuri', 'English'].map((lang) => (
              <button
                key={lang}
                onClick={() => onSelectDialect(lang)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  dialect === lang
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                {lang === 'Assamese' ? 'অসমীয়া' : lang === 'Manipuri' ? 'মৈতৈলোন্' : 'EN'}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenConsent}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
              consentSigned 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900' 
                : 'bg-amber-950 text-amber-300 border-amber-700 hover:bg-amber-900 animate-pulse'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{consentSigned ? 'DPDP Consent: Signed' : 'Sign DPDP Consent'}</span>
          </button>
        </div>
      </div>

      {/* Main Bar: Brand & Tab Switcher (Minimum 72px buttons for accessibility) */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => onSelectView('pitch')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-2xl border-2 border-zinc-900 shadow-[0_3px_0_#18181B] group-hover:scale-105 transition-transform">
            স্মৃতি
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight leading-none">
              স্মৃতিসেতু <span className="text-emerald-800">SmritiSetu</span>
            </h1>
            <p className="text-xs font-bold text-zinc-600 tracking-wide mt-1">
              NER Elderly Dementia &amp; Cognitive Support Hub
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
            <span>{dialect === 'Assamese' ? 'জ্ঞান খেল (Games)' : 'Cognitive Games'}</span>
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
            <span>{dialect === 'Assamese' ? 'সোঁৱৰণি ভঁৰাল' : 'Memory Vault'}</span>
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
            <span>Caregiver Analytics</span>
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
            <span>ASHA Triage</span>
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
            <span>2G IVR Phone</span>
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
            <span>3-Tier Architecture</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
