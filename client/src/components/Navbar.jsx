import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Shield,
  Key,
  Heart,
  Users,
  ShieldCheck,
  Phone,
  LayoutGrid,
  RefreshCw,
  LogOut,
  ChevronRight,
  User,
  LogIn,
  ArrowRight
} from 'lucide-react';
import { DementiaLanguageToggle } from './DementiaLanguageToggle';
import { useLocale } from '../context/LocaleContext';
import { useDualAuth } from '../context/DualAuthContext';

export function Navbar({
  currentView,
  onSelectView,
  dialect,
  isOnline,
  isSyncing,
  onTriggerSync,
  onOpenConsent,
  consentSigned,
  onOpenAuthModal
}) {
  const { t, regionInfo } = useLocale();
  const {
    caretakerUser,
    patientSession,
    patientProfile,
    signOutCaretaker,
    signOutPatient
  } = useDualAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Scroll detection
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

  const caretakerDisplayName =
    caretakerUser?.user_metadata?.full_name ||
    caretakerUser?.email?.split('@')[0] ||
    'Caretaker';
  const patientDisplayName = patientSession?.patient_name || patientProfile?.name || 'Patient';

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
        {/* Top Minimalist Bar */}
        <div className="bg-slate-900 text-slate-200 px-3 sm:px-4 py-1.5 sm:py-2 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
            {/* Left: Pure IP Region Indicator */}
            <div className="flex items-center gap-2">
              <DementiaLanguageToggle showRegionOnly />
            </div>

            {/* Right: DPDP Consent & Sync Status */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Show language toggle on top bar only when patient is logged in */}
              {patientSession && (
                <div className="hidden xs:block">
                  <DementiaLanguageToggle showToggleOnly />
                </div>
              )}

              <button
                onClick={onOpenConsent}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-all border cursor-pointer ${
                  consentSigned
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/90'
                    : 'bg-amber-950/80 text-amber-300 border-amber-700/60 hover:bg-amber-900/90 animate-pulse'
                }`}
                title="DPDP Consent Status"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {consentSigned ? t('nav.consentSigned') : t('nav.signConsent')}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Identity - Navigates to Landing Page */}
          <div
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none min-w-0"
            title="SmritiSetu Home"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white flex items-center justify-center font-bold text-base sm:text-xl shadow-sm group-hover:scale-105 transition-transform border border-emerald-600/40 shrink-0">
              {regionInfo.nativeName ? regionInfo.nativeName.substring(0, 2) : 'ସ୍ମୃ'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-xl font-bold tracking-tight text-slate-900 leading-tight font-serif truncate">
                  {regionInfo.nativeName || 'ସ୍ମୃତିସେତୁ'}
                </span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-700 tracking-tight">
                  SmritiSetu
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 tracking-wide truncate hidden xs:block">
                {t('brandSubtitle')}
              </p>
            </div>
          </div>

          {/* Right Action Header Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* 1. If Patient is Logged In */}
            {patientSession ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <div className="hidden sm:flex px-3 py-1.5 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-xl text-xs font-bold items-center gap-1.5 max-w-[160px] truncate">
                  <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 shrink-0" />
                  <span className="truncate">Patient: {patientDisplayName}</span>
                </div>

                <button
                  onClick={signOutPatient}
                  className="px-2.5 sm:px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Exit Patient Session"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline">Exit</span>
                </button>
              </div>
            ) : caretakerUser ? (
              /* 2. If Caretaker is Logged In */
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <button
                  onClick={() => handleNavClick('patient_portal')}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Launch Patient Portal"
                >
                  <Heart className="w-3.5 h-3.5 fill-emerald-200 text-emerald-200 shrink-0" />
                  <span className="hidden sm:inline">Launch Patient View</span>
                  <span className="sm:hidden">Patient View</span>
                </button>

                <div className="hidden md:flex px-3 py-1.5 bg-indigo-50 text-indigo-950 border border-indigo-200 rounded-xl text-xs font-bold items-center gap-1.5 max-w-[150px] truncate">
                  <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">{caretakerDisplayName}</span>
                </div>

                <button
                  onClick={signOutCaretaker}
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              /* 3. If Guest / New Visitor: Prominent Login / Access Portals Button */
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <button
                  onClick={() => onOpenAuthModal && onOpenAuthModal('caretaker')}
                  className="px-3 sm:px-4 py-1.5 sm:py-2.5 bg-slate-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl shadow-md border border-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                  <span className="hidden sm:inline">Login / Access Portals</span>
                  <span className="sm:hidden">Portals</span>
                </button>
              </div>
            )}

            {/* Menu Drawer Toggle */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── FLOATING HAMBURGER BUTTON (When scrolled) ── */}
      <div
        className={`fixed top-3 right-3 sm:top-4 sm:right-4 z-50 transition-all duration-300 ${
          isScrolled
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-75 pointer-events-none'
        }`}
      >
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-900/95 hover:bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md transition-transform hover:scale-105 active:scale-95 group cursor-pointer"
          aria-label="Menu"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:rotate-90 transition-transform duration-300" />
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
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
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
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6 flex-1">
                {/* 1. PORTALS SECTION */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Portals
                  </span>

                  {/* Caretaker Portal */}
                  <div
                    onClick={() => {
                      if (caretakerUser) handleNavClick('caretaker_portal');
                      else {
                        setIsDrawerOpen(false);
                        if (onOpenAuthModal) onOpenAuthModal('caretaker');
                      }
                    }}
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
                            {caretakerUser ? caretakerDisplayName : 'Caretaker Portal'}
                          </h4>
                          {caretakerUser && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {caretakerUser ? 'Clinical analytics & password management' : 'Login or register as Caretaker'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Patient Portal */}
                  <div
                    onClick={() => {
                      if (patientSession) handleNavClick('patient_portal');
                      else {
                        setIsDrawerOpen(false);
                        if (onOpenAuthModal) onOpenAuthModal('patient');
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      currentView === 'patient_portal' || patientSession
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Heart className="w-5 h-5 fill-emerald-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {patientSession ? `Patient: ${patientDisplayName}` : 'Patient Portal'}
                          </h4>
                          {patientSession && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {patientSession ? 'Daily schedule & PatternTrace games' : 'Sign in with caretaker credentials'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* 2. PUBLIC HEALTHCARE MODULES */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Public Health Modules
                  </span>

                  <button
                    onClick={() => handleNavClick('landing')}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      currentView === 'landing'
                        ? 'bg-slate-900 text-white'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="w-4 h-4" />
                      <span>Welcome Overview</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleNavClick('asha')}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      currentView === 'asha'
                        ? 'bg-teal-50 text-teal-900 border border-teal-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <span>ASHA Triage Network</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleNavClick('ivr')}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      currentView === 'ivr'
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-amber-600" />
                      <span>2G Phone IVR Triage</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleNavClick('pitch')}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      currentView === 'pitch'
                        ? 'bg-slate-100 text-slate-900 border border-slate-300'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="w-4 h-4 text-slate-600" />
                      <span>3-Tier Architecture</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span>{isOnline ? 'Network Connected' : 'Offline Storage Active'}</span>
                  </div>
                  <button
                    onClick={onTriggerSync}
                    disabled={isSyncing}
                    className="p-1 text-slate-400 hover:text-slate-600"
                    title="Force Sync"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
