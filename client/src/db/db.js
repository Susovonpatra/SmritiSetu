import Dexie from 'dexie';

export const db = new Dexie('SmritiSetuDB');

// Define database schema matching the backend tables
db.version(1).stores({
  patients: '++id, abha_id, name, age, dialect, caregiver_name, caregiver_phone, created_at',
  telemetry: '++id, patient_id, game_type, timestamp, latency_ms, jitter_px, accuracy_score, source',
  consent: '++id, patient_id, caregiver_name, telemetry_consent, voice_storage_consent, abha_linkage_consent, signature_hash, timestamp',
  pending_sync: '++id, type, timestamp, status',
  asha_queue: '++id, patient_id, patient_name, village, triage_status, notes, timestamp, synced'
});

// Seed default patient if empty for quick offline demonstration
export async function initDefaultData() {
  const count = await db.patients.count();
  if (count === 0) {
    const patientId = await db.patients.add({
      abha_id: 'NER-ASM-9821-4412',
      name: 'Bhaben Baruah',
      age: 74,
      dialect: 'Assamese',
      caregiver_name: 'Ananya Baruah',
      caregiver_phone: '+91 94350 12345',
      baseline_latency: 850,
      created_at: new Date().toISOString()
    });

    // Seed initial consent
    await db.consent.add({
      patient_id: patientId,
      caregiver_name: 'Ananya Baruah',
      telemetry_consent: true,
      voice_storage_consent: true,
      abha_linkage_consent: true,
      signature_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      timestamp: new Date().toISOString()
    });

    // Seed baseline telemetry for the past 7 days so caregiver charts & drift work immediately
    const baselineRecords = [];
    const now = Date.now();
    for (let i = 14; i >= 1; i--) {
      const pastTime = new Date(now - i * 24 * 60 * 60 * 1000).toISOString();
      const driftFactor = i <= 7 ? 1.25 : 1.0; // slight recent drift
      baselineRecords.push({
        patient_id: patientId,
        game_type: i % 2 === 0 ? 'visual_matching' : 'routine_sequencer',
        timestamp: pastTime,
        latency_ms: Math.round((820 + Math.random() * 80) * driftFactor),
        jitter_px: Math.round(12 + Math.random() * 10),
        accuracy_score: i <= 3 ? 0.8 : 0.95,
        source: 'PWA'
      });
    }
    await db.telemetry.bulkAdd(baselineRecords);

    // Seed ASHA door-to-door triage visits
    await db.asha_queue.bulkAdd([
      {
        patient_id: patientId,
        patient_name: 'Bhaben Baruah',
        village: 'Raha, Nagaon',
        triage_status: 'Amber',
        notes: 'Mild confusion in morning routine; motor tremor slightly increased.',
        timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        synced: false
      },
      {
        patient_id: 2,
        patient_name: 'Hemoprova Saikia',
        village: 'Kaliabor, Nagaon',
        triage_status: 'Green',
        notes: 'Responsive, recognized all family photos, normal gait.',
        timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        synced: true
      },
      {
        patient_id: 3,
        patient_name: 'Birinchi Medhi',
        village: 'Samaguri, Nagaon',
        triage_status: 'Red',
        notes: 'Severe disorientation, missed blood pressure medicine, urgent teleconsult suggested.',
        timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        synced: false
      }
    ]);
  }
}
