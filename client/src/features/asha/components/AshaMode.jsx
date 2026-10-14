import React, { useState } from 'react';
import { UserCheck, Plus, CloudUpload, AlertTriangle, CheckCircle, ShieldAlert, MapPin, ClipboardList, Send } from 'lucide-react';
import { useLocale } from '@/features/localization/context/LocaleContext';
import { useAshaTriage } from '../hooks/useAshaTriage';

export function AshaMode({ onOpenTeleconsult }) {
  const { t } = useLocale();
  const { queue, isSyncing, addScreeningRecord, syncQueueToPhc } = useAshaTriage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [village, setVillage] = useState('');
  const [triageStatus, setTriageStatus] = useState('Amber');
  const [notes, setNotes] = useState('');

  const [feedback, setFeedback] = useState(null);

  const handleAddVisit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setFeedback({ type: 'error', message: 'Please enter patient name.' });
      return;
    }

    try {
      await addScreeningRecord({
        patientId: Math.floor(Math.random() * 1000) + 1,
        patientName: patientName.trim(),
        village: village.trim(),
        triageStatus,
        notes: notes.trim()
      });

      const savedName = patientName.trim();
      setPatientName('');
      setNotes('');
      setShowAddModal(false);
      setFeedback({ type: 'success', message: `Screening for "${savedName}" recorded into offline Dexie triage database.` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Could not record screening. Please verify details and try again.' });
    }
  };

  const handleSyncToPHC = async () => {
    try {
      await syncQueueToPhc();
      setFeedback({ type: 'success', message: 'Household screenings successfully synced to PHC server!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setFeedback({ type: 'error', message: 'Network unavailable. Records safely preserved in on-device storage.' });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'Red':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Amber':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="min-w-0">
          <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-800 font-semibold text-xs mb-1.5 border border-teal-200/60">
            {t('asha.tierBadge')}
          </span>
          <h2 className="text-xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 text-teal-700 shrink-0" />
            <span className="truncate">{t('asha.title')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('asha.workerId')}: <strong>ASHA-NAGAON-01</strong> | {t('asha.subCenter')}: <strong>Raha PHC</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('asha.newScreeningBtn')}</span>
          </button>
          <button
            onClick={handleSyncToPHC}
            disabled={isSyncing}
            className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 transition cursor-pointer"
          >
            <CloudUpload className="w-4 h-4 text-slate-600" />
            <span>{isSyncing ? 'Syncing...' : t('asha.syncToPhcBtn')}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-0.5"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      )}

      {/* Triage Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-900 text-sm">{t('asha.stable')}</span>
            <CheckCircle className="w-5 h-5 text-emerald-700" />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-emerald-950 mt-1 block">
            {queue.filter(q => q.triage_status === 'Green').length} {t('asha.households')}
          </span>
          <span className="text-xs text-emerald-700">{t('asha.stableSub')}</span>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 text-sm">{t('asha.moderate')}</span>
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-amber-950 mt-1 block">
            {queue.filter(q => q.triage_status === 'Amber').length} {t('asha.households')}
          </span>
          <span className="text-xs text-amber-700">{t('asha.moderateSub')}</span>
        </div>

        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-900 text-sm">{t('asha.urgent')}</span>
            <ShieldAlert className="w-5 h-5 text-rose-700" />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-rose-950 mt-1 block">
            {queue.filter(q => q.triage_status === 'Red').length} {t('asha.households')}
          </span>
          <span className="text-xs text-rose-700">{t('asha.urgentSub')}</span>
        </div>
      </div>

      {/* Household Visit Table */}
      <div className="space-y-3">
        {queue.map((record) => (
          <div
            key={record.id}
            className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <span className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {record.patient_name}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border ${getBadgeStyle(record.triage_status)}`}>
                  {record.triage_status}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium ${record.synced ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-900'}`}>
                  {record.synced ? t('asha.synced') : t('asha.pending')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-slate-500 font-medium text-xs">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{record.village}</span>
                </span>
                <span>•</span>
                <span>{new Date(record.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {record.notes && (
                <p className="text-xs text-slate-700 font-normal mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {record.notes}
                </p>
              )}
            </div>

            {record.triage_status === 'Red' && (
              <button
                onClick={() => onOpenTeleconsult && onOpenTeleconsult(record)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t('asha.dispatchBtn')}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Visit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{t('asha.newScreeningBtn')}</h3>
            <form onSubmit={handleAddVisit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                  placeholder="Patient Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Village / Ward</label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Triage Priority</label>
                <select
                  value={triageStatus}
                  onChange={(e) => setTriageStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none font-semibold"
                >
                  <option value="Green">Green (Stable - Routine Follow-up)</option>
                  <option value="Amber">Amber (Moderate - Caregiver Alert)</option>
                  <option value="Red">Red (Urgent Clinical Alert - Dispatch Teleconsult)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observations / Clinical Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none h-20"
                  placeholder="Note symptoms, memory lapses, disorientation..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-sm transition"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
