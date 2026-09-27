import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Shield,
  Key,
  Brain,
  Heart,
  Users,
  ShieldCheck,
  Phone,
  LayoutGrid,
  RefreshCw,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { DementiaLanguageToggle } from './DementiaLanguageToggle';
import { useLocale } from '../context/LocaleContext';
import { useDualAuth } from '../context/DualAuthContext';

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
  const { t, regionInfo } = useLocale();
  const { caretakerUser, patientSession, signOutCaretaker, signOutPatient } = useDualAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Scroll detection to hide navbar and show floating hamburger
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 45) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (viewKey) => {
    onSelectView(viewKey);
    setIsDrawerOpen(false);
  };

  const caretakerDisplayName = caretakerUser?.user_metadata?.full_name || caretakerUser?.email?.split('@')[0] || t('nav.caretakerPortal');
  const patientDisplayName = patientSession?.patient_name || t('nav.patientPortal');

  return (
    <>
      {/* ── TOP HEADER / NAVBAR (Slides out smoothly when scrolling down) ── */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ease-in-out ${
          isScrolled
            ? '-translate-y-full opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm'
        }`}
      >
        {/* Top Minimalist Bar: Pure IP Region Pill & Segmented Language Toggle */}
        <div className="bg-slate-900 text-slate-200 px-4 py-2 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Left: Pure IP Region Selector */}
            <div className="flex items-center gap-2">
              <DementiaLanguageToggle showRegionOnly />
            </div>

            {/* Right: Sleek Segmented Switch & Consent Status */}
            <div className="flex items-center gap-3">
              <DementiaLanguageToggle showToggleOnly />

              <button
                onClick={onOpenConsent}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                  consentSigned
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/90'
                    : 'bg-amber-950/80 text-amber-300 border-amber-700/60 hover:bg-amber-900/90 animate-pulse'
                }`}
                title="DPDP Consent Status"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{consentSigned ? t('nav.consentSigned') : t('nav.signConsent')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div
            onClick={() => handleNavClick('pitch')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white flex items-center justify-center font-bold text-xl shadow-sm group-hover:scale-105 transition-transform border border-emerald-600/40">
              {regionInfo.nativeName ? regionInfo.nativeName.substring(0, 2) : 'ସ୍ମୃ'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 leading-tight font-serif">
                  {regionInfo.nativeName || 'ସ୍ମୃତିସେତୁ'}
                </span>
                <span className="text-base font-extrabold text-emerald-700 tracking-tight">
                  SmritiSetu
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 tracking-wide">
                {t('brandSubtitle')}
              </p>
            </div>
          </div>

          {/* Main Primary Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {/* 1. Caretaker Portal */}
            <button
              onClick={() => handleNavClick('caretaker_portal')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                currentView === 'caretaker_portal'
                  ? 'bg-indigo-700 text-white border-indigo-800 shadow-sm'
                  : 'bg-slate-50 text-indigo-900 border-slate-200/80 hover:bg-indigo-50 hover:border-indigo-200'
              }`}
            >
              <Shield className={`w-4 h-4 ${currentView === 'caretaker_portal' ? 'text-indigo-200' : 'text-indigo-600'}`} />
              <span>{caretakerUser ? `${t('nav.caretakerPortal')}: ${caretakerDisplayName}` : t('nav.caretakerPortal')}</span>
            </button>

            {/* 2. Patient Portal */}
            <button
              onClick={() => handleNavClick('patient_portal')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                currentView === 'patient_portal'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                  : 'bg-slate-50 text-emerald-900 border-slate-200/80 hover:bg-emerald-50 hover:border-emerald-200'
              }`}
            >
              <Key className={`w-4 h-4 ${currentView === 'patient_portal' ? 'text-emerald-200' : 'text-emerald-600'}`} />
              <span>{patientSession ? `${t('nav.patientPortal')}: ${patientDisplayName}` : t('nav.patientPortal')}</span>
            </button>

            {/* 3. Cognitive Games */}
            <button
              onClick={() => handleNavClick('patient_games')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                currentView === 'patient_games'
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Brain className={`w-4 h-4 ${currentView === 'patient_games' ? 'text-emerald-300' : 'text-emerald-600'}`} />
              <span>{t('nav.cognitiveGames')}</span>
            </button>

            {/* 4. Memory Vault */}
            <button
              onClick={() => handleNavClick('vault')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                currentView === 'vault'
                  ? 'bg-rose-700 text-white border-rose-800 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Heart className={`w-4 h-4 ${currentView === 'vault' ? 'text-rose-200' : 'text-rose-500'}`} />
              <span>{t('nav.memoryVault')}</span>
            </button>

            {/* 5. Caregiver Analytics */}
            <button
              onClick={() => handleNavClick('caregiver')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                currentView === 'caregiver'
                  ? 'bg-indigo-900 text-white border-indigo-950 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className={`w-4 h-4 ${currentView === 'caregiver' ? 'text-indigo-200' : 'text-indigo-600'}`} />
              <span>{t('nav.caregiverAnalytics')}</span>
            </button>

            {/* In-Navbar Drawer Trigger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors ml-1"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </nav>

          {/* Mobile Menu Icon */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-colors"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── FLOATING HAMBURGER BUTTON (Appears at top-right when scrolled down) ── */}
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
          isScrolled
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-75 pointer-events-none'
        }`}
      >
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md transition-transform hover:scale-105 active:scale-95 group cursor-pointer"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5 text-emerald-400 group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-xs font-bold tracking-wide">{t('nav.menu')}</span>
        </button>
      </div>

      {/* ── SLIDE-OVER DRAWER ── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {regionInfo.nativeName ? regionInfo.nativeName.substring(0, 2) : 'ସ୍ମୃ'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">SmritiSetu Hub</h3>
                    <p className="text-xs text-slate-500">{t('brandSubtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6 flex-1">
                {/* 1. PORTALS & LOGIN ACCESS SECTION */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    {t('nav.caretakerPortal')} &amp; {t('nav.patientPortal')}
                  </span>

                  {/* Caretaker Portal Card */}
                  <div
                    onClick={() => handleNavClick('caretaker_portal')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      currentView === 'caretaker_portal' || caretakerUser
                        ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                        : 'bg-slate-50 border-slate-200 hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {caretakerUser ? caretakerDisplayName : t('nav.caretakerPortal')}
                          </h4>
                          {caretakerUser && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {caretakerUser ? caretakerUser.email : t('caretakerPortal.title')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Patient Portal Card */}
                  <div
                    onClick={() => handleNavClick('patient_portal')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      currentView === 'patient_portal' || patientSession
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {patientSession ? `${t('nav.patientPortal')}: ${patientDisplayName}` : t('nav.patientPortal')}
                          </h4>
                          {patientSession && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {patientSession ? `Linked to ${patientSession.caretaker_name}` : t('patientPortal.title')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* 2. PRIMARY APPLICATION VIEWS */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Application Modules
                  </span>

                  <button
                    onClick={() => handleNavClick('patient_games')}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                      currentView === 'patient_games'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Brain className="w-4 h-4 text-emerald-600" />
                      <span>1. {t('nav.cognitiveGames')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleNavClick('vault')}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                      currentView === 'vault'
                        ? 'bg-rose-50 text-rose-900 border border-rose-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4 text-rose-600" />
                      <span>2. {t('nav.memoryVault')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleNavClick('caregiver')}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                      currentView === 'caregiver'
                        ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>3. {t('nav.caregiverAnalytics')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleNavClick('asha')}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                      currentView === 'asha'
                        ? 'bg-teal-50 text-teal-900 border border-teal-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <span>4. {t('nav.ashaTriage')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleNavClick('ivr')}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                      currentView === 'ivr'
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-amber-600" />
                      <span>5. {t('nav.ivrPhone')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleNavClick('pitch')}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                      currentView === 'pitch'
                        ? 'bg-slate-100 text-slate-900 border border-slate-300'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="w-4 h-4 text-slate-600" />
                      <span>6. {t('nav.architecture')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* 3. LOCALIZATION CONTROLS */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-700">
                    Localization
                  </span>
                  <div className="space-y-2">
                    <DementiaLanguageToggle showToggleOnly className="w-full justify-center" />
                    <DementiaLanguageToggle showRegionOnly className="w-full justify-center" />
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span>{isOnline ? 'Cloud Synced' : 'Offline Local Hub'}</span>
                  </div>
                  <button
                    onClick={onTriggerSync}
                    disabled={isSyncing}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Trigger Dexie Sync"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
                  </button>
                </div>

                {/* Active Session Sign-Out Buttons */}
                {caretakerUser && (
                  <button
                    onClick={() => {
                      signOutCaretaker();
                      setIsDrawerOpen(false);
                    }}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-rose-200 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('caretakerPortal.signOutBtn')} ({caretakerDisplayName})</span>
                  </button>
                )}

                {patientSession && (
                  <button
                    onClick={() => {
                      signOutPatient();
                      setIsDrawerOpen(false);
                    }}
                    className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('patientPortal.exitBtn')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
