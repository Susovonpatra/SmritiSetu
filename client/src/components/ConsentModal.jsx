import React, { useState } from 'react';
import { ShieldCheck, Check, Key, FileText, X } from 'lucide-react';
import { generateSessionHash } from '../utils/crypto';
import { db } from '../db/db';

export function ConsentModal({ isOpen, onClose, onConsentComplete, patient }) {
  const [caregiverName, setCaregiverName] = useState(patient?.caregiver_name || 'Ananya Baruah');
  const [telemetryConsent, setTelemetryConsent] = useState(true);
  const [voiceStorageConsent, setVoiceStorageConsent] = useState(true);
  const [abhaLinkageConsent, setAbhaLinkageConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureHash, setSignatureHash] = useState('');

  if (!isOpen) return null;

  const handleGrantConsent = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        patient_id: patient?.id || 1,
        caregiver_name: caregiverName,
        telemetry_consent: telemetryConsent,
        voice_storage_consent: voiceStorageConsent,
        abha_linkage_consent: abhaLinkageConsent,
      };

      const hash = await generateSessionHash(payload);
      setSignatureHash(hash);

      // Store in Dexie
      await db.consent.add({
        ...payload,
        signature_hash: hash,
        timestamp: new Date().toISOString()
      });

      // Try syncing to backend
      try {
        await fetch('http://127.0.0.1:8000/api/v1/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, signature_hash: hash })
        });
      } catch (e) {
        // Offline safe: stored in Dexie
      }

      setTimeout(() => {
        setIsSubmitting(false);
        if (onConsentComplete) onConsentComplete(hash);
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl border-4 border-zinc-900 shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-zinc-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border-2 border-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-emerald-800" />
            </div>
            <div>
              <h2 id="consent-title" className="text-2xl font-black text-zinc-900">
                DPDP 2023 Digital Consent
              </h2>
              <p className="text-base font-semibold text-zinc-600">
                Caregiver Proxy Authorization & Data Protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border-2 border-zinc-400 hover:bg-zinc-100 min-h-0 min-w-0"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-zinc-800" />
          </button>
        </div>

        {/* Patient Notice */}
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-800 mb-6 text-zinc-900">
          <p className="text-base font-medium leading-relaxed">
            As authorized under the <b>Digital Personal Data Protection (DPDP) Act 2023</b>, 
            the legal caregiver acts on behalf of <b>{patient?.name || 'Bhaben Baruah'}</b> (ABHA: {patient?.abha_id || 'NER-ASM-9821-4412'}). 
            Please configure granular telemetry permissions:
          </p>
        </div>

        {/* Form Controls */}
        <div className="space-y-5 mb-8">
          <div>
            <label className="block text-lg font-bold text-zinc-900 mb-2">
              Primary Caregiver Legal Name:
            </label>
            <input
              type="text"
              value={caregiverName}
              onChange={(e) => setCaregiverName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-3 border-zinc-800 text-xl font-medium focus:border-emerald-700"
              placeholder="e.g., Ananya Baruah"
            />
          </div>

          {/* Granular Toggles */}
          <div className="space-y-4">
            <label className="flex items-start gap-4 p-4 rounded-2xl border-2 border-zinc-300 hover:border-zinc-800 bg-zinc-50 cursor-pointer">
              <input
                type="checkbox"
                checked={telemetryConsent}
                onChange={(e) => setTelemetryConsent(e.target.checked)}
                className="w-8 h-8 rounded-lg text-emerald-700 border-2 border-zinc-800 mt-1"
              />
              <div className="flex-1">
                <span className="text-lg font-bold text-zinc-900 block">
                  Local Cognitive Telemetry & Motor Tremor Tracking
                </span>
                <span className="text-base text-zinc-600 block mt-1">
                  Enables millisecond reaction latency and capacitive jitter logging to detect cognitive decline.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 rounded-2xl border-2 border-zinc-300 hover:border-zinc-800 bg-zinc-50 cursor-pointer">
              <input
                type="checkbox"
                checked={voiceStorageConsent}
                onChange={(e) => setVoiceStorageConsent(e.target.checked)}
                className="w-8 h-8 rounded-lg text-emerald-700 border-2 border-zinc-800 mt-1"
              />
              <div className="flex-1">
                <span className="text-lg font-bold text-zinc-900 block">
                  Regional Voice Prompt Synthesis & Storage
                </span>
                <span className="text-base text-zinc-600 block mt-1">
                  Allows local audio cues in Assamese / Manipuri for cultural reminiscence and IVR checks.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 rounded-2xl border-2 border-zinc-300 hover:border-zinc-800 bg-zinc-50 cursor-pointer">
              <input
                type="checkbox"
                checked={abhaLinkageConsent}
                onChange={(e) => setAbhaLinkageConsent(e.target.checked)}
                className="w-8 h-8 rounded-lg text-emerald-700 border-2 border-zinc-800 mt-1"
              />
              <div className="flex-1">
                <span className="text-lg font-bold text-zinc-900 block">
                  Ayushman Bharat Health Account (ABHA) Linkage
                </span>
                <span className="text-base text-zinc-600 block mt-1">
                  Allows clinical dossier export to eSanjeevani teleconsultation with district medical officers.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Cryptographic Session Hash Preview */}
        {signatureHash && (
          <div className="mb-6 p-4 rounded-2xl bg-zinc-100 border-2 border-zinc-400">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-1">
              <Key className="w-4 h-4 text-emerald-800" />
              <span>SHA-256 Cryptographic Session Signature:</span>
            </div>
            <code className="text-xs break-all text-emerald-900 font-mono">
              {signatureHash}
            </code>
          </div>
        )}

        {/* Action Button: Minimum 72px touch target */}
        <button
          onClick={handleGrantConsent}
          disabled={isSubmitting || !caregiverName}
          className="w-full min-h-[72px] rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] text-white text-xl font-black flex items-center justify-center gap-3 border-3 border-zinc-900 shadow-[0_5px_0_#18181B] transition-transform"
        >
          <Check className="w-8 h-8 text-emerald-300" />
          <span>{isSubmitting ? 'Generating Hash & Registering...' : 'Cryptographically Sign & Authorize (DPDP)'}</span>
        </button>
      </div>
    </div>
  );
}
