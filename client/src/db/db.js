import Dexie from 'dexie';

export const db = new Dexie('SmritiSetuDB');

// Define database schema matching the backend tables
db.version(2).stores({
  patients: '++id, abha_id, name, age, dialect, locality, dementia_duration, caregiver_name, caregiver_phone, created_at',
  telemetry: '++id, patient_id, game_type, timestamp, latency_ms, jitter_px, accuracy_score, source',
  patterntrace_trials: '++id, trial_id, patient_id, level, accuracy_score, sequence_match, spatial_match, initiation_latency_ms, total_execution_time_ms, perseveration_detected, omission_count, commission_count, timestamp',
  consent: '++id, patient_id, caregiver_name, telemetry_consent, voice_storage_consent, abha_linkage_consent, signature_hash, timestamp',
  pending_sync: '++id, type, timestamp, status',
  asha_queue: '++id, patient_id, patient_name, village, triage_status, notes, timestamp, synced'
});

// Seed default patient if empty for quick offline demonstration
export async function initDefaultData() {
  const count = await db.patients.count();
  
  // Clean up any old mock proxy patient records
  const oldProxy = await db.patients.filter(p => p.name === 'Bhaben Baruah').toArray();
  for (const p of oldProxy) {
    await db.patients.delete(p.id);
  }

  // Seed baseline telemetry for the past 7 days so caregiver charts & drift work immediately
  const telemetryCount = await db.telemetry.count();
  if (telemetryCount === 0) {
    const baselineRecords = [];
    const now = Date.now();
    for (let i = 14; i >= 1; i--) {
      const pastTime = new Date(now - i * 24 * 60 * 60 * 1000).toISOString();
      const driftFactor = i <= 7 ? 1.25 : 1.0;
      baselineRecords.push({
        patient_id: 1,
        game_type: i % 2 === 0 ? 'visual_matching' : 'routine_sequencer',
        timestamp: pastTime,
        latency_ms: Math.round((820 + Math.random() * 80) * driftFactor),
        jitter_px: Math.round(12 + Math.random() * 10),
        accuracy_score: i <= 3 ? 0.8 : 0.95,
        source: 'PWA'
      });
    }
    await db.telemetry.bulkAdd(baselineRecords);
  }

  // Seed realistic PatternTrace baseline trials
  const trialsCount = await db.patterntrace_trials?.count();
  if (trialsCount === 0 && db.patterntrace_trials) {
    const now = Date.now();
    const patternTraceSeed = [
      {
        trial_id: 'seed-pt-01',
        patient_id: patientId,
        level: 1,
        target_sequence: [0, 1],
        user_sequence: [0, 1],
        accuracy_score: 1.0,
        sequence_match: true,
        spatial_match: true,
        initiation_latency_ms: 780,
        total_execution_time_ms: 1850,
        perseveration_detected: false,
        omission_count: 0,
        commission_count: 0,
        timestamp: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        trial_id: 'seed-pt-02',
        patient_id: patientId,
        level: 1,
        target_sequence: [3, 4],
        user_sequence: [3, 4],
        accuracy_score: 1.0,
        sequence_match: true,
        spatial_match: true,
        initiation_latency_ms: 810,
        total_execution_time_ms: 1920,
        perseveration_detected: false,
        omission_count: 0,
        commission_count: 0,
        timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        trial_id: 'seed-pt-03',
        patient_id: patientId,
        level: 2,
        target_sequence: [0, 1, 2],
        user_sequence: [0, 1, 2],
        accuracy_score: 1.0,
        sequence_match: true,
        spatial_match: true,
        initiation_latency_ms: 890,
        total_execution_time_ms: 2200,
        perseveration_detected: false,
        omission_count: 0,
        commission_count: 0,
        timestamp: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        trial_id: 'seed-pt-04',
        patient_id: patientId,
        level: 2,
        target_sequence: [0, 3, 6],
        user_sequence: [0, 3, 6],
        accuracy_score: 1.0,
        sequence_match: true,
        spatial_match: true,
        initiation_latency_ms: 920,
        total_execution_time_ms: 2350,
        perseveration_detected: false,
        omission_count: 0,
        commission_count: 0,
        timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        trial_id: 'seed-pt-05',
        patient_id: patientId,
        level: 3,
        target_sequence: [0, 1, 4, 3],
        user_sequence: [0, 1, 4, 3],
        accuracy_score: 1.0,
        sequence_match: true,
        spatial_match: true,
        initiation_latency_ms: 1050,
        total_execution_time_ms: 3100,
        perseveration_detected: false,
        omission_count: 0,
        commission_count: 0,
        timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        trial_id: 'seed-pt-06',
        patient_id: patientId,
        level: 3,
        target_sequence: [1, 2, 5, 4],
        user_sequence: [0, 1, 4, 3], // perseveration of previous pattern!
        accuracy_score: 0.25,
        sequence_match: false,
        spatial_match: false,
        initiation_latency_ms: 1280,
        total_execution_time_ms: 3400,
        perseveration_detected: true,
        omission_count: 2,
        commission_count: 2,
        timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        trial_id: 'seed-pt-07',
        patient_id: patientId,
        level: 2,
        target_sequence: [3, 4, 7],
        user_sequence: [3, 4, 7],
        accuracy_score: 1.0,
        sequence_match: true,
        spatial_match: true,
        initiation_latency_ms: 860,
        total_execution_time_ms: 2150,
        perseveration_detected: false,
        omission_count: 0,
        commission_count: 0,
        timestamp: new Date(now - 12 * 60 * 60 * 1000).toISOString()
      }
    ];
    if (db.patterntrace_trials) {
      await db.patterntrace_trials.bulkAdd(patternTraceSeed);
    }

    // Seed ASHA door-to-door triage visits
    await db.asha_queue.bulkAdd([
      {
        patient_id: patientId,
        patient_name: 'Kamal Das',
        village: 'Rampur',
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
