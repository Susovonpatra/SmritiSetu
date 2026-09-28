import React, { useState, useEffect } from 'react';
import { useDualAuth } from '../context/DualAuthContext';
import { useLocale } from '../context/LocaleContext';
import { DementiaLanguageToggle } from './DementiaLanguageToggle';
import { PatternTraceGame } from './PatternTraceGame';
import { VisualSemanticGame } from './VisualSemanticGame';
import { DailyRoutineGame } from './DailyRoutineGame';
import {
  Heart,
  KeyRound,
  Mail,
  ArrowRight,
  LogOut,
  AlertCircle,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';

function getTimeBasedGreeting(patientName = 'Friend', lang = 'en') {
  const hour = new Date().getHours();
  let period = 'morning';
  let Icon = Sun;

  if (hour >= 4 && hour < 12) {
    period = 'morning';
    Icon = Sun;
  } else if (hour >= 12 && hour < 17) {
    period = 'afternoon';
    Icon = Sunset;
  } else {
    period = 'evening';
    Icon = Moon;
  }

  const greetings = {
    or: {
      morning: `ଶୁଭ ସକାଳ, ${patientName}`,
      afternoon: `ଶୁଭ ଅପରାହ୍ନ, ${patientName}`,
      evening: `ଶୁଭ ସନ୍ଧ୍ୟା, ${patientName}`
    },
    gu: {
      morning: `શુભ સવાર, ${patientName}`,
      afternoon: `શુભ બપોર, ${patientName}`,
      evening: `શુભ સાંજ, ${patientName}`
    },
    as: {
      morning: `শুভ প্ৰভাত, ${patientName}`,
      afternoon: `শুভ অপৰাহ্ণ, ${patientName}`,
      evening: `শুভ সন্ধিয়া, ${patientName}`
    },
    en: {
      morning: `Good Morning, ${patientName}`,
      afternoon: `Good Afternoon, ${patientName}`,
      evening: `Good Evening, ${patientName}`
    }
  };

  const selectedMap = greetings[lang] || greetings.en;
  const text = selectedMap[period] || `Good Day, ${patientName}`;

  return { text, period, Icon };
}

export function PatientPortal({ onExitToHome }) {
  const { patientSession, patientLogin, signOutPatient } = useDualAuth();
  const { activeLang, regionInfo, t } = useLocale();

  const [activeGameTab, setActiveGameTab] = useState('pattern'); // 'pattern' | 'visual' | 'routine'
  const [caretakerEmail, setCaretakerEmail] = useState('');
  const [patientPassword, setPatientPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const patientName = patientSession?.patient_name || 'Bhaben Baruah';
  const greetingData = getTimeBasedGreeting(patientName, activeLang);
  const GreetingIcon = greetingData.Icon;

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await patientLogin({ caretakerEmail, patientPassword });
    } catch (err) {
      setErrorMsg('Invalid credentials. Please verify caretaker email and patient password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOutPatient();
    if (onExitToHome) onExitToHome();
  };

  // ── AUTHENTICATED PATIENT COMPANION PAGE ──
  if (patientSession) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 font-sans pb-12">
        {/* Top Header Card: Real-Time Dynamic Greeting & Regional Language Switcher */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <GreetingIcon className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-block px-2.5 py-0.5 bg-emerald-500/10 text-emerald-300 rounded-full text-[11px] sm:text-xs font-semibold border border-emerald-500/20">
                  Patient Companion Portal
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">
                  • Caretaker: <strong className="text-emerald-300">{patientSession.caretaker_name || patientSession.caretaker_email}</strong>
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-1 leading-tight">
                {greetingData.text}
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
            {/* Regional Language Toggle for Patient */}
            <div className="bg-slate-800 p-1 rounded-2xl border border-slate-700">
              <DementiaLanguageToggle showToggleOnly />
            </div>

            {/* Exit Portal Button */}
            <button
              onClick={handleSignOut}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Exit Patient Companion"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* ── 1. TODAY'S CARE SCHEDULE (Dementia-Friendly, Clear, Calming) ── */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-slate-200/90 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Today's Care Schedule
                </h2>
                <p className="text-xs text-slate-500">
                  Personalized care routine synchronized with your family caretaker
                </p>
              </div>
            </div>

            <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-xs">
              Active Routine
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
            {/* Morning Hydration */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Morning • 8:00 AM
                </span>
                <h3 className="text-sm font-bold text-emerald-950 truncate">
                  Morning Hydration &amp; Tea
                </h3>
                <p className="text-xs text-emerald-700">Warm water, fresh fruit &amp; medicine</p>
              </div>
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                ✓
              </span>
            </div>

            {/* Prescribed Memory Game */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-800 block">
                  Midday • 11:30 AM
                </span>
                <h3 className="text-sm font-bold text-indigo-950 truncate">
                  PatternTrace Memory Play
                </h3>
                <p className="text-xs text-indigo-700">Gentle visuospatial puzzle session</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 text-[10px] font-bold shrink-0">
                Now Playing
              </span>
            </div>

            {/* Afternoon Stroll */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                  Afternoon • 4:30 PM
                </span>
                <h3 className="text-sm font-bold text-amber-950 truncate">
                  Gentle Courtyard Stroll
                </h3>
                <p className="text-xs text-amber-800">15 minutes fresh air &amp; family chat</p>
              </div>
              <span className="text-[10px] font-bold uppercase text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded shrink-0">
                Scheduled
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. PRESCRIBED COGNITIVE GAMES SECTION ── */}
        <div className="space-y-4">
          {/* Game Switcher Tabs */}
          <div className="max-w-2xl mx-auto grid grid-cols-3 gap-1.5 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300 shadow-inner">
            <button
              onClick={() => setActiveGameTab('pattern')}
              className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer text-center ${
                activeGameTab === 'pattern'
                  ? 'bg-indigo-900 text-white shadow border border-indigo-950'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeGameTab === 'pattern' ? 'text-indigo-300' : 'text-indigo-700'}`} />
              <span className="hidden sm:inline">1. {t('games.patternTitle') || 'PatternTrace'}</span>
              <span className="sm:hidden">1. Pattern</span>
            </button>

            <button
              onClick={() => setActiveGameTab('visual')}
              className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer text-center ${
                activeGameTab === 'visual'
                  ? 'bg-emerald-800 text-white shadow border border-emerald-900'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Brain className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeGameTab === 'visual' ? 'text-emerald-300' : 'text-emerald-700'}`} />
              <span className="hidden sm:inline">2. {t('games.visualTitle') || 'Picture Match'}</span>
              <span className="sm:hidden">2. Picture</span>
            </button>

            <button
              onClick={() => setActiveGameTab('routine')}
              className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer text-center ${
                activeGameTab === 'routine'
                  ? 'bg-emerald-800 text-white shadow border border-emerald-900'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeGameTab === 'routine' ? 'text-emerald-300' : 'text-emerald-700'}`} />
              <span className="hidden sm:inline">3. {t('games.routineTitle') || 'Daily Routine'}</span>
              <span className="sm:hidden">3. Routine</span>
            </button>
          </div>

          {/* Active Game Renderer */}
          <div className="pt-2">
            {activeGameTab === 'pattern' && (
              <PatternTraceGame
                patientId={1}
                onComplete={() => setActiveGameTab('visual')}
              />
            )}

            {activeGameTab === 'visual' && (
              <VisualSemanticGame
                dialect={regionInfo.englishName || 'Odia'}
                onGameComplete={() => setActiveGameTab('routine')}
              />
            )}

            {activeGameTab === 'routine' && (
              <DailyRoutineGame
                dialect={regionInfo.englishName || 'Odia'}
                onGameComplete={() => setActiveGameTab('pattern')}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── UNREGISTERED / SIGN IN VIEW FOR PATIENT ──
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl border-2 border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6 my-6">
      <div className="text-center">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center mb-3 border border-emerald-100 shadow-sm">
          <Heart className="w-7 h-7 fill-emerald-700" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">
          Patient Companion Sign In
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your caretaker's email and patient access password to enter.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
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
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition"
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
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          <span>{loading ? 'Verifying...' : 'Sign In as Patient'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
