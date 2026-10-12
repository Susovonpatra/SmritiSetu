import React from 'react';
import { Key, Lock, CheckCircle2, AlertCircle, Copy, User } from 'lucide-react';

export function PatientSecurityTab({
  caretakerUser,
  patientProfile,
  patientPassword,
  setPatientPassword,
  passUpdateStatus,
  isUpdatingPass,
  onSetPatientPassword,
  onCopyCredentials,
  copied,
  displayName,
  displayPatientName,
  displayPatientAge,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Manage Dedicated Patient Access Password Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Patient Access Password</h2>
            <p className="text-xs text-slate-500">Stored as a secure bcrypt hash in `patient_profiles`</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Your patient logs in at the <strong>Patient Portal</strong> using your email (<code className="break-all">{caretakerUser?.email}</code>) and this dedicated password.
        </p>

        {passUpdateStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              passUpdateStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {passUpdateStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{passUpdateStatus.text}</span>
          </div>
        )}

        <form onSubmit={onSetPatientPassword} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Set New Patient Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                minLength={6}
                value={patientPassword}
                onChange={(e) => setPatientPassword(e.target.value)}
                placeholder="e.g. Setu@2026 or EasyMemory123"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              type="submit"
              disabled={isUpdatingPass}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{isUpdatingPass ? 'Updating...' : 'Save Patient Password'}</span>
            </button>

            <button
              type="button"
              onClick={onCopyCredentials}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Copy Login Credentials"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Caretaker & Linked Patient Identity Overview */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Auth &amp; Linkage Metadata</h2>
            <p className="text-xs text-slate-500">Security &amp; compliance tokens</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block mb-0.5">Caretaker Name</span>
            <p className="font-semibold text-slate-800 truncate">{displayName}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block mb-0.5">Email</span>
            <p className="font-semibold text-slate-800 truncate">{caretakerUser?.email}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block mb-0.5">Linked Patient</span>
            <p className="font-semibold text-slate-800 truncate">{displayPatientName} (Age {displayPatientAge})</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block mb-0.5">ABHA ID</span>
            <p className="font-semibold text-slate-800 truncate">{patientProfile?.abha_id || 'Not Set'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
