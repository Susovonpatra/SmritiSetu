import React from 'react';
import { Shield, Heart, ArrowRight, LogOut } from 'lucide-react';

export function CaretakerHeader({
  displayName,
  displayPatientName,
  patientProfile,
  onNavigateToPatientPortal,
  onSignOut,
}) {
  return (
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
        <button
          onClick={onNavigateToPatientPortal}
          className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow border border-emerald-600 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Heart className="w-4 h-4 fill-emerald-200 text-emerald-200 shrink-0" />
          <span>Launch Patient Portal</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </button>

        <button
          onClick={onSignOut}
          className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
