import React, { useState, useEffect } from 'react';
import { LocaleProvider, useLocale } from './context/LocaleContext';
import { DualAuthProvider, useDualAuth } from './context/DualAuthContext';
import { Navbar } from './components/Navbar';
import { WelcomeLanding } from './components/WelcomeLanding';
import { DualAuthModal } from './components/DualAuthModal';
import { PatientPortal } from './components/PatientPortal';
import { CaretakerPortal } from './components/CaretakerPortal';
import { AshaMode } from './components/AshaMode';
import { IVRSimulator } from './components/IVRSimulator';
import { PitchArchitectureView } from './components/PitchArchitectureView';
import { ConsentModal } from './components/ConsentModal';
import { EsanjeevaniModal } from './components/EsanjeevaniModal';
import { MotionAlertBanner } from './components/MotionAlertBanner';

import { useSyncEngine } from './hooks/useSyncEngine';
import { useMotionDetector } from './hooks/useMotionDetector';
import { initDefaultData, db } from './db/db';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Error boundary to catch runtime crashes and show a helpful message instead of a blank page
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SmritiSetu Portal Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Something went wrong</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function SmritiSetuApp() {
  const { caretakerUser, patientSession, patientProfile } = useDualAuth();

  // Route state: default to 'landing' for guest/new users, or user's active session
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const patient = localStorage.getItem('smriti_patient_session');
      if (patient) return 'patient_portal';
    }
    return 'landing';
  });

  // Dual Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('caretaker');

  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isTeleconsultOpen, setIsTeleconsultOpen] = useState(false);
  const [selectedTriageForTeleconsult, setSelectedTriageForTeleconsult] = useState(null);
  const [consentSigned, setConsentSigned] = useState(true);

  const [patient, setPatient] = useState({
    id: 1,
    name: '',
    age: '',
    locality: '',
    dementia_duration: '',
    abha_id: '',
    dialect: 'Odia',
    caregiver_name: '',
    caregiver_phone: '',
    baseline_latency: 800.0
  });

  const { activeLang, regionInfo, t } = useLocale();
  const { isOnline, isSyncing, lastSyncTime, offlineDriftAlert, syncPendingRecords } = useSyncEngine();
  const { isAlertActive, peakAcceleration, lastDropTime, dismissAlert, simulateDrop } = useMotionDetector();

  // Sync patient state whenever patientProfile is updated
  useEffect(() => {
    if (patientProfile) {
      setPatient(prev => ({ ...prev, ...patientProfile }));
    }
  }, [patientProfile]);

  // Initialize Dexie seed records
  useEffect(() => {
    initDefaultData().then(async () => {
      const p = await db.patients.toCollection().first();
      if (p) setPatient(prev => ({ ...prev, ...p }));
      const c = await db.consent.toCollection().first();
      if (c) setConsentSigned(true);
    });
  }, []);

  // Update view automatically if caretaker or patient session state changes
  useEffect(() => {
    if (patientSession && currentView === 'landing') {
      setCurrentView('patient_portal');
    }
  }, [patientSession]);

  const handleOpenAuthModal = (tab = 'caretaker') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

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

      {/* Clean, Non-Cluttered Navigation Header */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        dialect={dialect}
        isOnline={isOnline}
        isSyncing={isSyncing}
        onTriggerSync={syncPendingRecords}
        onOpenConsent={() => setIsConsentOpen(true)}
        consentSigned={consentSigned}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Main Page Body Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 min-w-0">
        {/* 1. Welcoming Public Landing Page (Default for new users / guest mode) */}
        {currentView === 'landing' && (
          <WelcomeLanding onOpenAuthModal={handleOpenAuthModal} />
        )}

        {/* 2. Dedicated Patient Companion Portal */}
        {currentView === 'patient_portal' && (
          <PatientPortal onExitToHome={() => setCurrentView('landing')} />
        )}

        {/* 3. Dedicated Caretaker Portal & Clinical Hub */}
        {currentView === 'caretaker_portal' && (
          <ErrorBoundary>
            <CaretakerPortal
              onNavigateToPatientPortal={() => setCurrentView('patient_portal')}
              onOpenTeleconsult={handleOpenTeleconsult}
            />
          </ErrorBoundary>
        )}

        {/* 4. ASHA Companion Door-to-Door Triage */}
        {currentView === 'asha' && (
          <AshaMode onOpenTeleconsult={handleOpenTeleconsult} />
        )}

        {/* 5. 2G Feature Phone IVR Simulator */}
        {currentView === 'ivr' && (
          <IVRSimulator patient={patient} dialect={dialect} />
        )}

        {/* 6. Pitch & System Architecture View */}
        {currentView === 'pitch' && (
          <PitchArchitectureView onSelectTier={(view) => setCurrentView(view)} />
        )}
      </main>

      {/* Accessible Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-4 sm:py-6 px-3 sm:px-4 border-t-4 border-zinc-950 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div>
            <p className="font-bold text-white text-sm sm:text-base">
              SmritiSetu | <span className="text-emerald-400 font-mono">ସ୍ମୃତିସେତୁ</span>
            </p>
            <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">
              Accessible Dementia Localization Engine | Odisha, Gujarat &amp; National Dialects
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3 text-[10px] sm:text-xs font-semibold text-zinc-400">
            <span>Server: FastAPI (8000)</span>
            <span>•</span>
            <span>Offline: Dexie.js</span>
            <span>•</span>
            <span>Acoustic Rate: 0.88x</span>
            <span>•</span>
            <span>WCAG AAA Compliant</span>
          </div>
        </div>
      </footer>

      {/* Dual Portal Login / Sign-Up Modal */}
      <DualAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
        onSuccess={(targetView) => setCurrentView(targetView)}
      />

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
