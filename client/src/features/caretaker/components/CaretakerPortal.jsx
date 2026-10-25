import React, { useState, useEffect } from 'react';
import { useDualAuth } from '@/features/auth/context/DualAuthContext';
import { PatternTraceReportModal } from '@/features/games/components/PatternTraceReportModal';
import { ClinicalReportModal } from '@/features/caretaker/components/ClinicalReportModal';
import { BiographicalQuestionManager } from '@/features/caretaker/components/BiographicalQuestionManager';
import { UnifiedAnalyticsDashboard } from '@/features/caretaker/components/UnifiedAnalyticsDashboard';
import { useCaretakerAnalytics } from '../hooks/useCaretakerAnalytics';
import { CaretakerAuthCard } from './CaretakerAuthCard';
import { CaretakerHeader } from './CaretakerHeader';
import { CaretakerTabsNav } from './CaretakerTabsNav';
import { CaretakerProfileTab } from './tabs/CaretakerProfileTab';
import { PatientSecurityTab } from './tabs/PatientSecurityTab';

export function CaretakerPortal({ onNavigateToPatientPortal, onOpenTeleconsult }) {
  const {
    caretakerUser,
    isCaretakerLoading,
    signUpCaretaker,
    signInCaretaker,
    signOutCaretaker,
    updatePatientAccessPassword,
    patientProfile,
    updatePatientProfile
  } = useDualAuth();

  // Active Caretaker Tab: 'profile' | 'telemetry' | 'biographical_cms' | 'biographical_analytics' | 'security'
  const [activeTab, setActiveTab] = useState('profile');

  // Auth Form State (when not signed in)
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Patient Profile Edit Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    age: '',
    locality: '',
    dementia_duration: '',
    dialect: 'Assamese',
    abha_id: '',
    primary_condition: '',
    emergency_contact: '',
    notes: ''
  });
  const [profileSaveStatus, setProfileSaveStatus] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Management State
  const [patientPassword, setPatientPassword] = useState('');
  const [passUpdateStatus, setPassUpdateStatus] = useState(null);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form error/success
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Comprehensive Multi-Game Analytics State via extracted hook
  const {
    patternAnalytics,
    biographicalAnalytics,
    shapeAnalytics,
    routineAnalytics,
    unifiedTimeline,
    driftMetrics,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics
  } = useCaretakerAnalytics(patientProfile?.id || 1, activeTab);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Populate profile form whenever patientProfile loads/changes
  useEffect(() => {
    if (patientProfile) {
      setProfileForm({
        name: patientProfile.name || '',
        age: patientProfile.age || '',
        locality: patientProfile.locality || '',
        dementia_duration: patientProfile.dementia_duration || '',
        dialect: patientProfile.dialect || 'Assamese',
        abha_id: patientProfile.abha_id || '',
        primary_condition: patientProfile.primary_condition || 'Early-stage Alzheimer’s & Vascular Dementia',
        emergency_contact: patientProfile.emergency_contact || patientProfile.caregiver_phone || '',
        notes: patientProfile.notes || ''
      });
    }
  }, [patientProfile]);

  // Handle Caretaker Sign In / Sign Up
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUpCaretaker({
          email,
          password,
          fullName,
          phoneNumber
        });
        if (error) {
          setErrorMsg(error.message || 'Registration failed. Please check your details.');
          return;
        }
      } else {
        const { error } = await signInCaretaker({ email, password });
        if (error) {
          setErrorMsg(error.message || 'Invalid email or password.');
          return;
        }
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Patient Profile Form Update
  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePatientProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setProfileSaveStatus({ type: 'error', text: 'Patient Name is required.' });
      return;
    }
    if (!profileForm.age || isNaN(Number(profileForm.age)) || Number(profileForm.age) <= 0) {
      setProfileSaveStatus({ type: 'error', text: 'Please enter a valid age.' });
      return;
    }

    setIsSavingProfile(true);
    setProfileSaveStatus(null);

    try {
      await updatePatientProfile({
        name: profileForm.name.trim(),
        age: parseInt(profileForm.age, 10),
        locality: profileForm.locality.trim(),
        dementia_duration: profileForm.dementia_duration.trim(),
        dialect: profileForm.dialect,
        abha_id: profileForm.abha_id.trim(),
        primary_condition: profileForm.primary_condition.trim(),
        emergency_contact: profileForm.emergency_contact.trim(),
        caregiver_phone: profileForm.emergency_contact.trim(),
        notes: profileForm.notes.trim()
      });

      setProfileSaveStatus({
        type: 'success',
        text: `Patient profile saved! Name "${profileForm.name.trim()}" and Age ${profileForm.age} are now active across the Patient Portal.`
      });

      setTimeout(() => {
        setProfileSaveStatus(null);
      }, 5000);
    } catch (err) {
      setProfileSaveStatus({
        type: 'error',
        text: 'Failed to update patient profile. Please check your data and try again.'
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Set/Update Patient Access Password
  const handleSetPatientPassword = async (e) => {
    e.preventDefault();
    if (!patientPassword || patientPassword.length < 6) {
      setPassUpdateStatus({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setIsUpdatingPass(true);
    setPassUpdateStatus(null);
    try {
      const res = await updatePatientAccessPassword(patientPassword);
      setPassUpdateStatus({
        type: 'success',
        text: res?.message || 'Patient access password successfully updated!'
      });
      setTimeout(() => setPassUpdateStatus(null), 4000);
    } catch (err) {
      setPassUpdateStatus({
        type: 'error',
        text: 'Failed to update patient password. Please try again.'
      });
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const handleCopyCredentials = () => {
    const text = `Caretaker Email: ${caretakerUser?.email || ''}\nPatient Password: ${patientPassword || ''}\nPortal URL: /patient_portal`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isCaretakerLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-semibold text-slate-600 text-sm">Verifying Caretaker Session...</p>
      </div>
    );
  }

  // ── AUTHENTICATED CARETAKER CLINICAL DASHBOARD ──
  if (caretakerUser) {
    const meta = caretakerUser.user_metadata || {};
    const displayName = meta.full_name || caretakerUser.email.split('@')[0];
    const displayPatientName = patientProfile?.name || 'Not Configured';
    const displayPatientAge = patientProfile?.age ? `${patientProfile.age}` : 'Not Set';
    const displayLocality = patientProfile?.locality || 'Not Set';
    const displayDementiaDuration = patientProfile?.dementia_duration || 'Not Set';

    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 font-sans pb-12">
        <CaretakerHeader
          displayName={displayName}
          displayPatientName={displayPatientName}
          patientProfile={patientProfile}
          onNavigateToPatientPortal={onNavigateToPatientPortal}
          onSignOut={signOutCaretaker}
        />

        <CaretakerTabsNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {activeTab === 'profile' && (
          <CaretakerProfileTab
            profileForm={profileForm}
            onProfileChange={handleProfileChange}
            onSaveProfile={handleSavePatientProfile}
            isSavingProfile={isSavingProfile}
            profileSaveStatus={profileSaveStatus}
            displayPatientName={displayPatientName}
            displayPatientAge={displayPatientAge}
            displayLocality={displayLocality}
            displayDementiaDuration={displayDementiaDuration}
            onNavigateToPatientPortal={onNavigateToPatientPortal}
          />
        )}

        {(activeTab === 'analytics' || activeTab === 'telemetry' || activeTab === 'biographical_analytics' || activeTab === 'shape_analytics') && (
          <UnifiedAnalyticsDashboard
            displayPatientName={displayPatientName}
            displayPatientAge={displayPatientAge}
            displayLocality={displayLocality}
            displayAbhaId={patientProfile?.abha_id || '91-4523-8821-0021'}
            driftMetrics={driftMetrics}
            patternAnalytics={patternAnalytics}
            biographicalAnalytics={biographicalAnalytics}
            shapeAnalytics={shapeAnalytics}
            routineAnalytics={routineAnalytics}
            unifiedTimeline={unifiedTimeline}
            isLoading={isAnalyticsLoading}
            onRefresh={refetchAnalytics}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        )}

        {activeTab === 'security' && (
          <PatientSecurityTab
            caretakerUser={caretakerUser}
            patientProfile={patientProfile}
            patientPassword={patientPassword}
            setPatientPassword={setPatientPassword}
            passUpdateStatus={passUpdateStatus}
            isUpdatingPass={isUpdatingPass}
            onSetPatientPassword={handleSetPatientPassword}
            onCopyCredentials={handleCopyCredentials}
            copied={copied}
            displayName={displayName}
            displayPatientName={displayPatientName}
            displayPatientAge={displayPatientAge}
          />
        )}

        {activeTab === 'biographical_cms' && (
          <BiographicalQuestionManager patientId={patientProfile?.id || 1} />
        )}

        <ClinicalReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          initialType="consolidated"
          patient={{
            id: 1,
            name: displayPatientName,
            age: displayPatientAge,
            abha_id: patientProfile?.abha_id || '91-4523-8821-0021',
            locality: displayLocality
          }}
          analytics={{
            biographicalAnalytics,
            patternAnalytics,
            shapeAnalytics,
            routineAnalytics,
            driftMetrics,
            unifiedTimeline
          }}
        />
      </div>
    );
  }

  // ── UNREGISTERED / SIGN IN FORM FOR CARETAKER ──
  return (
    <CaretakerAuthCard
      isSignUp={isSignUp}
      setIsSignUp={setIsSignUp}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      fullName={fullName}
      setFullName={setFullName}
      phoneNumber={phoneNumber}
      setPhoneNumber={setPhoneNumber}
      loading={loading}
      errorMsg={errorMsg}
      onSubmit={handleAuthSubmit}
    />
  );
}
