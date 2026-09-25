import React, { useState, useEffect } from 'react';
import { LocaleProvider, useLocale } from './context/LocaleContext';
import { Navbar } from './components/Navbar';
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

import { useSyncEngine } from './hooks/useSyncEngine';
import { useMotionDetector } from './hooks/useMotionDetector';
import { initDefaultData, db } from './db/db';
import { AlertCircle, Brain, Calendar, Info } from 'lucide-react';

function SmritiSetuApp() {
  const [currentView, setCurrentView] = useState('patient_games');
  const [activeGame, setActiveGame] = useState('visual'); // 'visual' or 'routine'
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
    <div className="min-h-screen bg-[#FFFDF7] text-[#0A0A0A] flex flex-col font-sans selection:bg-emerald-200">
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
        <div className="bg-amber-100 border-b-2 border-amber-800 py-2.5 px-4 text-sm font-bold text-amber-950 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <AlertCircle className="w-5 h-5 text-amber-800 shrink-0" />
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Tier 1: Patient Cognitive Games */}
        {currentView === 'patient_games' && (
          <div className="space-y-6">
            {/* Game Sub-Tab Switcher */}
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
              <button
                onClick={() => setActiveGame('visual')}
                className={`min-h-[64px] px-6 rounded-2xl font-black text-lg flex items-center gap-2 border-3 transition-all ${
                  activeGame === 'visual'
                    ? 'bg-emerald-800 text-white border-zinc-900 shadow-[0_4px_0_#18181B]'
                    : 'bg-white text-zinc-800 border-zinc-300 hover:border-zinc-800'
                }`}
              >
                <Brain className="w-6 h-6 text-emerald-400" />
                <span>1. {t('games.visualTitle')}</span>
              </button>

              <button
                onClick={() => setActiveGame('routine')}
                className={`min-h-[64px] px-6 rounded-2xl font-black text-lg flex items-center gap-2 border-3 transition-all ${
                  activeGame === 'routine'
                    ? 'bg-emerald-800 text-white border-zinc-900 shadow-[0_4px_0_#18181B]'
                    : 'bg-white text-zinc-800 border-zinc-300 hover:border-zinc-800'
                }`}
              >
                <Calendar className="w-6 h-6 text-emerald-400" />
                <span>2. {t('games.routineTitle')}</span>
              </button>
            </div>

            {/* Active Game Component */}
            {activeGame === 'visual' ? (
              <VisualSemanticGame
                dialect={dialect}
                onGameComplete={() => setActiveGame('routine')}
              />
            ) : (
              <DailyRoutineGame
                dialect={dialect}
                onGameComplete={() => setActiveGame('visual')}
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
    <LocaleProvider>
      <SmritiSetuApp />
    </LocaleProvider>
  );
}

export default App;
