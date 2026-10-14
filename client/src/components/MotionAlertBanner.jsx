import React from 'react';
import { AlertTriangle, PhoneCall, X, ShieldAlert } from 'lucide-react';

export function MotionAlertBanner({ isAlertActive, peakAcceleration, lastDropTime, onDismiss, onSimulate }) {
  if (!isAlertActive) return null;

  return (
    <div className="bg-rose-600 text-white p-3 sm:p-4 shadow-xl border-b-4 border-rose-950 animate-pulse">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-black leading-tight">
              EMERGENCY MOTION ALERT: Tablet Fall / Sudden Impact Detected!
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-rose-100 mt-0.5">
              Acceleration exceeded safety threshold: <strong>{peakAcceleration} m/s²</strong> at {lastDropTime || 'Just now'}. 
              Verifying patient well-being.
            </p>
          </div>
        </div>

        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          <a
            href="tel:+919435012345"
            className="min-h-[44px] sm:min-h-[50px] px-4 sm:px-5 rounded-xl bg-white text-rose-900 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow hover:bg-rose-50"
          >
            <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-rose-700" />
            <span>Call Emergency Caregiver</span>
          </a>
          <button
            onClick={onDismiss}
            className="min-h-[44px] sm:min-h-[50px] px-3.5 sm:px-4 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-xs sm:text-sm border border-rose-400 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
