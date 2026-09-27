import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';

export function CaretakerPortal({ onNavigateToPatientPortal, onOpenAnalytics }) {
  const {
    caretakerUser,
    caretakerSession,
    isCaretakerLoading,
    signUpCaretaker,
    signInCaretaker,
    signOutCaretaker,
    updatePatientAccessPassword
  } = useDualAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Patient access password state
  const [patientPassword, setPatientPassword] = useState('');
  const [passUpdateStatus, setPassUpdateStatus] = useState(null);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('Full Name is required');
        const { data, error } = await signUpCaretaker({
          email,
          password,
          fullName,
          phoneNumber
        });
        if (error) throw new Error('Invalid credentials or account creation failed.');
        if (!data.session) {
          setSuccessMsg('Account created! Please sign in with your credentials.');
        } else {
          setSuccessMsg('Caretaker account registered successfully!');
        }
      } else {
        const { error } = await signInCaretaker({ email, password });
        if (error) throw new Error('Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      setErrorMsg(isSignUp ? (err.message || 'Account registration failed.') : 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

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
        text: err.message || 'Failed to update patient password.'
      });
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const handleCopyCredentials = () => {
    const text = `Caretaker Email: ${caretakerUser?.email}\nPatient Password: ${patientPassword || '(Set by you)'}\nPortal URL: /patient_portal`;
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

  // --- Authenticated Caretaker Dashboard View ---
  if (caretakerUser) {
    const meta = caretakerUser.user_metadata || {};
    const displayName = meta.full_name || caretakerUser.email.split('@')[0];
    const displayPhone = meta.phone_number || 'Not provided';

    return (
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-indigo-500/20">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              Authenticated Caretaker Portal
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome, {displayName}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Supabase Auth UID: <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">{caretakerUser.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAnalytics}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <span>View Analytics</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={signOutCaretaker}
              className="px-4 py-2 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Caretaker Profile Details */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Caretaker Profile</h3>
                <p className="text-xs text-slate-500">PostgreSQL `caretakers` record</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-0.5">Full Name</span>
                <p className="font-semibold text-slate-800">{displayName}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-0.5">Email Address</span>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {caretakerUser.email}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-0.5">Phone Number</span>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {displayPhone}
                </p>
              </div>
            </div>
          </div>

          {/* Manage Patient Access Password */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Patient Access Password</h3>
                <p className="text-xs text-slate-500">Hashed via Blowfish in `patient_profiles`</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your patient logs in at the <strong>Patient Portal</strong> using your email (<code>{caretakerUser.email}</code>) and this dedicated password.
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
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{passUpdateStatus.text}</span>
              </div>
            )}

            <form onSubmit={handleSetPatientPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  New Patient Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={patientPassword}
                    onChange={(e) => setPatientPassword(e.target.value)}
                    placeholder="e.g. Setu@2026 or EasyMemory123"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPass}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{isUpdatingPass ? 'Updating...' : 'Save Patient Password'}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={handleCopyCredentials}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Login Credentials'}</span>
              </button>

              <button
                onClick={onNavigateToPatientPortal}
                className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Launch Patient View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Unauthenticated Caretaker Sign Up / Login View ---
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-xl mx-auto flex items-center justify-center mb-3 border border-indigo-100 shadow-sm">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Caretaker Administration
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isSignUp ? 'Create a caretaker account to monitor telemetry & set passwords.' : 'Sign in to manage patient access and clinical metrics.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            !isSignUp ? 'bg-indigo-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true);
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            isSignUp ? 'bg-indigo-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sign Up (New Caretaker)
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
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
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
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
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
        >
          <span>{loading ? 'Processing...' : isSignUp ? 'Create Caretaker Account' : 'Sign In as Caretaker'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="pt-3 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Looking for patient login?{' '}
          <button
            onClick={onNavigateToPatientPortal}
            className="font-bold text-emerald-700 hover:underline ml-1"
          >
            Patient Portal →
          </button>
        </p>
      </div>
    </div>
  );
}
