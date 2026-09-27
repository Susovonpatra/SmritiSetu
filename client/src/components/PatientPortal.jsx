import React, { useState } from 'react';
import { useDualAuth } from '../context/DualAuthContext';
import {
  Heart,
  KeyRound,
  Mail,
  ArrowRight,
  LogOut,
  AlertCircle,
  Brain,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export function PatientPortal({ onLaunchGame, onLaunchVault, onNavigateToCaretaker }) {
  const { patientSession, patientLogin, signOutPatient } = useDualAuth();

  const [caretakerEmail, setCaretakerEmail] = useState('');
  const [patientPassword, setPatientPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await patientLogin({ caretakerEmail, patientPassword });
    } catch (err) {
      setErrorMsg('Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // --- Authenticated Patient Companion Dashboard ---
  if (patientSession) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Patient Welcome Header */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Heart className="w-7 h-7 text-emerald-400 fill-emerald-400" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 bg-emerald-500/10 text-emerald-300 rounded-full text-[11px] font-semibold mb-1 border border-emerald-500/20">
                Patient Companion Portal
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Namaste, {patientSession.patient_name || 'Friend'}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Linked Caretaker: <span className="text-emerald-400 font-semibold">{patientSession.caretaker_name || patientSession.caretaker_email}</span>
              </p>
            </div>
          </div>

          <button
            onClick={signOutPatient}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Portal</span>
          </button>
        </div>

        {/* Daily Calming Care Schedule & Quick Launchers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Access to Exercises */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-700" />
              <span>Prescribed Activities</span>
            </h3>
            <p className="text-xs text-slate-500">
              Personalized cognitive exercises assigned by your caretaker to stimulate memory and recall.
            </p>

            <div className="space-y-3 pt-1">
              <button
                onClick={onLaunchGame}
                className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Brain className="w-4 h-4 text-emerald-200" />
                  <span>Play Cognitive Matching</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onLaunchVault}
                className="w-full py-3.5 px-4 bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-rose-200 fill-rose-200" />
                  <span>Open Reminiscence Vault</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Daily Care Reminders */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-700" />
              <span>Today's Care Schedule</span>
            </h3>
            <p className="text-xs text-slate-500">
              Synchronized from your linked caretaker's care plan.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">Morning Hydration &amp; Nutrition</h4>
                  <p className="text-xs text-emerald-700">8:00 AM • Completed</p>
                </div>
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
              </div>

              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-amber-950 text-sm">Gentle Garden Stroll</h4>
                  <p className="text-xs text-amber-800">4:30 PM • 15 Minutes</p>
                </div>
                <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                  Scheduled
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Patient Login Form ---
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl mx-auto flex items-center justify-center mb-3 border border-emerald-100 shadow-sm">
          <Heart className="w-6 h-6 fill-emerald-700" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Patient Companion Portal
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your caretaker's email and your patient access password to enter.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePatientSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Caretaker's Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={caretakerEmail}
              onChange={(e) => setCaretakerEmail(e.target.value)}
              placeholder="caretaker@example.com"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
            Patient Access Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              value={patientPassword}
              onChange={(e) => setPatientPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2 cursor-pointer"
        >
          <span>{loading ? 'Verifying...' : 'Sign In as Patient'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="pt-3 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Are you a caretaker?{' '}
          <button
            onClick={onNavigateToCaretaker}
            className="text-indigo-700 hover:underline font-bold ml-1"
          >
            Caretaker Portal →
          </button>
        </p>
      </div>
    </div>
  );
}
