import React from 'react';
import {
  Shield,
  Heart,
  Brain,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  ShieldCheck,
  Lock,
  Phone,
  FileText,
  Calendar
} from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

export function WelcomeLanding({ onOpenAuthModal }) {
  const { regionInfo } = useLocale();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 py-4">
      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 border border-slate-800 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Digital Cognitive Health &amp; Dementia Care Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white font-serif">
            Welcome to <span className="text-emerald-400">{regionInfo.nativeName || 'ସ୍ମୃତିସେତୁ'}</span> SmritiSetu
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
            SmritiSetu is an accessible, clinically informed digital health bridge designed for individuals living with Mild Cognitive Impairment (MCI) and dementia. We unite gentle visuospatial cognitive stimulation with longitudinal biomarker tracking for families, caregivers, and primary health workers across India.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onOpenAuthModal('patient')}
              className="px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm flex items-center gap-2.5 shadow-lg border border-emerald-600 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 text-emerald-200 fill-emerald-200" />
              <span>Enter Patient Companion</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenAuthModal('caretaker')}
              className="px-6 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-indigo-900 text-white font-bold text-sm flex items-center gap-2.5 border border-slate-700 hover:border-indigo-600 transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 text-indigo-300" />
              <span>Caretaker Portal &amp; Analytics</span>
            </button>
          </div>
        </div>

        {/* Ambient Decorative Background Glow */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── TWO DEDICATED PORTAL ENTRY CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 1. PATIENT COMPANION PORTAL CARD */}
        <div className="bg-white rounded-3xl p-7 sm:p-8 border-2 border-slate-200/80 shadow-md hover:border-emerald-600/60 transition-all flex flex-col justify-between space-y-6 group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-sm group-hover:scale-105 transition-transform">
                <Heart className="w-7 h-7 fill-emerald-700" />
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                Patient Portal
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Patient Companion Experience
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Calm, accessible, zero-stress interface tailored for elderly users.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs font-semibold text-slate-700 pt-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Real-time time-aware greetings (Morning, Afternoon, Evening)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Regional language toggle (Odia, Assamese, Gujarati, English)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>PatternTrace™ 3×3 adaptive visuospatial working memory game</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Today's structured care &amp; hydration routine schedule</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>88px touch targets with zero punitive buzzers or timers</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onOpenAuthModal('patient')}
            className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Patient Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 2. CARETAKER & CLINICAL ANALYTICS CARD */}
        <div className="bg-white rounded-3xl p-7 sm:p-8 border-2 border-slate-200/80 shadow-md hover:border-indigo-600/60 transition-all flex flex-col justify-between space-y-6 group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shadow-sm group-hover:scale-105 transition-transform">
                <Shield className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold">
                Caretaker Portal
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Caregiver Clinical &amp; Telemetry Hub
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Formal clinical dashboard strictly in English for families &amp; clinicians.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs font-semibold text-slate-700 pt-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Rolling 7-day cognitive latency drift index (+35% alert)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>PatternTrace adaptive staircase chart &amp; perseveration flags</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Manage dedicated Patient Access Passwords securely</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>One-click direct access to launch &amp; test Patient View</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Exportable ICMR / MoCA compliant Clinical PDF summaries</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onOpenAuthModal('caretaker')}
            className="w-full py-3.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Caretaker Login / Sign Up</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 3 CLINICAL PILLARS SECTION ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold mb-3">
            <Brain className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">Adaptive Working Memory</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Non-punitive 3×3 matrix puzzles that scale based on real-time neurocognitive capacity without creating patient distress.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-3">
            <Activity className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">Longitudinal Telemetry</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Passive touch latency and psychomotor tremor tracking to detect subtle cognitive slowdowns weeks before clinical visits.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">DPDP &amp; eSanjeevani Ready</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Offline-first Dexie.js database with ABHA linkage and instantaneous telemedicine dispatch to state medical institutions.
          </p>
        </div>
      </div>
    </div>
  );
}
