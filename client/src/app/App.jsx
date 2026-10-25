import React, { useState, useEffect, lazy, Suspense } from 'react';
import { LocaleProvider, useLocale } from '@/features/localization/context/LocaleContext';
import { DualAuthProvider, useDualAuth } from '@/features/auth/context/DualAuthContext';
import { Navbar } from '@/components/Navbar';
import { WelcomeLanding } from '@/components/WelcomeLanding';
import { DualAuthModal } from '@/features/auth/components/DualAuthModal';
import { ConsentModal } from '@/features/consent/components/ConsentModal';
import { EsanjeevaniModal } from '@/features/teleconsult/components/EsanjeevaniModal';
import { MotionAlertBanner } from '@/components/MotionAlertBanner';

import { useSyncEngine } from '@/hooks/useSyncEngine';
import { useMotionDetector } from '@/hooks/useMotionDetector';
import { initDefaultData, db } from '@/db/db';
import { AlertCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Footer } from '@/components/Footer';
import { NotFoundView } from '@/components/NotFoundView';

// Lazy-loaded routes for code splitting and optimal bundle performance
const PatientPortal = lazy(() => import('@/features/patient/components/PatientPortal').then(m => ({ default: m.PatientPortal })));
const CaretakerPortal = lazy(() => import('@/features/caretaker/components/CaretakerPortal').then(m => ({ default: m.CaretakerPortal })));
const AshaMode = lazy(() => import('@/features/asha/components/AshaMode').then(m => ({ default: m.AshaMode })));
const IVRSimulator = lazy(() => import('@/features/ivr/components/IVRSimulator').then(m => ({ default: m.IVRSimulator })));
const PitchArchitectureView = lazy(() => import('@/features/pitch/components/PitchArchitectureView').then(m => ({ default: m.PitchArchitectureView })));

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

  // Dynamic document title update per active route and localized dialect
  useEffect(() => {
    const titles = {
      landing: 'SmritiSetu | AI Cognitive & Memory Platform for Elderly Dementia',
      patient_portal: 'Patient Companion Portal | SmritiSetu',
      exercises: 'Cognitive Exercises & Shape Match | SmritiSetu',
      caretaker_portal: 'Caretaker Clinical Hub | SmritiSetu',
      asha: 'ASHA Door-to-Door Triage Network | SmritiSetu',
      ivr: '2G Feature Phone IVR Simulator | SmritiSetu',
      pitch: 'System Architecture & Implementation Specs | SmritiSetu'
    };
    const title = titles[currentView] || '404 Page Not Found | SmritiSetu';
    const prefix = regionInfo.nativeName ? `${regionInfo.nativeName} | ` : '';
    document.title = `${prefix}${title}`;
  }, [currentView, regionInfo]);

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
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans selection:bg-primary-fixed selection:text-primary overflow-x-hidden w-full max-w-full pb-16 sm:pb-20">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 min-w-0">
        <Suspense fallback={<LoadingSpinner message="Loading portal view..." />}>
          {/* 1. Welcoming Public Landing Page (Default for new users / guest mode) */}
          {currentView === 'landing' && (
            <ErrorBoundary title="Welcome Portal Error">
              <WelcomeLanding onOpenAuthModal={handleOpenAuthModal} />
            </ErrorBoundary>
          )}

          {/* 2. Dedicated Patient Companion Portal & Cognitive Exercises */}
          {(currentView === 'patient_portal' || currentView === 'exercises') && (
            <ErrorBoundary title="Patient Companion Portal Error">
              <PatientPortal
                initialGame={currentView === 'exercises' ? 'visual' : null}
                onExitToHome={() => setCurrentView('landing')}
              />
            </ErrorBoundary>
          )}

          {/* 3. Dedicated Caretaker Portal & Clinical Hub */}
          {currentView === 'caretaker_portal' && (
            <ErrorBoundary title="Caretaker Clinical Hub Error">
              <CaretakerPortal
                onNavigateToPatientPortal={() => setCurrentView('patient_portal')}
                onOpenTeleconsult={handleOpenTeleconsult}
              />
            </ErrorBoundary>
          )}

          {/* 4. ASHA Companion Door-to-Door Triage */}
          {currentView === 'asha' && (
            <ErrorBoundary title="ASHA Screening Portal Error">
              <AshaMode onOpenTeleconsult={handleOpenTeleconsult} />
            </ErrorBoundary>
          )}

          {/* 5. 2G Feature Phone IVR Simulator */}
          {currentView === 'ivr' && (
            <ErrorBoundary title="IVR Telephony Simulator Error">
              <IVRSimulator patient={patient} dialect={dialect} />
            </ErrorBoundary>
          )}

          {/* 6. Pitch & System Architecture View */}
          {currentView === 'pitch' && (
            <ErrorBoundary title="Architecture View Error">
              <PitchArchitectureView onSelectTier={(view) => setCurrentView(view)} />
            </ErrorBoundary>
          )}

          {/* 7. Dedicated 404 Route Fallback */}
          {!['landing', 'patient_portal', 'exercises', 'caretaker_portal', 'asha', 'ivr', 'pitch'].includes(currentView) && (
            <ErrorBoundary title="404 Page Error">
              <NotFoundView
                onNavigateHome={() => setCurrentView('landing')}
                onSelectView={(view) => setCurrentView(view)}
              />
            </ErrorBoundary>
          )}
        </Suspense>
      </main>

      {/* Accessible Multi-Column Footer with working links and clickable contacts */}
      <Footer
        onSelectView={setCurrentView}
        onOpenConsent={() => setIsConsentOpen(true)}
        onOpenAuthModal={handleOpenAuthModal}
      />

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
