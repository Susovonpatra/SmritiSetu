import Dexie from 'dexie';

export const db = new Dexie('SmritiSetuDB');

// ── Version 1: Original schema (backward compat stub for smooth upgrades) ──
db.version(1).stores({
  patients: '++id, abha_id, name, age, dialect, locality, dementia_duration, caregiver_name, caregiver_phone, created_at',
  telemetry: '++id, patient_id, game_type, timestamp, latency_ms, jitter_px, accuracy_score, source',
  consent: '++id, patient_id, caregiver_name, telemetry_consent, voice_storage_consent, abha_linkage_consent, signature_hash, timestamp',
  pending_sync: '++id, type, timestamp, status',
  asha_queue: '++id, patient_id, patient_name, village, triage_status, notes, timestamp, synced'
});

// ── Version 2: Added patterntrace_trials table ──
db.version(2).stores({
  patients: '++id, abha_id, name, age, dialect, locality, dementia_duration, caregiver_name, caregiver_phone, created_at',
  telemetry: '++id, patient_id, game_type, timestamp, latency_ms, jitter_px, accuracy_score, source',
  patterntrace_trials: '++id, trial_id, patient_id, level, accuracy_score, sequence_match, spatial_match, initiation_latency_ms, total_execution_time_ms, perseveration_detected, omission_count, commission_count, timestamp',
  consent: '++id, patient_id, caregiver_name, telemetry_consent, voice_storage_consent, abha_linkage_consent, signature_hash, timestamp',
  pending_sync: '++id, type, timestamp, status',
  asha_queue: '++id, patient_id, patient_name, village, triage_status, notes, timestamp, synced'
});

// ── Version 3: Added biographical CMS & analytics tables ──
db.version(3).stores({
  patients: '++id, abha_id, name, age, dialect, locality, dementia_duration, caregiver_name, caregiver_phone, created_at',
  telemetry: '++id, patient_id, game_type, timestamp, latency_ms, jitter_px, accuracy_score, source',
  patterntrace_trials: '++id, trial_id, patient_id, level, accuracy_score, sequence_match, spatial_match, initiation_latency_ms, total_execution_time_ms, perseveration_detected, omission_count, commission_count, timestamp',
  biographical_questions: '++id, questionId, patientId, relationTier, orderIndex, updatedAt',
  biographical_trials: '++id, trialId, sessionId, patientId, timestamp, questionId, relationTier, isCorrect, latencyMs',
  consent: '++id, patient_id, caregiver_name, telemetry_consent, voice_storage_consent, abha_linkage_consent, signature_hash, timestamp',
  pending_sync: '++id, type, timestamp, status',
  asha_queue: '++id, patient_id, patient_name, village, triage_status, notes, timestamp, synced'
});

// ── Version 4: Added Match the Shapes sessions & offline events tables ──
db.version(4).stores({
  patients: '++id, abha_id, name, age, dialect, locality, dementia_duration, caregiver_name, caregiver_phone, created_at',
  telemetry: '++id, patient_id, game_type, timestamp, latency_ms, jitter_px, accuracy_score, source',
  patterntrace_trials: '++id, trial_id, patient_id, level, accuracy_score, sequence_match, spatial_match, initiation_latency_ms, total_execution_time_ms, perseveration_detected, omission_count, commission_count, timestamp',
  biographical_questions: '++id, questionId, patientId, relationTier, orderIndex, updatedAt',
  biographical_trials: '++id, trialId, sessionId, patientId, timestamp, questionId, relationTier, isCorrect, latencyMs',
  shape_game_sessions: '++id, sessionId, patientId, status, roundsCompleted, independenceScore, startedAt, synced',
  shape_game_events: '++id, eventId, sessionId, eventType, roundNumber, shapeId, timestamp, synced',
  shape_game_attempts: '++id, attemptId, sessionId, shapeId, roundNumber, solveTimeMs, hintsNeeded, synced',
  consent: '++id, patient_id, caregiver_name, telemetry_consent, voice_storage_consent, abha_linkage_consent, signature_hash, timestamp',
  pending_sync: '++id, type, timestamp, status',
  asha_queue: '++id, patient_id, patient_name, village, triage_status, notes, timestamp, synced'
});

export const DEFAULT_BIOGRAPHICAL_QUESTIONS = [
  {
    questionId: 'bio-q1',
    patientId: 1,
    questionText: 'Who is your lifelong spouse / partner?',
    relationTier: 'TIER_1_CORE',
    options: ['Malati Baruah', 'Sunita Devi', 'Rekha Sharma', 'Kavita Das'],
    correctOptionIndex: 0,
    orderIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    questionId: 'bio-q2',
    patientId: 1,
    questionText: 'Where is your primary family ancestral hometown?',
    relationTier: 'TIER_1_CORE',
    options: ['Bishnu Rabha Road, Tezpur', 'Guwahati Station Road', 'Jorhat Old Colony', 'Nagaon Sadar'],
    correctOptionIndex: 0,
    orderIndex: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    questionId: 'bio-q3',
    patientId: 1,
    questionText: 'Who is your eldest daughter who visits you with tea?',
    relationTier: 'TIER_2_CHILD',
    options: ['Ananya Baruah', 'Pooja Baruah', 'Ritu Kalita', 'Deepa Sarma'],
    correctOptionIndex: 0,
    orderIndex: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    questionId: 'bio-q4',
    patientId: 1,
    questionText: 'What is your son’s profession in engineering?',
    relationTier: 'TIER_2_CHILD',
    options: ['College Professor', 'Civil Engineer', 'Bank Manager', 'Pediatrician'],
    correctOptionIndex: 1,
    orderIndex: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    questionId: 'bio-q5',
    patientId: 1,
    questionText: 'Who is your younger brother with whom you shared childhood books?',
    relationTier: 'TIER_3_SIBLING',
    options: ['Pranab Baruah', 'Dhiren Phukan', 'Biren Goswami', 'Manab Saikia'],
    correctOptionIndex: 0,
    orderIndex: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    questionId: 'bio-q6',
    patientId: 1,
    questionText: 'Which historic school did you attend with your sibling?',
    relationTier: 'TIER_3_SIBLING',
    options: ['Cotton Collegiate School', 'Don Bosco High School', 'Tezpur Govt High School', 'St. Anthony’s'],
    correctOptionIndex: 2,
    orderIndex: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    questionId: 'bio-q7',
    patientId: 1,
    questionText: 'Where did the family go for the memorable summer trip in 1982?',
    relationTier: 'TIER_4_EXTENDED',
    options: ['Shillong Peak, Meghalaya', 'Darjeeling Tea Hills', 'Kaziranga Forest Lodge', 'Puri Sea Coast'],
    correctOptionIndex: 0,
    orderIndex: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    questionId: 'bio-q8',
    patientId: 1,
    questionText: 'What was the affectionate name of your favorite pet dog?',
    relationTier: 'TIER_4_EXTENDED',
    options: ['Sheru', 'Bruno', 'Tiger', 'Toffee'],
    correctOptionIndex: 1,
    orderIndex: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Seed default patient and initial data if empty for quick offline demonstration
export async function initDefaultData() {
  const patientId = 1;
  const count = await db.patients.count();
  
  // Clean up any old mock proxy patient records
  const oldProxy = await db.patients.filter(p => p.name === 'Bhaben Baruah').toArray();
  for (const p of oldProxy) {
    await db.patients.delete(p.id);
  }

  // Clear any historical seed/mock trials so the dashboard starts clean until first game
  try {
    if (db.biographical_trials) {
      await db.biographical_trials.filter(t => typeof t.trialId === 'string' && t.trialId.startsWith('seed-')).delete();
    }
    if (db.patterntrace_trials) {
      await db.patterntrace_trials.filter(t => typeof t.trial_id === 'string' && t.trial_id.startsWith('seed-')).delete();
    }
    if (db.shape_game_sessions) {
      // Remove mock, seed, or test sessions
      await db.shape_game_sessions.filter(s =>
        !s.sessionId ||
        typeof s.sessionId !== 'string' ||
        s.sessionId.startsWith('seed-') ||
        s.sessionId.startsWith('test-') ||
        s.sessionId.startsWith('e2e-')
      ).delete();

      // Deduplicate any repeated sessionId
      const allSessions = await db.shape_game_sessions.toArray();
      const seenSessionIds = new Set();
      for (const s of allSessions) {
        if (seenSessionIds.has(s.sessionId)) {
          await db.shape_game_sessions.delete(s.id);
        } else {
          seenSessionIds.add(s.sessionId);
        }
      }
    }
    if (db.shape_game_attempts) {
      await db.shape_game_attempts.filter(a =>
        !a.sessionId ||
        typeof a.sessionId !== 'string' ||
        a.sessionId.startsWith('seed-') ||
        a.sessionId.startsWith('test-') ||
        a.sessionId.startsWith('e2e-')
      ).delete();
    }
    if (db.shape_game_alerts) {
      await db.shape_game_alerts.clear();
    }
    if (db.telemetry) {
      await db.telemetry.clear();
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('smriti_biographical_trials_backup');
    }
  } catch (err) {
    console.warn('Initial seed cleanup error:', err);
  }

  // Seed Biographical Questions if empty (required for playing Family Recognition)
  const bioQCount = await db.biographical_questions?.count();
  if (bioQCount === 0 && db.biographical_questions) {
    await db.biographical_questions.bulkAdd(DEFAULT_BIOGRAPHICAL_QUESTIONS);
  }

  // Seed ASHA door-to-door triage visits
  const ashaCount = await db.asha_queue.count();
  if (ashaCount === 0) {
    const now = Date.now();
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
