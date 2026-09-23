import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, CloudUpload, AlertTriangle, CheckCircle, ShieldAlert, MapPin, ClipboardList } from 'lucide-react';
import { db } from '../db/db';

export function AshaMode({ onOpenTeleconsult }) {
  const [queue, setQueue] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [village, setVillage] = useState('Raha, Nagaon');
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
        return 'bg-red-100 text-red-900 border-red-700';
      case 'Amber':
        return 'bg-amber-100 text-amber-900 border-amber-700';
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-700';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-3xl border-4 border-zinc-900 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-3 border-zinc-200 pb-4 mb-6">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-teal-100 text-teal-900 font-bold text-sm mb-1">
            Rural Health Tier: Primary Health Centre (PHC) Field Portal
          </span>
          <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-teal-800" />
            <span>ASHA Companion Door-to-Door Triage Queue</span>
          </h2>
          <p className="text-base font-semibold text-zinc-600 mt-1">
            Worker ID: <strong>ASHA-NAGAON-01</strong> | Sub-Center: <strong>Raha PHC, Assam</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="min-h-[56px] px-5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-lg flex items-center gap-2 border-2 border-zinc-900 shadow-[0_4px_0_#18181B]"
          >
            <Plus className="w-6 h-6" />
            <span>New Household Screening</span>
          </button>
          <button
            onClick={handleSyncToPHC}
            disabled={isSyncing}
            className="min-h-[56px] px-5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-lg flex items-center gap-2 border-2 border-zinc-900 shadow-[0_4px_0_#18181B]"
          >
            <CloudUpload className="w-6 h-6 text-zinc-800" />
            <span>{isSyncing ? 'Syncing...' : 'Sync to PHC'}</span>
          </button>
        </div>
      </div>

      {/* Triage Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-2xl border-3 border-emerald-800 bg-emerald-50">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-900">Green (Stable)</span>
            <CheckCircle className="w-6 h-6 text-emerald-800" />
          </div>
          <span className="text-3xl font-black text-emerald-950 mt-1 block">
            {queue.filter(q => q.triage_status === 'Green').length} Households
          </span>
          <span className="text-xs font-semibold text-emerald-800">Routine follow-up in 30 days</span>
        </div>

        <div className="p-4 rounded-2xl border-3 border-amber-800 bg-amber-50">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900">Amber (Moderate Drift)</span>
            <AlertTriangle className="w-6 h-6 text-amber-800" />
          </div>
          <span className="text-3xl font-black text-amber-950 mt-1 block">
            {queue.filter(q => q.triage_status === 'Amber').length} Households
          </span>
          <span className="text-xs font-semibold text-amber-800">Weekly caregiver check advised</span>
        </div>

        <div className="p-4 rounded-2xl border-3 border-red-800 bg-red-50">
          <div className="flex items-center justify-between">
            <span className="font-bold text-red-900">Red (Urgent Clinical Alert)</span>
            <ShieldAlert className="w-6 h-6 text-red-800" />
          </div>
          <span className="text-3xl font-black text-red-950 mt-1 block">
            {queue.filter(q => q.triage_status === 'Red').length} Households
          </span>
          <span className="text-xs font-semibold text-red-800">Immediate eSanjeevani dispatch</span>
        </div>
      </div>

      {/* Household Visit Table */}
      <div className="space-y-4">
        {queue.map((record) => (
          <div
            key={record.id}
            className="p-5 rounded-2xl border-3 border-zinc-900 bg-white hover:bg-zinc-50 shadow-[0_4px_0_#18181B] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-zinc-900">
                  {record.patient_name}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-black border-2 ${getBadgeStyle(record.triage_status)}`}>
                  {record.triage_status} Priority
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${record.synced ? 'bg-zinc-100 text-zinc-600' : 'bg-amber-100 text-amber-900'}`}>
                  {record.synced ? 'Synced to PHC' : 'Offline Stored'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 font-semibold text-sm">
                <MapPin className="w-4 h-4 text-zinc-500" />
                <span>{record.village}</span>
                <span>•</span>
                <span>{new Date(record.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {record.notes && (
                <p className="text-base text-zinc-800 font-medium mt-2 bg-zinc-100 p-2.5 rounded-xl border border-zinc-300">
                  {record.notes}
                </p>
              )}
            </div>

            {record.triage_status === 'Red' && (
              <button
                onClick={() => onOpenTeleconsult && onOpenTeleconsult(record)}
                className="min-h-[56px] px-5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-base flex items-center gap-2 border-2 border-zinc-900 shadow shrink-0"
              >
                <span>Dispatch eSanjeevani</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Visit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl border-4 border-zinc-900 p-6 shadow-2xl">
            <h3 className="text-2xl font-black text-zinc-900 mb-4">
              Record Door-to-Door Household Screening
            </h3>
            <form onSubmit={handleAddVisit} className="space-y-4">
              <div>
                <label className="block text-base font-bold text-zinc-900 mb-1">
                  Elderly Patient Name:
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g., Gunaram Kalita"
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-800 text-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-zinc-900 mb-1">
                  Village / Gaon Panchayat:
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-800 text-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-zinc-900 mb-1">
                  Field Triage Status:
                </label>
                <select
                  value={triageStatus}
                  onChange={(e) => setTriageStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-800 text-lg font-bold"
                >
                  <option value="Green">Green (Stable, Orientated)</option>
                  <option value="Amber">Amber (Mild Confusion, Tremors Detected)</option>
                  <option value="Red">Red (Severe Disorientation, Missed Meds)</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-bold text-zinc-900 mb-1">
                  ASHA Clinical Observation Notes:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes on motor tremors, routine hesitation, or orientation..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-800 text-base font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[56px] px-5 rounded-xl border-2 border-zinc-400 font-bold text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[56px] px-6 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-black text-lg border-2 border-zinc-900 shadow"
                >
                  Save Screening (Offline First)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
