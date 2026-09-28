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
  Heart
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

export function CaretakerPortal({ onNavigateToPatientPortal, onOpenTeleconsult }) {
  const {
    caretakerUser,
    caretakerSession,
    isCaretakerLoading,
    signUpCaretaker,
    signInCaretaker,
    signOutCaretaker,
    updatePatientAccessPassword
  } = useDualAuth();

  // Auth Form State (when not signed in)
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

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
        if (!fullName.trim()) throw new Error('Full Name is required');
        const { error } = await signUpCaretaker({
          email,
          password,
          fullName,
          phoneNumber
        });
        if (error) throw error;
      } else {
        const { error } = await signInCaretaker({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setErrorMsg('Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
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

  // ── AUTHENTICATED CARETAKER CLINICAL DASHBOARD (Strictly English) ──
  if (caretakerUser) {
    const meta = caretakerUser.user_metadata || {};
    const displayName = meta.full_name || caretakerUser.email.split('@')[0];
    const displayPhone = meta.phone_number || '+91 94350 12345';

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
                  • Auth: <code className="font-mono text-[10px] sm:text-[11px] text-slate-300">{caretakerUser.id?.slice(0, 10)}...</code>
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

        {/* ── PROFILE & PATIENT PASSWORD MANAGEMENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Caretaker & Linked Patient Identity Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Caretaker &amp; Patient Metadata</h2>
                <p className="text-xs text-slate-500">PostgreSQL authenticated records</p>
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
                <p className="font-semibold text-slate-800 truncate">Bhaben Baruah (Age 74)</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block mb-0.5">ABHA ID</span>
                <p className="font-semibold text-slate-800 truncate">NER-ASM-9821-4412</p>
              </div>
            </div>
          </div>

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
        </div>

        {/* ── 7-DAY COGNITIVE DRIFT & BIOMARKER OVERVIEW ── */}
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
                    Rolling 7-Day Cognitive Drift Index:
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

        {/* ── PATTERNTRACE™ WORKING MEMORY & STAIRCASE HUB ── */}
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

          {/* Perseveration Warning Banner */}
          {patternAnalytics?.perseverationCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">
                  Neurocognitive Warning: Working Memory Pattern Perseveration
                </p>
                <p className="text-amber-900 mt-0.5 leading-relaxed">
                  The patient repeated geometric patterns from the previous trial during recent sessions. In geriatric neurology, pattern perseveration signifies executive set-shifting resistance and is a recognized early biomarker for Mild Cognitive Impairment (MCI).
                </p>
              </div>
            </div>
          )}

          {/* Adaptive Staircase Chart */}
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center justify-between text-xs gap-1">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-700" />
                <span>Adaptive Staircase Level Progression</span>
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

        {/* ── 30-DAY DUAL-AXIS LATENCY DRIFT VS ACCURACY TIMELINE ── */}
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

        {/* Clinical Summary Report Modal */}
        <PatternTraceReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          patient={{ id: 1, name: 'Bhaben Baruah', age: 74, abha_id: 'NER-ASM-9821-4412' }}
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
            ? 'Register to manage patient access and clinical telemetry.'
            : 'Sign in with your registered email and password.'}
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
                  placeholder="e.g. Ananya Baruah"
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
