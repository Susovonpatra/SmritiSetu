import React, { useState, useEffect } from 'react';
import { LocaleProvider, useLocale } from './context/LocaleContext';
import { DualAuthProvider, useDualAuth } from './context/DualAuthContext';
import { Navbar } from './components/Navbar';
import { PatternTraceGame } from './components/PatternTraceGame';
import { VisualSemanticGame } from './components/VisualSemanticGame';
import { DailyRoutineGame } from './components/DailyRoutineGame';
import { ReminiscenceVault } from './components/ReminiscenceVault';
import { CaregiverDash } from './components/CaregiverDash';
import { AshaMode } from './components/AshaMode';
import { IVRSimulator } from './components/IVRSimulator';
import { PitchArchitectureView } from './components/PitchArchitectureView';
import { ConsentModal } from './components/ConsentModal';
import { EsanjeevaniModal } from './components/EsanjeevaniModal';
import { MotionAlertBanner } from './components/MotionAlertBanner';
import { CaretakerPortal } from './components/CaretakerPortal';
import { PatientPortal } from './components/PatientPortal';

import { useSyncEngine } from './hooks/useSyncEngine';
import { useMotionDetector } from './hooks/useMotionDetector';
import { initDefaultData, db } from './db/db';
import { AlertCircle, Brain, Calendar, Info, Layers, Sparkles, Home, ArrowLeft } from 'lucide-react';

function SmritiSetuApp() {
  const [currentView, setCurrentView] = useState('patient_games');
  const [activeGame, setActiveGame] = useState('pattern'); // 'pattern' | 'visual' | 'routine'
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isTeleconsultOpen, setIsTeleconsultOpen] = useState(false);
  const [selectedTriageForTeleconsult, setSelectedTriageForTeleconsult] = useState(null);
  const [consentSigned, setConsentSigned] = useState(true);
  const [patient, setPatient] = useState({
    id: 1,
    name: 'Bhaben Baruah',
    age: 74,
    abha_id: 'NER-ASM-9821-4412',
    dialect: 'Odia',
    caregiver_name: 'Ananya Baruah',
    caregiver_phone: '+91 94350 12345',
    baseline_latency: 800.0
  });

  const { activeLang, regionInfo, t } = useLocale();
  const { isOnline, isSyncing, lastSyncTime, offlineDriftAlert, syncPendingRecords } = useSyncEngine();
  const { isAlertActive, peakAcceleration, lastDropTime, dismissAlert, simulateDrop } = useMotionDetector();

  // Initialize Dexie seed records
  useEffect(() => {
    initDefaultData().then(async () => {
      const p = await db.patients.toCollection().first();
      if (p) setPatient(p);
      const c = await db.consent.toCollection().first();
      if (c) setConsentSigned(true);
    });
  }, []);

  const handleOpenTeleconsult = (triageRecord = null) => {
    setSelectedTriageForTeleconsult(triageRecord);
    setIsTeleconsultOpen(true);
  };

  const dialect = regionInfo.englishName || 'Odia';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-200">
      {/* Emergency Motion Alert Banner (HTML5 devicemotion >25 m/s^2) */}
      <MotionAlertBanner
        isAlertActive={isAlertActive}
        peakAcceleration={peakAcceleration}
        lastDropTime={lastDropTime}
        onDismiss={dismissAlert}
        onSimulate={simulateDrop}
      />

      {/* 7+ Day On-Device Offline Heuristic Alert */}
      {offlineDriftAlert && (
        <div className="bg-amber-50 border-b border-amber-200 py-2 px-4 text-xs font-semibold text-amber-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{offlineDriftAlert.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Header with Location-Aware Accessible Toggle */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        dialect={dialect}
        onSelectDialect={() => {}}
        isOnline={isOnline}
        isSyncing={isSyncing}
        onTriggerSync={syncPendingRecords}
        onOpenConsent={() => setIsConsentOpen(true)}
        consentSigned={consentSigned}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Universal Back to Home Button on Non-Home Pages */}
        {currentView !== 'patient_games' && (
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentView('patient_games')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border-2 border-slate-300 shadow-sm transition-all hover:-translate-x-0.5 active:translate-x-0 group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-700 group-hover:-translate-x-1 transition-transform" />
              <Home className="w-4 h-4 text-slate-700" />
              <span>{t('nav.backToHome') || 'Back to Home Page'}</span>
            </button>

            <span className="text-xs font-semibold text-slate-400 capitalize hidden sm:inline-block">
              Current Module: <strong className="text-slate-700">{currentView.replace('_', ' ')}</strong>
            </span>
          </div>
        )}

        {/* Tier 1: Patient Cognitive Games (Home View) */}
        {currentView === 'patient_games' && (
          <div className="space-y-6">
            {/* Game Sub-Tab Switcher */}
            <div className="max-w-3xl mx-auto flex items-center justify-center p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/80 shadow-inner">
              <button
                onClick={() => setActiveGame('pattern')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  activeGame === 'pattern'
                    ? 'bg-indigo-900 text-white shadow-sm border border-indigo-950'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Layers className={`w-4 h-4 ${activeGame === 'pattern' ? 'text-indigo-300' : 'text-indigo-700'}`} />
                <span>1. {t('games.patternTitle') || 'PatternTrace Memory'}</span>
              </button>

              <button
                onClick={() => setActiveGame('visual')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  activeGame === 'visual'
                    ? 'bg-emerald-800 text-white shadow-sm border border-emerald-700'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Brain className={`w-4 h-4 ${activeGame === 'visual' ? 'text-emerald-300' : 'text-emerald-700'}`} />
                <span>2. {t('games.visualTitle')}</span>
              </button>

              <button
                onClick={() => setActiveGame('routine')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  activeGame === 'routine'
                    ? 'bg-emerald-800 text-white shadow-sm border border-emerald-700'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Calendar className={`w-4 h-4 ${activeGame === 'routine' ? 'text-emerald-300' : 'text-emerald-700'}`} />
                <span>3. {t('games.routineTitle')}</span>
              </button>
            </div>

            {/* Active Game Component */}
            {activeGame === 'pattern' && (
              <PatternTraceGame
                patientId={patient?.id || 1}
                onComplete={() => setActiveGame('visual')}
              />
            )}

            {activeGame === 'visual' && (
              <VisualSemanticGame
                dialect={dialect}
                onGameComplete={() => setActiveGame('routine')}
              />
            )}

            {activeGame === 'routine' && (
              <DailyRoutineGame
                dialect={dialect}
                onGameComplete={() => setActiveGame('pattern')}
              />
            )}
          </div>
        )}

        {/* Reminiscence Vault */}
        {currentView === 'vault' && (
          <ReminiscenceVault dialect={dialect} />
        )}

        {/* Caregiver Analytics Dashboard */}
        {currentView === 'caregiver' && (
          <CaregiverDash
            patient={patient}
            onOpenTeleconsult={handleOpenTeleconsult}
          />
        )}

        {/* ASHA Companion Door-to-Door Triage */}
        {currentView === 'asha' && (
          <AshaMode
            onOpenTeleconsult={handleOpenTeleconsult}
          />
        )}

        {/* 2G Feature Phone IVR Simulator */}
        {currentView === 'ivr' && (
          <IVRSimulator
            patient={patient}
            dialect={dialect}
          />
        )}

        {/* Caretaker Portal View */}
        {currentView === 'caretaker_portal' && (
          <CaretakerPortal
            onNavigateToPatientPortal={() => setCurrentView('patient_portal')}
            onOpenAnalytics={() => setCurrentView('caregiver')}
          />
        )}

        {/* Patient Portal View */}
        {currentView === 'patient_portal' && (
          <PatientPortal
            onLaunchGame={() => setCurrentView('patient_games')}
            onLaunchVault={() => setCurrentView('vault')}
            onNavigateToCaretaker={() => setCurrentView('caretaker_portal')}
          />
        )}

        {/* Pitch & System Architecture View */}
        {currentView === 'pitch' && (
          <PitchArchitectureView
            onSelectTier={(view) => setCurrentView(view)}
          />
        )}
      </main>

      {/* Accessible Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-6 px-4 border-t-4 border-zinc-950 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white text-base">
              SmritiSetu | <span className="text-emerald-400 font-mono">ସ୍ମୃତିସେତୁ</span>
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Accessible Dementia Localization Engine | Odisha, Gujarat &amp; National Dialects
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span>Server: FastAPI Unified (Port 8000)</span>
            <span>•</span>
            <span>Offline: Dexie.js</span>
            <span>•</span>
            <span>Acoustic Rate: 0.88x</span>
            <span>•</span>
            <span>WCAG AAA Compliant</span>
          </div>
        </div>
      </footer>

      {/* DPDP Consent Modal */}
      <ConsentModal
        isOpen={isConsentOpen}
        onClose={() => setIsConsentOpen(false)}
        onConsentComplete={() => setConsentSigned(true)}
        patient={patient}
      />

      {/* eSanjeevani Teleconsultation Dispatch Modal */}
      <EsanjeevaniModal
        isOpen={isTeleconsultOpen}
        onClose={() => setIsTeleconsultOpen(false)}
        patient={patient}
        triageRecord={selectedTriageForTeleconsult}
      />
    </div>
  );
}

export function App() {
  return (
    <DualAuthProvider>
      <LocaleProvider>
        <SmritiSetuApp />
      </LocaleProvider>
    </DualAuthProvider>
  );
}

export default App;
