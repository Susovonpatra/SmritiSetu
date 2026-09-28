import React, { useState } from 'react';
import { useDualAuth } from '../context/DualAuthContext';
import {
  X,
  Shield,
  Key,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Heart,
  Brain,
  Sparkles
} from 'lucide-react';

export function DualAuthModal({ isOpen, onClose, initialTab = 'caretaker', onSuccess }) {
  const {
    signUpCaretaker,
    signInCaretaker,
    patientLogin,
    patientProfile
  } = useDualAuth();

  const [activeTab, setActiveTab] = useState(initialTab); // 'caretaker' | 'patient'
  const [isCaretakerSignUp, setIsCaretakerSignUp] = useState(false);

  // Caretaker Form State
  const [caretakerEmail, setCaretakerEmail] = useState('');
  const [caretakerPassword, setCaretakerPassword] = useState('');
  const [caretakerFullName, setCaretakerFullName] = useState('');
  const [caretakerPhone, setCaretakerPhone] = useState('');

  // Patient Form State
  const [patientCaretakerEmail, setPatientCaretakerEmail] = useState('');
  const [patientPassword, setPatientPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(false);
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  // --- Caretaker Auth Submit ---
  const handleCaretakerSubmit = async (e) => {
    e.preventDefault();
    resetForm();
    setLoading(true);

    try {
      if (isCaretakerSignUp) {
        if (!caretakerFullName.trim()) throw new Error('Please enter your full name.');
        const { data, error } = await signUpCaretaker({
          email: caretakerEmail,
          password: caretakerPassword,
          fullName: caretakerFullName,
          phoneNumber: caretakerPhone
        });
        if (error) throw error;
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          if (onSuccess) onSuccess('caretaker_portal');
          onClose();
        }, 800);
      } else {
        const { data, error } = await signInCaretaker({
          email: caretakerEmail,
          password: caretakerPassword
        });
        if (error) throw error;
        if (onSuccess) onSuccess('caretaker_portal');
        onClose();
      }
    } catch (err) {
      setErrorMsg('Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // --- Patient Auth Submit ---
  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    resetForm();
    setLoading(true);

    try {
      await patientLogin({
        caretakerEmail: patientCaretakerEmail,
        patientPassword
      });
      if (onSuccess) onSuccess('patient_portal');
      onClose();
    } catch (err) {
      setErrorMsg('Invalid credentials. Please verify caretaker email and patient password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white text-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition z-10 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Portal Switcher */}
        <div className="bg-slate-900 text-white p-4 sm:p-8 pb-4 sm:pb-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3 pr-8">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center font-bold text-base sm:text-lg text-white shadow-sm border border-emerald-500/30 shrink-0">
              ସ୍ମୃ
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-extrabold text-white truncate">SmritiSetu Portals</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">Select your portal to sign in or create an account</p>
            </div>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-800/90 rounded-2xl border border-slate-700 mt-3 sm:mt-4">
            <button
              type="button"
              onClick={() => handleTabSwitch('caretaker')}
              className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                activeTab === 'caretaker'
                  ? 'bg-indigo-700 text-white shadow border border-indigo-600'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>Caretaker Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch('patient')}
              className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                activeTab === 'patient'
                  ? 'bg-emerald-700 text-white shadow border border-emerald-600'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Heart className="w-3.5 h-3.5 shrink-0" />
              <span>Patient Portal</span>
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* Status Notifications */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── TAB 1: CARETAKER PORTAL (Sign In & Sign Up) ── */}
          {activeTab === 'caretaker' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    {isCaretakerSignUp ? 'Create Caretaker Account' : 'Caretaker Login'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isCaretakerSignUp
                      ? 'Register to manage patient access and track cognitive drift.'
                      : 'Sign in with your email and password.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCaretakerSignUp(!isCaretakerSignUp);
                    resetForm();
                  }}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer"
                >
                  {isCaretakerSignUp ? 'Have an account? Sign In' : 'New? Sign Up'}
                </button>
              </div>

              <form onSubmit={handleCaretakerSubmit} className="space-y-3 pt-1">
                {isCaretakerSignUp && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={caretakerFullName}
                          onChange={(e) => setCaretakerFullName(e.target.value)}
                          placeholder="e.g. Caretaker Full Name"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          value={caretakerPhone}
                          onChange={(e) => setCaretakerPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Caretaker Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={caretakerEmail}
                      onChange={(e) => setCaretakerEmail(e.target.value)}
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
                    <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={caretakerPassword}
                      onChange={(e) => setCaretakerPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 mt-3 cursor-pointer"
                >
                  <span>
                    {loading
                      ? 'Verifying...'
                      : isCaretakerSignUp
                      ? 'Register as Caretaker'
                      : 'Sign In to Caretaker Hub'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* ── TAB 2: PATIENT PORTAL (Dedicated Login) ── */}
          {activeTab === 'patient' && (
            <div className="space-y-4">
              <div className="pb-1 border-b border-slate-100">
                <h4 className="font-extrabold text-slate-900 text-base">Patient Companion Sign In</h4>
                <p className="text-xs text-slate-500">
                  {patientProfile?.name ? (
                    <>Signing in for <strong className="text-emerald-800">{patientProfile.name} {patientProfile?.age ? `(Age ${patientProfile.age})` : ''}</strong></>
                  ) : (
                    <>Sign in with your caretaker credentials to enter patient companion view</>
                  )}
                </p>
              </div>

              <form onSubmit={handlePatientSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Caretaker's Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={patientCaretakerEmail}
                      onChange={(e) => setPatientCaretakerEmail(e.target.value)}
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
                    <Key className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={patientPassword}
                      onChange={(e) => setPatientPassword(e.target.value)}
                      placeholder="Set by your caretaker"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-[11px]">
                  <strong>Friendly Tip:</strong> Your caretaker configures this password in the Caretaker Portal. Default demo password is <code>Setu@2026</code>.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 mt-3 cursor-pointer"
                >
                  <span>{loading ? 'Verifying...' : `Sign In as ${patientProfile?.name || 'Patient'}`}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
