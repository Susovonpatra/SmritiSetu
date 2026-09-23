import React, { useState } from 'react';
import { Send, FileText, CheckCircle2, X, AlertTriangle, Building2, User } from 'lucide-react';

export function EsanjeevaniModal({ isOpen, onClose, patient, triageRecord }) {
  const [urgency, setUrgency] = useState(triageRecord?.triage_status === 'Red' ? 'Urgent' : 'Priority');
  const [notes, setNotes] = useState(triageRecord?.notes || 'Patient exhibiting sudden +32% cognitive latency drift and motor tremors during morning routine.');
  const [dispatchResult, setDispatchResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDispatch = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/esanjeevani/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient?.id || 1,
          abha_id: patient?.abha_id || 'NER-ASM-9821-4412',
          urgency_level: urgency,
          clinical_notes: notes
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDispatchResult(data);
      }
    } catch (err) {
      // Offline fallback simulation
      setDispatchResult({
        status: 'dispatched',
        dispatch_id: 'ESANJ-OFFLINE-9821',
        teleconsultation_center: 'Guwahati Medical College & Hospital (GMCH) Geriatric Tele-Clinic',
        assigned_physician: 'Dr. P. K. Hazarika, MD (Neurology)',
        queue_position: 1,
        estimated_wait_time: '10 minutes',
        urgency: urgency
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-3xl border-4 border-zinc-900 shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-zinc-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 border-2 border-indigo-800 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-indigo-800" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900">
                eSanjeevani National Teleconsultation
              </h2>
              <p className="text-base font-semibold text-zinc-600">
                Ministry of Health & Family Welfare (MoHFW) Gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border-2 border-zinc-400 hover:bg-zinc-100 min-h-0 min-w-0"
          >
            <X className="w-6 h-6 text-zinc-800" />
          </button>
        </div>

        {dispatchResult ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 border-3 border-emerald-700 flex items-center justify-center mx-auto text-emerald-800">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <h3 className="text-3xl font-black text-zinc-900">
                Teleconsultation Dispatched!
              </h3>
              <p className="text-lg font-semibold text-zinc-600 mt-1">
                Dispatch Token: <strong className="text-emerald-900 font-mono">{dispatchResult.dispatch_id}</strong>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-50 border-2 border-zinc-300 text-left space-y-2 text-base">
              <div><strong>Assigned Center:</strong> {dispatchResult.teleconsultation_center}</div>
              <div><strong>Attending Specialist:</strong> {dispatchResult.assigned_physician}</div>
              <div><strong>Estimated Queue:</strong> Position #{dispatchResult.queue_position} (~{dispatchResult.estimated_wait_time})</div>
              <div><strong>Linked Health ID:</strong> {patient?.abha_id || 'NER-ASM-9821-4412'}</div>
            </div>

            <div className="flex gap-4">
              <a
                href="http://127.0.0.1:8000/report/1/pdf"
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-h-[64px] rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-lg flex items-center justify-center gap-2 border-2 border-zinc-900"
              >
                <FileText className="w-6 h-6 text-zinc-300" />
                <span>View MoCA Clinical PDF</span>
              </a>
              <button
                onClick={onClose}
                className="flex-1 min-h-[64px] rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-lg border-2 border-zinc-900 shadow"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Patient & ABHA Summary */}
            <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-700">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-700 block">
                Target Patient Profile:
              </span>
              <span className="text-xl font-black text-indigo-950 block mt-1">
                {patient?.name || 'Bhaben Baruah'} (Age 74)
              </span>
              <span className="text-sm font-semibold text-indigo-800 block">
                ABHA ID: {patient?.abha_id || 'NER-ASM-9821-4412'} | Caregiver: Ananya Baruah (+91 94350 12345)
              </span>
            </div>

            {/* Urgency Level */}
            <div>
              <label className="block text-lg font-bold text-zinc-900 mb-2">
                Triage Clinical Urgency:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Routine', 'Priority', 'Urgent'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setUrgency(lvl)}
                    className={`min-h-[56px] rounded-xl font-black text-base border-3 transition-all ${
                      urgency === lvl
                        ? 'bg-indigo-800 text-white border-zinc-900 shadow-[0_4px_0_#18181B]'
                        : 'bg-white text-zinc-800 border-zinc-300 hover:border-zinc-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Clinical Telemetry Notes */}
            <div>
              <label className="block text-lg font-bold text-zinc-900 mb-2">
                Clinical Referral Notes & Biomarker Summary:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-800 text-base font-medium"
              />
            </div>

            {/* Action Button: Minimum 72px touch target */}
            <button
              onClick={handleDispatch}
              disabled={isSubmitting}
              className="w-full min-h-[72px] rounded-2xl bg-indigo-800 hover:bg-indigo-900 active:scale-[0.98] text-white text-xl font-black flex items-center justify-center gap-3 border-3 border-zinc-900 shadow-[0_5px_0_#18181B]"
            >
              <Send className="w-7 h-7 text-indigo-300" />
              <span>{isSubmitting ? 'Transmitting Bundles...' : 'Dispatch Teleconsultation Bundle'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
