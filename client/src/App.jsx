import React, { useState, useEffect } from 'react';
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

export function App() {
  const [currentView, setCurrentView] = useState('patient_games');
  const [activeGame, setActiveGame] = useState('visual'); // 'visual' or 'routine'
  const [dialect, setDialect] = useState('Assamese');
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isTeleconsultOpen, setIsTeleconsultOpen] = useState(false);
  const [selectedTriageForTeleconsult, setSelectedTriageForTeleconsult] = useState(null);
  const [consentSigned, setConsentSigned] = useState(true);
  const [patient, setPatient] = useState({
    id: 1,
    name: 'Bhaben Baruah',
    age: 74,
    abha_id: 'NER-ASM-9821-4412',
    dialect: 'Assamese',
    caregiver_name: 'Ananya Baruah',
    caregiver_phone: '+91 94350 12345',
    baseline_latency: 800.0
  });

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

      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        dialect={dialect}
        onSelectDialect={setDialect}
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
                <span>{dialect === 'Assamese' ? '১. বস্তু চিনি পোৱা খেল' : '1. Visual Semantic Matching'}</span>
              </button>

              <button
                onClick={() => setActiveGame('routine')}
                className={`min-h-[64px] px-6 rounded-2xl font-black text-lg flex items-center gap-2 border-3 transition-all ${
                  activeGame === 'routine'
                    ? 'bg-amber-800 text-white border-zinc-900 shadow-[0_4px_0_#18181B]'
                    : 'bg-white text-zinc-800 border-zinc-300 hover:border-zinc-800'
                }`}
              >
                <Calendar className="w-6 h-6 text-amber-400" />
                <span>{dialect === 'Assamese' ? '২. দৈনিক কামৰ ক্ৰম' : '2. 3-Step Daily Sequencer'}</span>
              </button>
            </div>

            {/* Active Game View */}
            {activeGame === 'visual' ? (
              <VisualSemanticGame dialect={dialect} />
            ) : (
              <DailyRoutineGame dialect={dialect} />
            )}
          </div>
        )}

        {/* Tier 1: Reminiscence Vault */}
        {currentView === 'vault' && (
          <ReminiscenceVault dialect={dialect} />
        )}

        {/* Tier 1: Caregiver Dashboard */}
        {currentView === 'caregiver' && (
          <CaregiverDash
            onOpenTeleconsult={handleOpenTeleconsult}
            patient={patient}
          />
        )}

        {/* Tier 2: ASHA Field Worker Triage Companion */}
        {currentView === 'asha' && (
          <AshaMode
            onOpenTeleconsult={handleOpenTeleconsult}
          />
        )}

        {/* Tier 3: Feature-Phone 2G IVR Simulator */}
        {currentView === 'ivr' && (
          <IVRSimulator dialect={dialect} />
        )}

        {/* Architectural Overview & Pitch View */}
        {currentView === 'pitch' && (
          <PitchArchitectureView
            onSelectTier={(tierKey) => setCurrentView(tierKey)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 border-t-4 border-zinc-950 py-6 px-4 text-center text-sm font-semibold">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-white font-black text-base">স্মৃতিসেতু SmritiSetu</span>
            <p className="text-xs text-zinc-500 mt-0.5">
              Assam &amp; NER Dementia Care Hackathon Strategy | ICMR-NARI &amp; MoCA Compliant
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>Client: Vite + React 19 (JS/PWA)</span>
            <span>•</span>
            <span>Offline: Dexie.js</span>
            <span>•</span>
            <span>Backend: Python FastAPI</span>
            <span>•</span>
            <span>CORS: 5173</span>
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

export default App;
