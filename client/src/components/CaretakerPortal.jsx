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
  ExternalLink,
  Sparkles
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
        if (error) throw error;
        if (!data.session) {
          setSuccessMsg('Account created! Please check your email to verify, or sign in.');
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
        text: res?.message || 'Patient access password successfully saved & hashed with bcrypt!'
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
    const text = `Caretaker Email: ${caretakerUser?.email}\nPatient Password: ${patientPassword || '(Set by you)'}\nPortal URL: /patient/dashboard`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isCaretakerLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-bold text-zinc-700">Verifying Caretaker Session...</p>
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
        <div className="bg-indigo-900 text-white rounded-3xl p-6 sm:p-8 border-4 border-zinc-900 shadow-[0_6px_0_#18181B] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-800/80 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2 border border-indigo-700">
              <Shield className="w-3.5 h-3.5 text-indigo-300" />
              Authenticated Caretaker Portal
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              Welcome, {displayName}
            </h2>
            <p className="text-indigo-200 text-sm mt-1">
              Supabase Auth UID: <span className="font-mono text-xs bg-indigo-950 px-2 py-0.5 rounded">{caretakerUser.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAnalytics}
              className="px-4 py-2.5 bg-white text-indigo-950 font-bold rounded-2xl hover:bg-indigo-50 border-2 border-zinc-900 transition flex items-center gap-2 shadow-[0_3px_0_#18181B]"
            >
              <span>View Analytics</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={signOutCaretaker}
              className="px-4 py-2.5 bg-indigo-950/80 hover:bg-rose-900 text-rose-200 font-bold rounded-2xl border border-indigo-700 transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Caretaker Profile Details */}
          <div className="bg-white rounded-3xl p-6 border-4 border-zinc-900 shadow-[0_4px_0_#18181B] space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-zinc-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900">Caretaker Account</h3>
                <p className="text-xs text-zinc-500">Profile synced with PostgreSQL `caretakers` table</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                <span className="text-xs font-bold text-zinc-500 uppercase block mb-0.5">Full Name</span>
                <p className="font-bold text-zinc-800 text-base">{displayName}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                <span className="text-xs font-bold text-zinc-500 uppercase block mb-0.5">Email Address</span>
                <p className="font-bold text-zinc-800 text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-400" />
                  {caretakerUser.email}
                </p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                <span className="text-xs font-bold text-zinc-500 uppercase block mb-0.5">Phone Number</span>
                <p className="font-bold text-zinc-800 text-base flex items-center gap-2">
                  <Phone className="w-4 h-4 text-zinc-400" />
                  {displayPhone}
                </p>
              </div>
            </div>
          </div>

          {/* Manage Patient Access Password */}
          <div className="bg-white rounded-3xl p-6 border-4 border-zinc-900 shadow-[0_4px_0_#18181B] space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-zinc-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900">Patient Access Password</h3>
                <p className="text-xs text-zinc-500">Stored as bcrypt hash in `patient_profiles`</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 font-medium leading-relaxed">
              Your patient logs in at the <strong>Patient Portal</strong> using your email (<code>{caretakerUser.email}</code>) and this dedicated password.
            </p>

            {passUpdateStatus && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  passUpdateStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-2 border-rose-300'
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
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">
                  New Patient Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={patientPassword}
                    onChange={(e) => setPatientPassword(e.target.value)}
                    placeholder="e.g. Setu@2026 or EasyMemory123"
                    className="w-full bg-zinc-50 border-2 border-zinc-300 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-semibold text-zinc-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPass}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-2xl border-2 border-zinc-900 shadow-[0_3px_0_#18181B] flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                <span>{isUpdatingPass ? 'Hashing & Updating...' : 'Save Patient Password'}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <button
                onClick={handleCopyCredentials}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Patient Login Info'}</span>
              </button>

              <button
                onClick={onNavigateToPatientPortal}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
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
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl border-4 border-zinc-900 shadow-[0_6px_0_#18181B] p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 bg-indigo-100 text-indigo-800 rounded-2xl mx-auto flex items-center justify-center mb-3 border-2 border-zinc-900 shadow-[0_3px_0_#18181B]">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-zinc-950">
          Caretaker Administration
        </h2>
        <p className="text-xs font-bold text-zinc-500 mt-1">
          {isSignUp ? 'Create a secure caretaker account with Supabase Auth.' : 'Sign in to manage your patient profile and security keys.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-zinc-100 p-1 border-2 border-zinc-900">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
            !isSignUp ? 'bg-indigo-800 text-white shadow' : 'text-zinc-700 hover:text-zinc-900'
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
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
            isSignUp ? 'bg-indigo-800 text-white shadow' : 'text-zinc-700 hover:text-zinc-900'
          }`}
        >
          Sign Up (New Caretaker)
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleAuthSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <div>
              <label className="block text-xs font-black text-zinc-700 uppercase mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ananya Baruah"
                  className="w-full bg-zinc-50 border-2 border-zinc-300 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-semibold text-zinc-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-zinc-700 uppercase mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 94350 12345"
                  className="w-full bg-zinc-50 border-2 border-zinc-300 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-semibold text-zinc-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-black text-zinc-700 uppercase mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="caretaker@example.com"
              className="w-full bg-zinc-50 border-2 border-zinc-300 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-semibold text-zinc-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-zinc-700 uppercase mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-50 border-2 border-zinc-300 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-semibold text-zinc-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-black text-base py-3 px-4 rounded-2xl border-2 border-zinc-900 shadow-[0_4px_0_#18181B] flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
        >
          <span>{loading ? 'Processing...' : isSignUp ? 'Create Caretaker Account' : 'Sign In as Caretaker'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="pt-4 border-t-2 border-zinc-100 text-center">
        <p className="text-xs text-zinc-600">
          Looking for patient login?{' '}
          <button
            onClick={onNavigateToPatientPortal}
            className="font-black text-emerald-800 hover:underline ml-1"
          >
            Go to Patient Companion Portal →
          </button>
        </p>
      </div>
    </div>
  );
}
