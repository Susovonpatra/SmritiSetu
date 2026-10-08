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

  // Seed baseline telemetry for the past 14 days so caregiver charts & drift work immediately
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
        user_sequence: [0, 1, 4, 3], // perseveration of previous pattern
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
    await db.patterntrace_trials.bulkAdd(patternTraceSeed);
  }

  // Seed Biographical Questions if empty
  const bioQCount = await db.biographical_questions?.count();
  if (bioQCount === 0 && db.biographical_questions) {
    await db.biographical_questions.bulkAdd(DEFAULT_BIOGRAPHICAL_QUESTIONS);
  }

  // Seed Longitudinal Biographical Trials if empty (past 30 days)
  const bioTrialsCount = await db.biographical_trials?.count();
  if (bioTrialsCount === 0 && db.biographical_trials) {
    const now = Date.now();
    const seedTrials = [];
    const questions = DEFAULT_BIOGRAPHICAL_QUESTIONS;

    // Simulate 12 historical sessions across 30 days
    const dayIntervals = [28, 25, 22, 19, 16, 13, 10, 7, 5, 3, 2, 1];

    dayIntervals.forEach((dayOffset, sIdx) => {
      const sessionDate = new Date(now - dayOffset * 24 * 60 * 60 * 1000 + 10 * 3600 * 1000); // around 10am
      const sessionId = `seed-session-${30 - dayOffset}`;
      
      // Each session has 8 questions (simulating sequence 0 to 7)
      questions.forEach((q, qIndexInSession) => {
        const trialTime = new Date(sessionDate.getTime() + qIndexInSession * 25000).toISOString();
        
        // Tier properties:
        // Tier 1: 94% accuracy, ~1200ms
        // Tier 2: 83% accuracy, ~1600ms
        // Tier 3: 72% accuracy, ~2200ms
        // Tier 4: 55% accuracy, ~2900ms
        // Fatigue effect: Questions 7+ have higher latency (+800ms) and lower accuracy (-25%)
        let baseAccProbability = 0.94;
        let baseLatency = 1200;

        if (q.relationTier === 'TIER_2_CHILD') {
          baseAccProbability = 0.83;
          baseLatency = 1600;
        } else if (q.relationTier === 'TIER_3_SIBLING') {
          baseAccProbability = 0.72;
          baseLatency = 2200;
        } else if (q.relationTier === 'TIER_4_EXTENDED') {
          baseAccProbability = 0.55;
          baseLatency = 2800;
        }

        // Apply progressive cognitive fatigue for questions 7+ (index >= 6)
        if (qIndexInSession >= 6) {
          baseAccProbability -= 0.22;
          baseLatency += 750;
        }

        const isCorrect = Math.random() < baseAccProbability;
        let selectedOptionIndex = q.correctOptionIndex;
        let selectedText = q.options[q.correctOptionIndex];

        if (!isCorrect) {
          // Deterministic confusion patterns for clinical realism
          if (q.questionId === 'bio-q3') {
            // Mistaking Daughter for another family member 'Pooja Baruah'
            selectedOptionIndex = 1;
            selectedText = q.options[1];
          } else if (q.questionId === 'bio-q4') {
            // Mistaking Son's job
            selectedOptionIndex = 0;
            selectedText = q.options[0];
          } else {
            // Pick an alternate index
            const wrongIndices = [0, 1, 2, 3].filter(idx => idx !== q.correctOptionIndex);
            selectedOptionIndex = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
            selectedText = q.options[selectedOptionIndex];
          }
        }

        const latencyMs = Math.round(baseLatency + (Math.random() * 400 - 200));
        const hesitationCount = isCorrect ? Math.floor(Math.random() * 2) : Math.floor(2 + Math.random() * 4);
        const selectedPosition = selectedOptionIndex; // screen slot 0-3

        seedTrials.push({
          trialId: `seed-trial-${sIdx}-${qIndexInSession}`,
          sessionId: sessionId,
          patientId: patientId,
          timestamp: trialTime,
          questionId: q.questionId,
          relationTier: q.relationTier,
          selectedOptionIndex: selectedOptionIndex,
          correctOptionIndex: q.correctOptionIndex,
          isCorrect: isCorrect,
          selectedText: selectedText,
          correctText: q.options[q.correctOptionIndex],
          latencyMs: latencyMs,
          hesitationCount: hesitationCount,
          selectedPosition: selectedPosition
        });
      });
    });

    await db.biographical_trials.bulkAdd(seedTrials);
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
