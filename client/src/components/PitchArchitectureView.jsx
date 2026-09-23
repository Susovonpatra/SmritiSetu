import React from 'react';
import { Tablet, Users, PhoneCall, Database, FileSpreadsheet, Send, ArrowDown, ShieldCheck, Cpu } from 'lucide-react';

export function PitchArchitectureView({ onSelectTier }) {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-8 bg-white rounded-3xl border-4 border-zinc-900 shadow-xl space-y-10">
      {/* Banner */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-sm mb-3">
          Hackathon Architecture & Public Health Reach
        </span>
        <h2 className="text-4xl font-black text-zinc-900">
          SmritiSetu 3-Tier Public Health Architecture
        </h2>
        <p className="text-lg font-semibold text-zinc-600 mt-2">
          Bridging the digital divide for elderly dementia patients across the North Eastern Region (NER) from rural off-grid villages to state medical colleges.
        </p>
      </div>

      {/* 3-Tier Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 1: Home / Caregiver */}
        <div 
          onClick={() => onSelectTier('patient_games')}
          className="p-6 rounded-3xl border-4 border-zinc-900 bg-[#FFFDF7] hover:border-emerald-700 shadow-[0_6px_0_#18181B] cursor-pointer transition-all hover:-translate-y-1 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 border-2 border-emerald-800 flex items-center justify-center mb-4 text-emerald-900 group-hover:scale-110 transition-transform">
            <Tablet className="w-8 h-8" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
            Tier 1
          </span>
          <h3 className="text-2xl font-black text-zinc-900 mt-1">
            Home / Caregiver Tier
          </h3>
          <p className="text-sm font-semibold text-zinc-600 mt-2">
            Touch-optimized tablet PWA for daily at-home cognitive stimulation.
          </p>
          <ul className="mt-4 space-y-2 text-sm font-bold text-zinc-800">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
              <span>Tablet PWA (WCAG AAA)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
              <span>Cultural Mini-Games (Japi, Xorai)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
              <span>Reminiscence Vector Vault</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
              <span>Touch Jitter &amp; Tremor Tracking</span>
            </li>
          </ul>
          <div className="mt-6 pt-4 border-t border-zinc-300 text-xs font-black text-emerald-800">
            Launch Game &amp; Vault →
          </div>
        </div>

        {/* Tier 2: Rural Health Tier */}
        <div 
          onClick={() => onSelectTier('asha')}
          className="p-6 rounded-3xl border-4 border-zinc-900 bg-[#FFFDF7] hover:border-teal-700 shadow-[0_6px_0_#18181B] cursor-pointer transition-all hover:-translate-y-1 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-100 border-2 border-teal-800 flex items-center justify-center mb-4 text-teal-900 group-hover:scale-110 transition-transform">
            <Users className="w-8 h-8" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-teal-800">
            Tier 2
          </span>
          <h3 className="text-2xl font-black text-zinc-900 mt-1">
            Rural Health Tier
          </h3>
          <p className="text-sm font-semibold text-zinc-600 mt-2">
            ASHA field worker companion for remote door-to-door cognitive screening.
          </p>
          <ul className="mt-4 space-y-2 text-sm font-bold text-zinc-800">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-700"></span>
              <span>ASHA Companion Field App</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-700"></span>
              <span>Multi-patient Triage Queue</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-700"></span>
              <span>Door-to-Door Household Checks</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-700"></span>
              <span>Offline PHC Background Sync</span>
            </li>
          </ul>
          <div className="mt-6 pt-4 border-t border-zinc-300 text-xs font-black text-teal-800">
            Open ASHA Mode →
          </div>
        </div>

        {/* Tier 3: Off-Grid Remote */}
        <div 
          onClick={() => onSelectTier('ivr')}
          className="p-6 rounded-3xl border-4 border-zinc-900 bg-[#FFFDF7] hover:border-amber-700 shadow-[0_6px_0_#18181B] cursor-pointer transition-all hover:-translate-y-1 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-800 flex items-center justify-center mb-4 text-amber-900 group-hover:scale-110 transition-transform">
            <PhoneCall className="w-8 h-8" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-800">
            Tier 3
          </span>
          <h3 className="text-2xl font-black text-zinc-900 mt-1">
            Off-Grid Remote Tier
          </h3>
          <p className="text-sm font-semibold text-zinc-600 mt-2">
            2G feature-phone voice gateway requiring zero smartphone or data access.
          </p>
          <ul className="mt-4 space-y-2 text-sm font-bold text-zinc-800">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-700"></span>
              <span>2G Feature Phone IVR</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-700"></span>
              <span>Assamese / Manipuri Voice Menus</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-700"></span>
              <span>DTMF 3-Question Daily Check-in</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-700"></span>
              <span>Zero Internet / Data Needed</span>
            </li>
          </ul>
          <div className="mt-6 pt-4 border-t border-zinc-300 text-xs font-black text-amber-800">
            Test IVR Phone Simulator →
          </div>
        </div>
      </div>

      {/* Down Connector */}
      <div className="flex flex-col items-center justify-center text-zinc-400">
        <ArrowDown className="w-8 h-8 animate-bounce text-zinc-700" />
        <span className="text-xs font-black tracking-widest uppercase text-zinc-600">
          ALL TIERS CONVERGE ON CENTRAL ENGINE
        </span>
      </div>

      {/* Unified Hub Footer Card */}
      <div className="p-8 rounded-3xl bg-zinc-900 text-white border-4 border-zinc-950 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-10 h-10 text-emerald-400" />
            <div>
              <h3 className="text-2xl font-black">
                Unified DPDP Consent &amp; Telemetry Hub
              </h3>
              <p className="text-sm text-zinc-400 font-medium">
                FastAPI Scoring Engine + PostgreSQL / Dexie.js Unified Schema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-full border border-emerald-800">
            <ShieldCheck className="w-4 h-4" />
            <span>DPDP 2023 Cryptographic Verifier</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-zinc-800 border border-zinc-700">
            <span className="text-xs uppercase font-bold text-indigo-400 block mb-1">
              Biomarker Analytics
            </span>
            <h4 className="text-lg font-black text-white">
              Longitudinal Drift Analysis
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Calculates rolling 7-day reaction latency drift. Automatically raises clinical alerts when drift exceeds 35%.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-800 border border-zinc-700">
            <span className="text-xs uppercase font-bold text-amber-400 block mb-1">
              Diagnostic Export
            </span>
            <h4 className="text-lg font-black text-white">
              ICMR-NARI / MoCA Clinical PDF
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Generates an official single-page clinical dossier via ReportLab linking patient vitals, motor tremors, and ABHA ID.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-800 border border-zinc-700">
            <span className="text-xs uppercase font-bold text-emerald-400 block mb-1">
              National Health Integration
            </span>
            <h4 className="text-lg font-black text-white">
              eSanjeevani Teleconsultation
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              One-click referral dispatch connecting rural PHCs to Guwahati Medical College neurology outpatient departments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
