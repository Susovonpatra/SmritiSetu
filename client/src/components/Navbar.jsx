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
  ArrowRight,
  Mail
} from 'lucide-react';
import { DementiaLanguageToggle } from '@/features/localization/components/DementiaLanguageToggle';
import { useLocale } from '@/features/localization/context/LocaleContext';
import { useDualAuth } from '@/features/auth/context/DualAuthContext';

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

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  const handleNavClick = (viewKey) => {
    onSelectView(viewKey);
    setIsDrawerOpen(false);
  };

  const caretakerDisplayName =
    caretakerUser?.user_metadata?.full_name ||
    caretakerUser?.email?.split('@')[0] ||
    'Caretaker';
  const patientDisplayName = patientSession?.patient_name || patientProfile?.name || 'Patient';

  const currentModeBadge = () => {
    switch (currentView) {
      case 'patient_portal':
        return { label: 'Companion Mode', icon: 'spa' };
      case 'caretaker_portal':
        return { label: 'Clinical Hub', icon: 'monitoring' };
      case 'asha':
        return { label: 'ASHA Triage', icon: 'medical_services' };
      default:
        return { label: 'SmritiSetu Health', icon: 'spa' };
    }
  };

  const mode = currentModeBadge();

  return (
    <>
      {/* ── TOP HEADER / NAVBAR (Stitch Warm Clinical Geriatric) ── */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ease-in-out ${
          isScrolled
            ? '-translate-y-full opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.04)]'
        }`}
      >
        {/* Top Minimalist Bar */}
        <div className="bg-primary text-primary-fixed px-3 sm:px-4 py-1 sm:py-1.5 border-b border-primary-container">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap text-xs">
            {/* Left: Pure IP Region Indicator */}
            <div className="flex items-center gap-2">
              <DementiaLanguageToggle showRegionOnly />
            </div>

            {/* Right: DPDP Consent & Sync Status */}
            <div className="flex items-center gap-2 sm:gap-3">
              {patientSession && (
                <div className="hidden xs:block">
                  <DementiaLanguageToggle showToggleOnly />
                </div>
              )}

              <button
                onClick={onOpenConsent}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-headline font-bold transition-all border cursor-pointer ${
                  consentSigned
                    ? 'bg-primary-container text-primary-fixed border-primary-fixed/40'
                    : 'bg-tertiary-container text-tertiary-fixed border-tertiary-fixed/40 animate-pulse'
                }`}
                title="DPDP Consent Status"
              >
                <span className="material-symbols-outlined text-[14px]">lock</span>
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {consentSigned ? t('nav.consentSigned') : t('nav.signConsent')}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Identity - Stitch Spa Icon & SmritiSetu Logo */}
          <div
            onClick={() => handleNavClick('landing')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNavClick('landing');
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer group select-none min-w-0"
            title="SmritiSetu Home"
            aria-label="SmritiSetu Home"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-[0_2px_8px_-2px_rgba(26,37,48,0.1)] group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[26px] sm:text-[28px]">spa</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline text-lg sm:text-xl text-primary font-bold tracking-tight truncate">
                  SmritiSetu
                </span>
                <div className="w-5 h-5 rounded-full bg-primary-fixed flex items-center justify-center text-primary" title={isOnline ? 'Online Sync Active' : 'Offline Storage Active'}>
                  <span className="material-symbols-outlined text-[13px]">{isOnline ? 'cloud_done' : 'sync_saved_locally'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-headline text-[11px] uppercase tracking-wider text-secondary font-bold truncate">
                  {mode.label}
                </span>
                <span className="text-outline text-[10px]">•</span>
                <span className="font-headline text-[11px] text-on-surface-variant font-medium">
                  {dialect.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Header Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick SOS Helpline Button */}
            <a
              href="tel:+919435012345"
              aria-label="Emergency Helpline"
              className="min-w-[42px] sm:min-w-[48px] h-10 sm:h-11 px-2.5 rounded-xl bg-error text-on-error flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform"
              title="Senior Emergency Helpline"
            >
              <span className="material-symbols-outlined text-[20px]">emergency</span>
              <span className="font-headline text-xs font-bold hidden sm:inline">SOS</span>
            </a>

            {/* 1. If Patient is Logged In */}
            {patientSession ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex px-3 py-1 bg-surface-container text-primary border border-outline-variant/30 rounded-xl text-xs font-headline font-bold items-center gap-1.5 max-w-[160px] truncate">
                  <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                  <span className="truncate">{patientDisplayName}</span>
                </div>

                <button
                  onClick={signOutPatient}
                  className="px-3 py-1.5 bg-surface-container hover:bg-error-container text-on-surface hover:text-on-error-container rounded-xl text-xs font-headline font-bold transition flex items-center gap-1 cursor-pointer border border-outline-variant/30"
                  title="Exit Patient Session"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span className="hidden xs:inline">Exit</span>
                </button>
              </div>
            ) : caretakerUser ? (
              /* 2. If Caretaker is Logged In */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('patient_portal')}
                  className="px-3 py-1.5 sm:py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-headline font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Launch Patient Portal"
                >
                  <span className="material-symbols-outlined text-[18px]">spa</span>
                  <span className="hidden sm:inline">Patient View</span>
                </button>

                <div className="hidden md:flex px-3 py-1 bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl text-xs font-headline font-bold items-center gap-1.5 max-w-[150px] truncate">
                  <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
                  <span className="truncate">{caretakerDisplayName}</span>
                </div>

                <button
                  onClick={signOutCaretaker}
                  className="px-2.5 sm:px-3 py-1.5 bg-surface-container hover:bg-error-container text-on-surface hover:text-on-error-container rounded-xl text-xs font-headline font-bold transition flex items-center gap-1 cursor-pointer border border-outline-variant/30"
                  title="Sign Out"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span className="hidden xs:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              /* 3. If Guest / New Visitor */
              <button
                onClick={() => onOpenAuthModal && onOpenAuthModal('caretaker')}
                className="px-3 sm:px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-headline font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span className="hidden sm:inline">Login / Access Portals</span>
                <span className="sm:hidden">Portals</span>
              </button>
            )}

            {/* Menu Drawer Toggle */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-colors cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
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
            <div className="w-full max-w-sm sm:max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div
                  onClick={() => handleNavClick('landing')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNavClick('landing');
                    }
                  }}
                  className="flex items-center gap-3 cursor-pointer group"
                  aria-label="SmritiSetu Home"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
                    {regionInfo.nativeName ? regionInfo.nativeName.substring(0, 2) : 'ସ୍ମୃ'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">SmritiSetu Hub</h3>
                    <p className="text-xs text-slate-500">{t('brandSubtitle')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close navigation menu"
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
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (caretakerUser) handleNavClick('caretaker_portal');
                        else {
                          setIsDrawerOpen(false);
                          if (onOpenAuthModal) onOpenAuthModal('caretaker');
                        }
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
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (patientSession) handleNavClick('patient_portal');
                        else {
                          setIsDrawerOpen(false);
                          if (onOpenAuthModal) onOpenAuthModal('patient');
                        }
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
                    type="button"
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
                    type="button"
                    onClick={() => handleNavClick('exercises')}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      currentView === 'exercises'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'hover:bg-orange-50 text-slate-700 hover:text-orange-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-secondary">shapes</span>
                      <span>Shape Match &amp; Cognitive Games</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                      Tier 2
                    </span>
                  </button>

                  <button
                    type="button"
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
                    type="button"
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
                    type="button"
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

              {/* Drawer Footer with Clickable Phone & Email Links */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/70 space-y-4">
                {/* Emergency Contact Links */}
                <div className="space-y-2 text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Direct Assistance
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <a
                      href="tel:14416"
                      className="inline-flex items-center gap-2 text-emerald-800 font-bold hover:underline"
                      title="Call Tele-MANAS Helpline"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Helpline: 14416 (Toll-Free)</span>
                    </a>
                    <a
                      href="tel:+919435012345"
                      className="inline-flex items-center gap-2 text-slate-700 font-semibold hover:underline"
                      title="Call SmritiSetu Support"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>+91 94350 12345</span>
                    </a>
                    <a
                      href="mailto:support@smritisetu.in"
                      className="inline-flex items-center gap-2 text-slate-700 font-semibold hover:underline"
                      title="Email SmritiSetu Support"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>support@smritisetu.in</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span>{isOnline ? 'Network Connected' : 'Offline Storage Active'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onTriggerSync}
                    disabled={isSyncing}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
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

      {/* ── STITCH UNIFIED BOTTOM TAB NAVIGATION BAR ── */}
      <nav
        aria-label="Portal Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-surface/95 backdrop-blur-xl border-t border-outline-variant/30 shadow-[0_-2px_12px_rgba(0,0,0,0.05)]"
      >
        <div className="flex justify-around items-center h-16 sm:h-20 px-2 max-w-lg mx-auto">
          {/* 1. Companion */}
          <button
            onClick={() => handleNavClick('patient_portal')}
            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-14 transition-colors cursor-pointer ${
              currentView === 'patient_portal'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: currentView === 'patient_portal' ? "'FILL' 1" : "'FILL' 0" }}
            >
              home
            </span>
            <span className="font-headline text-[11px]">Companion</span>
          </button>

          {/* 2. Exercises */}
          <button
            onClick={() => handleNavClick('exercises')}
            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-14 transition-colors cursor-pointer ${
              currentView === 'exercises'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: currentView === 'exercises' ? "'FILL' 1" : "'FILL' 0" }}
            >
              psychology
            </span>
            <span className="font-headline text-[11px]">Exercises</span>
          </button>

          {/* 3. Analytics */}
          <button
            onClick={() => handleNavClick('caretaker_portal')}
            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-14 transition-colors cursor-pointer ${
              currentView === 'caretaker_portal'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: currentView === 'caretaker_portal' ? "'FILL' 1" : "'FILL' 0" }}
            >
              monitoring
            </span>
            <span className="font-headline text-[11px]">Analytics</span>
          </button>

          {/* 4. ASHA Triage */}
          <button
            onClick={() => handleNavClick('asha')}
            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-14 transition-colors cursor-pointer ${
              currentView === 'asha'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: currentView === 'asha' ? "'FILL' 1" : "'FILL' 0" }}
            >
              medical_services
            </span>
            <span className="font-headline text-[11px]">ASHA Triage</span>
          </button>
        </div>
      </nav>
    </>
  );
}
