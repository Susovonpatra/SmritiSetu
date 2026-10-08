import React, { useState, useEffect } from 'react';
import { useDualAuth } from '../context/DualAuthContext';
import {
  Shield,
  Key,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Brain,
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  AlertOctagon,
  Download,
  Send,
  Clock,
  FileText,
  Heart,
  Save,
  MapPin,
  Calendar,
  Stethoscope,
  Compass,
  Home,
  UserCheck,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { db } from '../db/db';
import { PatternTraceTelemetryService } from '../services/patternTraceTelemetry';
import { PatternTraceReportModal } from './PatternTraceReportModal';
import { BiographicalQuestionManager } from './BiographicalQuestionManager';
import { BiographicalAnalyticsDashboard } from './BiographicalAnalyticsDashboard';

export function CaretakerPortal({ onNavigateToPatientPortal, onOpenTeleconsult }) {
  const {
    caretakerUser,
    caretakerSession,
    isCaretakerLoading,
    signUpCaretaker,
    signInCaretaker,
    signOutCaretaker,
    updatePatientAccessPassword,
    patientProfile,
    updatePatientProfile
  } = useDualAuth();

  // Active Caretaker Tab: 'profile' | 'telemetry' | 'security'
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

  // Clinical Telemetry State
  const [analyticsData, setAnalyticsData] = useState([]);
  const [patternAnalytics, setPatternAnalytics] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [driftMetrics, setDriftMetrics] = useState({
    drift_percent: 28.4,
    current_latency: 1025,
    baseline_latency: 800,
    jitter: 18.2,
    accuracy: 86.5,
    alert: false
  });

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

  // Load telemetry data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const patternData = await PatternTraceTelemetryService.getLongitudinalAnalytics(1);
        setPatternAnalytics(patternData);

        // Fetch or simulate 30-day timeline
        const baseline = 800;
        const timeline = [];
        const now = Date.now();
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now - i * 24 * 3600 * 1000);
          const dayStr = d.toISOString().slice(5, 10);
          const driftFactor = 1.0 + (30 - i) * 0.011;
          timeline.push({
            date: d.toISOString().slice(0, 10),
            day: dayStr,
            latency_ms: Math.round(baseline * driftFactor),
            accuracy_pct: Math.max(65, Math.round(96 - (30 - i) * 0.6)),
            jitter_px: Math.round(11 + (30 - i) * 0.4),
            baseline: baseline
          });
        }

        const recentLatency = timeline.slice(-7).reduce((acc, c) => acc + c.latency_ms, 0) / 7;
        const drift = ((recentLatency - baseline) / baseline) * 100;

        setDriftMetrics({
          drift_percent: Math.round(drift * 10) / 10,
          current_latency: Math.round(recentLatency),
          baseline_latency: baseline,
          jitter: 19.4,
          accuracy: 84.0,
          alert: drift > 35.0
        });
        setAnalyticsData(timeline);
      } catch (err) {
        console.warn('Telemetry load error:', err);
      }
    };

    loadData();
  }, [caretakerUser]);

  // Handle Caretaker Sign In / Sign Up
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setErrorMsg('Full Name is required.');
          setLoading(false);
          return;
        }
        const { data, error } = await signUpCaretaker({
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
        const { data, error } = await signInCaretaker({ email, password });
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
    const text = `Caretaker Email: ${caretakerUser?.email || 'caretaker@smritisetu.in'}\nPatient Password: ${patientPassword || 'Setu@2026'}\nPortal URL: /patient_portal`;
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
        {/* Top Header Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-300" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-block px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-full text-[11px] sm:text-xs font-semibold border border-indigo-500/20">
                  Caretaker Clinical Hub
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 truncate">
                  • Linked Patient: <strong className="text-emerald-300">{displayPatientName}</strong> {patientProfile?.age ? `(Age ${patientProfile.age})` : ''}
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white mt-1 leading-tight">
                Welcome, {displayName}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
            {/* Direct Link to Launch & Test Patient View */}
            <button
              onClick={onNavigateToPatientPortal}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow border border-emerald-600 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-emerald-200 text-emerald-200 shrink-0" />
              <span>Launch Patient Portal</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* Sign Out */}
            <button
              onClick={signOutCaretaker}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── CARETAKER PORTAL NAVIGATION TABS ── */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300 shadow-inner">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 sm:flex-none py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-700 text-white shadow-md border border-emerald-800'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <User className={`w-4 h-4 shrink-0 ${activeTab === 'profile' ? 'text-emerald-200' : 'text-emerald-700'}`} />
            <span>Patient Profile &amp; Care Details</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex-1 sm:flex-none py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-indigo-900 text-white shadow-md border border-indigo-950'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Brain className={`w-4 h-4 shrink-0 ${activeTab === 'telemetry' ? 'text-indigo-300' : 'text-indigo-700'}`} />
            <span>Clinical Biomarkers &amp; Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('biographical_cms')}
            className={`flex-1 sm:flex-none py-2.5 sm:py-3 px-3 sm:px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'biographical_cms'
                ? 'bg-emerald-800 text-white shadow-md border border-emerald-900'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className={`w-4 h-4 shrink-0 ${activeTab === 'biographical_cms' ? 'text-emerald-200' : 'text-emerald-700'}`} />
            <span>Biographical CMS (Questions)</span>
          </button>

          <button
            onClick={() => setActiveTab('biographical_analytics')}
            className={`flex-1 sm:flex-none py-2.5 sm:py-3 px-3 sm:px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'biographical_analytics'
                ? 'bg-blue-900 text-white shadow-md border border-blue-950'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Activity className={`w-4 h-4 shrink-0 ${activeTab === 'biographical_analytics' ? 'text-blue-300' : 'text-blue-700'}`} />
            <span>Biographical Telemetry &amp; Decay</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 sm:flex-none py-2.5 sm:py-3 px-3 sm:px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-slate-900 text-white shadow-md border border-slate-950'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Key className={`w-4 h-4 shrink-0 ${activeTab === 'security' ? 'text-slate-300' : 'text-slate-700'}`} />
            <span>Access Password &amp; ABHA</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 1: PATIENT PROFILE & IDENTITY MANAGEMENT */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Live Profile Summary & Companion Preview Banner */}
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-5 sm:p-7 border border-emerald-800/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-800/40">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-black text-xl shrink-0">
                    🧓
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs font-bold border border-emerald-500/30">
                        Active Patient Record
                      </span>
                      <span className="text-[11px] text-emerald-400/80">Synchronized with Patient Portal</span>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-black text-white mt-0.5">
                      {displayPatientName}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={onNavigateToPatientPortal}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>View Greeting on Patient Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Live Preview Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <span className="text-[10px] font-bold text-emerald-300/80 uppercase block">Patient Name</span>
                  <p className="text-sm sm:text-base font-extrabold text-white mt-0.5 truncate">{displayPatientName}</p>
                  <span className="text-[10px] text-emerald-400">Used in dynamic greetings</span>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <span className="text-[10px] font-bold text-emerald-300/80 uppercase block">Age</span>
                  <p className="text-sm sm:text-base font-extrabold text-white mt-0.5">{displayPatientAge} Years</p>
                  <span className="text-[10px] text-emerald-400">Displayed in portal badge</span>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <span className="text-[10px] font-bold text-emerald-300/80 uppercase block">Locality</span>
                  <p className="text-sm sm:text-base font-extrabold text-white mt-0.5 truncate">{displayLocality}</p>
                  <span className="text-[10px] text-emerald-400">Orientation anchor</span>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <span className="text-[10px] font-bold text-emerald-300/80 uppercase block">Dementia History</span>
                  <p className="text-sm sm:text-base font-extrabold text-white mt-0.5 truncate">{displayDementiaDuration}</p>
                  <span className="text-[10px] text-emerald-400">Clinical timeline</span>
                </div>
              </div>

              {/* Patient Portal Live Greeting Banner Preview */}
              <div className="p-3.5 bg-emerald-900/40 rounded-2xl border border-emerald-600/30 flex items-center justify-between gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span className="font-semibold text-emerald-100">
                    Patient Portal Welcome Banner will say:
                  </span>
                  <strong className="text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                    "Good Morning, {displayPatientName}"
                  </strong>
                </div>
                <span className="text-[11px] text-emerald-300/80">
                  (Also renders in native Odia, Assamese, and Gujarati)
                </span>
              </div>
            </div>

            {/* Profile Edit Form Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-slate-200/90 shadow-md space-y-6">
              <div className="flex items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      Edit Patient Profile &amp; Clinical Details
                    </h3>
                    <p className="text-xs text-slate-500">
                      Fill up patient name, age, locality, and how long they have been suffering from dementia.
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full font-bold text-xs hidden sm:inline-block">
                  PostgreSQL &amp; Dexie Synced
                </span>
              </div>

              {/* Status Alert Banner */}
              {profileSaveStatus && (
                <div
                  className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-200 ${
                    profileSaveStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border-2 border-emerald-300'
                      : 'bg-rose-50 text-rose-900 border-2 border-rose-300'
                  }`}
                >
                  {profileSaveStatus.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-700" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-sm">
                      {profileSaveStatus.type === 'success' ? 'Profile Updated Successfully!' : 'Save Error'}
                    </p>
                    <p className="mt-0.5">{profileSaveStatus.text}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSavePatientProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {/* 1. Patient Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Patient Full Name <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      placeholder="e.g. Patient Full Name"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
                    />
                    <p className="text-[11px] text-slate-500">
                      Renders directly in Patient Portal greeting: <em>"Good Morning{profileForm.name ? `, ${profileForm.name}` : ''}"</em>
                    </p>
                  </div>

                  {/* 2. Patient Age */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Age (Years) <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={125}
                      value={profileForm.age}
                      onChange={(e) => handleProfileChange('age', e.target.value)}
                      placeholder="e.g. 72"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
                    />
                    <p className="text-[11px] text-slate-500">
                      Displayed on Patient Portal identity card &amp; calibrates baseline motor latency.
                    </p>
                  </div>

                  {/* 3. Locality / Address / District */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Locality / Village / District <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.locality}
                      onChange={(e) => handleProfileChange('locality', e.target.value)}
                      placeholder="e.g. Guwahati, Assam"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
                    />
                    <p className="text-[11px] text-slate-500">
                      Provides familiar place orientation to soothe morning disorientation.
                    </p>
                  </div>

                  {/* 4. Dementia Duration (How long suffering from dementia) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Suffering Dementia For How Long <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.dementia_duration}
                      onChange={(e) => handleProfileChange('dementia_duration', e.target.value)}
                      placeholder="e.g. 2 Years, 6 Months, or 3-5 Years"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
                    />
                    {/* Quick Selection Chips */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {['6 Months', '1 Year', '2 Years', '3-5 Years', '5+ Years'].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleProfileChange('dementia_duration', chip)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition cursor-pointer ${
                            profileForm.dementia_duration === chip
                              ? 'bg-emerald-700 text-white border-emerald-800'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Preferred Regional Dialect */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Preferred Regional Dialect</span>
                    </label>
                    <select
                      value={profileForm.dialect}
                      onChange={(e) => handleProfileChange('dialect', e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
                    >
                      <option value="Assamese">Assamese (অসমীয়া)</option>
                      <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                      <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                      <option value="Hindi">Hindi (हिन्दी)</option>
                      <option value="English">English (National)</option>
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Sets default TTS dialect in IVR calls &amp; audio games.
                    </p>
                  </div>

                  {/* 6. ABHA Health ID */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-700" />
                      <span>ABHA Health ID (Ayushman Bharat)</span>
                    </label>
                    <input
                      type="text"
                      value={profileForm.abha_id}
                      onChange={(e) => handleProfileChange('abha_id', e.target.value)}
                      placeholder="e.g. ABHA-1234-5678-9012"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
                    />
                    <p className="text-[11px] text-slate-500">
                      Used for eSanjeevani teleconsultation and ABDM records.
                    </p>
                  </div>

                  {/* 7. Primary Clinical Stage */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Primary Diagnosis / Stage</span>
                    </label>
                    <select
                      value={profileForm.primary_condition}
                      onChange={(e) => handleProfileChange('primary_condition', e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
                    >
                      <option value="Early-stage Alzheimer’s & Vascular Dementia">Early-stage Alzheimer’s &amp; Vascular</option>
                      <option value="Mild Cognitive Impairment (MCI)">Mild Cognitive Impairment (MCI)</option>
                      <option value="Moderate Dementia">Moderate Dementia</option>
                      <option value="Age-Associated Memory Loss">Age-Associated Memory Loss</option>
                      <option value="Frontotemporal Dementia">Frontotemporal Dementia</option>
                    </select>
                  </div>

                  {/* 8. Emergency Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Emergency Caretaker Phone</span>
                    </label>
                    <input
                      type="tel"
                      value={profileForm.emergency_contact}
                      onChange={(e) => handleProfileChange('emergency_contact', e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
                    />
                  </div>

                  {/* 9. Daily Guidance Notes */}
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Caregiver Notes &amp; Routine Tips</span>
                    </label>
                    <input
                      type="text"
                      value={profileForm.notes}
                      onChange={(e) => handleProfileChange('notes', e.target.value)}
                      placeholder="e.g. Likes morning tea at 8 AM, responsive to audio prompts"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
                    />
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant offline &amp; online auto-synchronization enabled</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingProfile ? 'Saving & Syncing...' : 'Save Patient Profile'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onNavigateToPatientPortal}
                      className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Heart className="w-4 h-4 fill-emerald-300 text-emerald-300" />
                      <span>Launch Patient Portal</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 2: CLINICAL BIOMARKERS & TELEMETRY */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            {/* 7-Day Cognitive Drift Overview */}
            <div className={`p-5 sm:p-6 rounded-3xl border-3 transition-all ${
              driftMetrics.alert 
                ? 'bg-rose-50 border-rose-700 shadow-md' 
                : 'bg-emerald-50 border-emerald-700 shadow-md'
            }`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <div className={`p-2.5 sm:p-3 rounded-2xl border-2 shrink-0 ${
                    driftMetrics.alert ? 'bg-rose-200 border-rose-800 text-rose-900' : 'bg-emerald-200 border-emerald-800 text-emerald-900'
                  }`}>
                    {driftMetrics.alert ? <AlertOctagon className="w-7 h-7 sm:w-8 sm:h-8" /> : <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-base sm:text-xl font-bold text-zinc-800">
                        Rolling 7-Day Cognitive Drift Index ({displayPatientName}):
                      </span>
                      <span className={`text-2xl sm:text-3xl font-black ${driftMetrics.alert ? 'text-rose-900' : 'text-emerald-950'}`}>
                        {driftMetrics.drift_percent >= 0 ? `+${driftMetrics.drift_percent}%` : `${driftMetrics.drift_percent}%`}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-700 mt-1">
                      {driftMetrics.alert 
                        ? 'CRITICAL ALERT: Reaction latency drift exceeded the 35% clinical threshold. Recommended teleconsultation with neurology team.'
                        : 'STABLE RANGE: Reaction latency and accuracy variance are within acceptable geriatric baseline parameters (<35% drift).'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="w-full md:w-auto px-4 sm:px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-300" />
                    <span>Export Clinical Report</span>
                  </button>
                </div>
              </div>
            </div>

            {/* PatternTrace Working Memory & Adaptive Staircase */}
            <div className="p-5 sm:p-8 rounded-3xl bg-white border-2 border-slate-200/90 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center justify-center shrink-0">
                    <Brain className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] sm:text-xs font-bold">
                        PatternTrace™ Neurocognitive Engine
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                        patternAnalytics?.perseverationCount > 0
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {patternAnalytics?.clinicalStatus || 'Stable Baseline'}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5">
                      Visuospatial Working Memory &amp; Adaptive Staircase
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow shrink-0"
                >
                  <FileText className="w-4 h-4 text-indigo-300" />
                  <span>View Full Report</span>
                </button>
              </div>

              {/* 4 Biomarker Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 min-w-0">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase block truncate">Working Memory</span>
                  <span className="text-xl sm:text-3xl font-black text-indigo-900 block mt-1">
                    Level {patternAnalytics?.currentLevel || 2} <span className="text-xs font-normal text-slate-400">/ 5</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 truncate block">Max: Level {patternAnalytics?.maxLevelAchieved || 3}</span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 min-w-0">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase block truncate">Sequence Recall</span>
                  <span className="text-xl sm:text-3xl font-black text-emerald-800 block mt-1">
                    {patternAnalytics?.sequenceMatchPct || 85}%
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 truncate block">Exact node trajectory</span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 min-w-0">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase block truncate">Perceptual Latency</span>
                  <span className="text-xl sm:text-3xl font-black text-slate-900 block mt-1">
                    {patternAnalytics?.meanLatency || 880} ms
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 truncate block">Demo to first touch</span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 min-w-0">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase block truncate">Perseveration Rate</span>
                  <span className={`text-xl sm:text-3xl font-black block mt-1 ${
                    (patternAnalytics?.perseverationCount || 0) > 0 ? 'text-amber-800' : 'text-emerald-700'
                  }`}>
                    {patternAnalytics?.perseverationRatePct || 0}%
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 truncate block">
                    {patternAnalytics?.perseverationCount || 0} repetitions
                  </span>
                </div>
              </div>

              {/* Adaptive Staircase Chart */}
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center justify-between text-xs gap-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-700" />
                    <span>Adaptive Staircase Level Progression ({displayPatientName})</span>
                  </h4>
                  <span className="text-slate-500 text-[11px]">
                    Rule: 2 Flawless (+1) | 2 Failed (-1)
                  </span>
                </div>

                <div className="h-48 sm:h-56 w-full min-w-0 bg-slate-50 p-2 sm:p-3 rounded-2xl border border-slate-200 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={patternAnalytics?.trajectory || []}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="levelGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="trial" tick={{ fontSize: 10, fill: '#64748B' }} label={{ value: 'Trial #', position: 'insideBottomRight', offset: -5, fontSize: 9 }} />
                      <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#4338CA' }} label={{ value: 'Level', angle: -90, position: 'insideLeft', fill: '#4338CA', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#FFF', border: 'none', fontSize: '11px' }}
                        labelFormatter={(label) => `Trial #${label}`}
                      />
                      <Area
                        type="stepAfter"
                        dataKey="level"
                        stroke="#4338CA"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#levelGrad)"
                        name="Difficulty Level"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 30-Day Timeline */}
            <div className="p-5 sm:p-8 rounded-3xl bg-white border-2 border-slate-200/90 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    30-Day Timeline: Reaction Latency Drift vs Task Accuracy
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Track longitudinal cognitive deceleration against target baseline (800ms).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-700 inline-block"></span>
                    Latency (ms)
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                    Accuracy (%)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-3 h-0.5 border border-dashed border-slate-800 inline-block"></span>
                    Baseline (800ms)
                  </span>
                </div>
              </div>

              <div className="h-60 sm:h-72 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      domain={[500, 1500]}
                      tick={{ fontSize: 10, fill: '#4338CA' }}
                      label={{ value: 'Latency', angle: -90, position: 'insideLeft', fill: '#4338CA', fontSize: 10 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[40, 100]}
                      tick={{ fontSize: 10, fill: '#059669' }}
                      label={{ value: 'Accuracy (%)', angle: 90, position: 'insideRight', fill: '#059669', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181B', borderRadius: '12px', color: '#FFF', border: 'none', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <ReferenceLine yAxisId="left" y={800} stroke="#EF4444" strokeDasharray="5 5" label={{ value: '800ms', fill: '#EF4444', fontSize: 9 }} />
                    <ReferenceLine yAxisId="left" y={1080} stroke="#DC2626" strokeDasharray="3 3" label={{ value: '+35%', fill: '#DC2626', fontSize: 9 }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="latency_ms"
                      stroke="#4338CA"
                      strokeWidth={2.5}
                      dot={{ r: 2, fill: '#4338CA' }}
                      name="Reaction Latency (ms)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="accuracy_pct"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 2, fill: '#059669' }}
                      name="Accuracy (%)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 3: ACCESS PASSWORD & ABHA SECURITY */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Manage Dedicated Patient Access Password Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Patient Access Password</h2>
                  <p className="text-xs text-slate-500">Stored as a secure bcrypt hash in `patient_profiles`</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Your patient logs in at the <strong>Patient Portal</strong> using your email (<code className="break-all">{caretakerUser.email}</code>) and this dedicated password.
              </p>

              {passUpdateStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    passUpdateStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {passUpdateStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passUpdateStatus.text}</span>
                </div>
              )}

              <form onSubmit={handleSetPatientPassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Set New Patient Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      minLength={6}
                      value={patientPassword}
                      onChange={(e) => setPatientPassword(e.target.value)}
                      placeholder="e.g. Setu@2026 or EasyMemory123"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                  <button
                    type="submit"
                    disabled={isUpdatingPass}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{isUpdatingPass ? 'Updating...' : 'Save Patient Password'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Copy Login Credentials"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Caretaker & Linked Patient Identity Overview */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Auth &amp; Linkage Metadata</h2>
                  <p className="text-xs text-slate-500">Security &amp; compliance tokens</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block mb-0.5">Caretaker Name</span>
                  <p className="font-semibold text-slate-800 truncate">{displayName}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block mb-0.5">Email</span>
                  <p className="font-semibold text-slate-800 truncate">{caretakerUser.email}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block mb-0.5">Linked Patient</span>
                  <p className="font-semibold text-slate-800 truncate">{displayPatientName} (Age {displayPatientAge})</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block mb-0.5">ABHA ID</span>
                  <p className="font-semibold text-slate-800 truncate">{patientProfile?.abha_id || 'Not Set'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 4: BIOGRAPHICAL QUESTION & OPTION MANAGER (CMS)       */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === 'biographical_cms' && (
          <BiographicalQuestionManager patientId={patientProfile?.id || 1} />
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 5: CLINICAL BIOGRAPHICAL TELEMETRY & ANALYTICS        */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === 'biographical_analytics' && (
          <BiographicalAnalyticsDashboard patientId={patientProfile?.id || 1} />
        )}

        {/* Clinical Summary Report Modal */}
        <PatternTraceReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          patient={{ id: 1, name: displayPatientName, age: displayPatientAge, abha_id: patientProfile?.abha_id || '' }}
        />
      </div>
    );
  }

  // ── UNREGISTERED / SIGN IN FORM FOR CARETAKER ──
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl border-2 border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6 my-6">
      <div className="text-center">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-2xl mx-auto flex items-center justify-center mb-3 border border-indigo-100 shadow-sm">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">
          {isSignUp ? 'Create Caretaker Account' : 'Caretaker Portal Login'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isSignUp
            ? 'Register to manage patient access, profile records, and clinical telemetry.'
            : 'Sign in to configure patient profile, locality, and monitor biomarkers.'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleAuthSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Caretaker Full Name"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 94350 12345"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="caretaker@example.com"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          <span>{loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In as Caretaker'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="pt-3 border-t border-slate-100 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setErrorMsg(null);
          }}
          className="text-xs text-indigo-700 hover:underline font-bold cursor-pointer"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
