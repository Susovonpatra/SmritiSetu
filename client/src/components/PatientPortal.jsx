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
  Sparkles,
  ShieldCheck,
  PhoneCall
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
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Patient Welcome Header */}
        <div className="bg-emerald-900 text-white rounded-3xl p-6 sm:p-10 border-4 border-zinc-900 shadow-[0_6px_0_#18181B] flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-emerald-800 rounded-3xl border-3 border-emerald-400 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Heart className="w-10 h-10 text-emerald-300 fill-emerald-300" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 bg-emerald-950/80 text-emerald-300 rounded-full text-xs font-black uppercase tracking-wider mb-1.5 border border-emerald-700">
                Patient Companion Mode
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Namaste, {patientSession.patient_name || 'Friend'}!
              </h2>
              <p className="text-emerald-200 text-base font-semibold mt-1">
                Linked Caretaker: <span className="text-white underline">{patientSession.caretaker_name || patientSession.caretaker_email}</span>
              </p>
            </div>
          </div>

          <button
            onClick={signOutPatient}
            className="min-h-[56px] px-6 bg-rose-950 hover:bg-rose-900 text-rose-200 font-black rounded-2xl border-2 border-rose-700 text-base transition flex items-center gap-2 shadow-[0_3px_0_#4C0519]"
          >
            <LogOut className="w-5 h-5" />
            <span>Exit Portal</span>
          </button>
        </div>

        {/* Daily Calming Care Schedule & Quick Launchers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Access to Exercises */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-zinc-900 shadow-[0_6px_0_#18181B] space-y-4">
            <h3 className="text-2xl font-black text-zinc-950 flex items-center gap-2">
              <Brain className="w-7 h-7 text-emerald-800" />
              <span>Today's Activities</span>
            </h3>
            <p className="text-sm font-semibold text-zinc-600">
              Gentle, pleasant exercises recommended by your caretaker to keep your memory sharp and joyful.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={onLaunchGame}
                className="w-full min-h-[64px] bg-emerald-800 hover:bg-emerald-900 text-white font-black text-lg px-6 rounded-2xl border-3 border-zinc-900 shadow-[0_4px_0_#18181B] flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-emerald-300" />
                  <span>Play Cognitive Matching</span>
                </div>
                <ArrowRight className="w-6 h-6" />
              </button>

              <button
                onClick={onLaunchVault}
                className="w-full min-h-[64px] bg-rose-800 hover:bg-rose-900 text-white font-black text-lg px-6 rounded-2xl border-3 border-zinc-900 shadow-[0_4px_0_#18181B] flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-rose-300 fill-rose-300" />
                  <span>Open Family Memory Vault</span>
                </div>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Daily Care Reminders */}
          <div className="bg-[#FFFDF7] rounded-3xl p-6 sm:p-8 border-4 border-zinc-900 shadow-[0_6px_0_#18181B] space-y-4">
            <h3 className="text-2xl font-black text-zinc-950 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-amber-800" />
              <span>Care Reminders</span>
            </h3>
            <p className="text-sm font-semibold text-zinc-600">
              Scoped directly from your caretaker's plan.
            </p>

            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-300 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-emerald-950 text-base">Morning Hydration &amp; Tea</h4>
                  <p className="text-xs font-bold text-emerald-700">8:00 AM • Completed with Caretaker</p>
                </div>
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  ✓
                </span>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-amber-950 text-base">Gentle Garden Stroll</h4>
                  <p className="text-xs font-bold text-amber-800">4:30 PM • 15 Minutes</p>
                </div>
                <span className="text-xs font-black uppercase text-amber-800 bg-amber-200 px-2.5 py-1 rounded-lg">
                  Upcoming
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Patient Login Form (Login ONLY - No public registration) ---
  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl border-4 border-zinc-900 shadow-[0_6px_0_#18181B] p-6 sm:p-10 space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-3xl mx-auto flex items-center justify-center mb-3 border-2 border-zinc-900 shadow-[0_3px_0_#18181B]">
          <Heart className="w-9 h-9 fill-emerald-800" />
        </div>
        <h2 className="text-3xl font-black text-zinc-950">
          Patient Companion Portal
        </h2>
        <p className="text-sm font-bold text-zinc-600 mt-1">
          Sign in using your caretaker's email and your patient access password.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-900 text-sm font-bold flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePatientSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-black text-zinc-800 uppercase tracking-wide mb-1.5">
            Caretaker's Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
            <input
              type="email"
              required
              value={caretakerEmail}
              onChange={(e) => setCaretakerEmail(e.target.value)}
              placeholder="e.g. caretaker@example.com"
              className="w-full bg-zinc-50 border-3 border-zinc-300 rounded-2xl py-3 pl-12 pr-4 text-base font-bold text-zinc-900 focus:border-emerald-700 focus:bg-white focus:outline-none transition min-h-[54px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-black text-zinc-800 uppercase tracking-wide mb-1.5">
            Patient Access Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
            <input
              type="password"
              required
              value={patientPassword}
              onChange={(e) => setPatientPassword(e.target.value)}
              placeholder="Enter patient password..."
              className="w-full bg-zinc-50 border-3 border-zinc-300 rounded-2xl py-3 pl-12 pr-4 text-base font-bold text-zinc-900 focus:border-emerald-700 focus:bg-white focus:outline-none transition min-h-[54px]"
            />
          </div>
          <p className="text-xs text-zinc-500 font-semibold mt-1.5">
            (Password provided to you by your caretaker)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[64px] bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xl rounded-2xl border-3 border-zinc-900 shadow-[0_4px_0_#18181B] flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-50"
        >
          <span>{loading ? 'Verifying...' : 'Sign In as Patient'}</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </form>

      <div className="pt-4 border-t-2 border-zinc-100 text-center">
        <p className="text-xs font-bold text-zinc-600">
          Are you a caretaker?{' '}
          <button
            onClick={onNavigateToCaretaker}
            className="text-indigo-800 hover:underline font-black ml-1"
          >
            Go to Caretaker Portal →
          </button>
        </p>
      </div>
    </div>
  );
}
