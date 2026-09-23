import React from 'react';
import { AlertTriangle, PhoneCall, X, ShieldAlert } from 'lucide-react';

export function MotionAlertBanner({ isAlertActive, peakAcceleration, lastDropTime, onDismiss, onSimulate }) {
  if (!isAlertActive) {
    return (
      <div className="bg-zinc-100 border-b border-zinc-300 py-1.5 px-4 text-xs font-bold text-zinc-600 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-700" />
          <span>Motion Safety Guard Active (HTML5 devicemotion &gt;25 m/s² drop detector)</span>
        </span>
        <button
          onClick={onSimulate}
          className="text-xs bg-white hover:bg-zinc-200 text-zinc-800 px-3 py-1 rounded-md border border-zinc-400 font-semibold shadow-sm"
        >
          Test Tablet Drop Alert (28 m/s²)
        </button>
      </div>
    );
  }

  return (
    <div className="bg-rose-600 text-white p-4 shadow-xl border-b-4 border-rose-950 animate-pulse">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black">
              EMERGENCY MOTION ALERT: Tablet Fall / Sudden Impact Detected!
            </h3>
            <p className="text-sm font-semibold text-rose-100">
              Acceleration exceeded safety threshold: <strong>{peakAcceleration} m/s²</strong> at {lastDropTime || 'Just now'}. 
              Verifying patient well-being.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="tel:+919435012345"
            className="min-h-[50px] px-5 rounded-xl bg-white text-rose-900 font-black text-base flex items-center gap-2 shadow hover:bg-rose-50"
          >
            <PhoneCall className="w-5 h-5 text-rose-700" />
            <span>Call Caregiver Ananya</span>
          </a>
          <button
            onClick={onDismiss}
            className="min-h-[50px] px-4 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-sm border border-rose-400"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
