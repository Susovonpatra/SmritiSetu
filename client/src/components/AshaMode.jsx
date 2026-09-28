import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, CloudUpload, AlertTriangle, CheckCircle, ShieldAlert, MapPin, ClipboardList, Send } from 'lucide-react';
import { db } from '../db/db';
import { useLocale } from '../context/LocaleContext';

export function AshaMode({ onOpenTeleconsult }) {
  const { t } = useLocale();
  const [queue, setQueue] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [village, setVillage] = useState('');
  const [triageStatus, setTriageStatus] = useState('Amber');
  const [notes, setNotes] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const loadQueue = async () => {
    const records = await db.asha_queue.reverse().toArray();
    setQueue(records);
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleAddVisit = async (e) => {
    e.preventDefault();
    if (!patientName) return;

    await db.asha_queue.add({
      patient_id: Math.floor(Math.random() * 1000) + 1,
      patient_name: patientName,
      village,
      triage_status: triageStatus,
      notes,
      timestamp: new Date().toISOString(),
      synced: false
    });

    setPatientName('');
    setNotes('');
    setShowAddModal(false);
    loadQueue();
  };

  const handleSyncToPHC = async () => {
    setIsSyncing(true);
    try {
      const unsynced = await db.asha_queue.filter(q => q.synced === false).toArray();
      if (unsynced.length > 0) {
        await fetch('http://127.0.0.1:8000/api/v1/asha/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(unsynced.map(u => ({
            patient_id: u.patient_id,
            patient_name: u.patient_name,
            village: u.village,
            triage_status: u.triage_status,
            notes: u.notes,
            worker_id: 'ASHA-NAGAON-01'
          })))
        });

        await db.asha_queue.filter(q => q.synced === false).modify({ synced: true });
        await loadQueue();
      }
    } catch (err) {
      console.warn('Sync failed (server offline), saved locally in Dexie');
    } finally {
      setIsSyncing(false);
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
                  placeholder="e.g. Ramesh Chandra Dash"
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
