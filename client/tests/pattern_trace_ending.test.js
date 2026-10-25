import test from 'node:test';
import assert from 'node:assert/strict';
import { PatternTraceTelemetryService } from '../src/services/patternTraceTelemetry.js';
import { TRANSLATIONS } from '../src/locales/translations.js';

test('PatternTrace Trial Evaluation: exact vs spatial matches and perseveration detection', () => {
  // 1. Exact match
  const exactTrial = PatternTraceTelemetryService.evaluateTrial({
    patientId: 1,
    level: 2,
    targetSequence: [0, 1, 2],
    userSequence: [0, 1, 2],
    previousTargetSequence: [4, 5, 8],
    initiationLatencyMs: 650,
    totalExecutionTimeMs: 1200
  });
  assert.strictEqual(exactTrial.sequence_match, true);
  assert.strictEqual(exactTrial.spatial_match, true);
  assert.strictEqual(exactTrial.accuracy_score, 1.0);
  assert.strictEqual(exactTrial.perseveration_detected, false);

  // 2. Spatial match (correct nodes, different order)
  const spatialTrial = PatternTraceTelemetryService.evaluateTrial({
    patientId: 1,
    level: 2,
    targetSequence: [0, 1, 2],
    userSequence: [2, 1, 0],
    previousTargetSequence: [4, 5, 8],
    initiationLatencyMs: 800,
    totalExecutionTimeMs: 1400
  });
  assert.strictEqual(spatialTrial.sequence_match, false);
  assert.strictEqual(spatialTrial.spatial_match, true);
  assert.strictEqual(spatialTrial.accuracy_score, 0.8);

  // 3. Perseveration detection (repeating previous pattern instead of current)
  const perseverationTrial = PatternTraceTelemetryService.evaluateTrial({
    patientId: 1,
    level: 2,
    targetSequence: [0, 3, 6],
    userSequence: [4, 5, 8], // User repeats previous target!
    previousTargetSequence: [4, 5, 8],
    initiationLatencyMs: 900,
    totalExecutionTimeMs: 1500
  });
  assert.strictEqual(perseverationTrial.sequence_match, false);
  assert.strictEqual(perseverationTrial.perseveration_detected, true);
});

test('PatternTrace Session Analysis: computes 5-trial summary, scores, and clinical interpretation', () => {
  const mockTrials = [
    {
      level: 1,
      sequence_match: true,
      spatial_match: true,
      accuracy_score: 1.0,
      initiation_latency_ms: 700,
      total_execution_time_ms: 1100,
      perseveration_detected: false,
      omission_count: 0,
      commission_count: 0
    },
    {
      level: 1,
      sequence_match: true,
      spatial_match: true,
      accuracy_score: 1.0,
      initiation_latency_ms: 680,
      total_execution_time_ms: 1050,
      perseveration_detected: false,
      omission_count: 0,
      commission_count: 0
    },
    {
      level: 2,
      sequence_match: true,
      spatial_match: true,
      accuracy_score: 1.0,
      initiation_latency_ms: 720,
      total_execution_time_ms: 1200,
      perseveration_detected: false,
      omission_count: 0,
      commission_count: 0
    },
    {
      level: 2,
      sequence_match: true,
      spatial_match: true,
      accuracy_score: 1.0,
      initiation_latency_ms: 750,
      total_execution_time_ms: 1250,
      perseveration_detected: false,
      omission_count: 0,
      commission_count: 0
    },
    {
      level: 3,
      sequence_match: true,
      spatial_match: true,
      accuracy_score: 1.0,
      initiation_latency_ms: 800,
      total_execution_time_ms: 1400,
      perseveration_detected: false,
      omission_count: 0,
      commission_count: 0
    }
  ];

  const analysis = PatternTraceTelemetryService.analyzeSessionProgress({
    patientId: 1,
    sessionTrials: mockTrials
  });

  assert.strictEqual(analysis.totalTrials, 5);
  assert.strictEqual(analysis.sequenceMatches, 5);
  assert.strictEqual(analysis.sequenceMatchPct, 100);
  assert.strictEqual(analysis.highestLevel, 3);
  assert.strictEqual(analysis.meanAccuracyPct, 100);
  assert.strictEqual(analysis.perseverationCount, 0);
  assert.ok(analysis.workingMemoryScore >= 80, `Expected score >= 80, got ${analysis.workingMemoryScore}`);
  assert.strictEqual(analysis.clinicalStatus, 'Stable Visuospatial Function');
  assert.strictEqual(analysis.clinicalBadgeColor, 'emerald');
});

test('PatternTrace Session Analysis: handles perseverative slip and triggers clinical warning', () => {
  const decliningTrials = [
    {
      level: 2,
      sequence_match: false,
      spatial_match: false,
      accuracy_score: 0.3,
      initiation_latency_ms: 1400,
      total_execution_time_ms: 2200,
      perseveration_detected: true,
      omission_count: 2,
      commission_count: 1
    },
    {
      level: 1,
      sequence_match: false,
      spatial_match: false,
      accuracy_score: 0.4,
      initiation_latency_ms: 1500,
      total_execution_time_ms: 2100,
      perseveration_detected: true,
      omission_count: 1,
      commission_count: 1
    }
  ];

  const analysis = PatternTraceTelemetryService.analyzeSessionProgress({
    patientId: 1,
    sessionTrials: decliningTrials
  });

  assert.strictEqual(analysis.perseverationCount, 2);
  assert.strictEqual(analysis.clinicalStatus, 'Moderate Decline / MCI Warning');
  assert.strictEqual(analysis.clinicalBadgeColor, 'rose');
  assert.match(analysis.clinicalNotes, /perseverative repetitions/i);
});

test('PatternTrace Session Sync: dispatches smritisetu:game_completed event for Caretaker Dashboard', async () => {
  let eventDispatched = false;
  let receivedDetail = null;

  const mockWindow = {
    dispatchEvent: (evt) => {
      if (evt.type === 'smritisetu:game_completed') {
        eventDispatched = true;
        receivedDetail = evt.detail;
      }
    }
  };

  const originalWindow = globalThis.window;
  const originalCustomEvent = globalThis.CustomEvent;

  globalThis.window = mockWindow;
  globalThis.CustomEvent = class {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  };

  try {
    const trials = [
      {
        level: 1,
        sequence_match: true,
        spatial_match: true,
        accuracy_score: 1.0,
        initiation_latency_ms: 700,
        total_execution_time_ms: 1100,
        perseveration_detected: false,
        omission_count: 0,
        commission_count: 0
      }
    ];

    const result = await PatternTraceTelemetryService.syncSessionProgress({
      patientId: 1,
      sessionTrials: trials
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(eventDispatched, true);
    assert.strictEqual(receivedDetail?.game, 'pattern');
    assert.ok(receivedDetail?.sessionSummary);
    assert.strictEqual(receivedDetail.sessionSummary.totalTrials, 1);
  } finally {
    globalThis.window = originalWindow;
    globalThis.CustomEvent = originalCustomEvent;
  }
});

test('Translations: PatternTrace ending keys exist across all 4 regional dialects', () => {
  const dialects = ['en', 'or', 'gu', 'as'];
  const requiredKeys = [
    'patternCompletedTitle',
    'patternCompletedSubtitle',
    'playAgain',
    'takeRest',
    'viewReport',
    'syncedToCaretaker'
  ];

  for (const dialect of dialects) {
    for (const key of requiredKeys) {
      assert.ok(
        TRANSLATIONS[dialect]?.games?.[key],
        `Missing translations key '${key}' in dialect '${dialect}'`
      );
    }
  }
});

test('PatternTrace Trial Retrieval: handles string/number patient IDs, LocalStorage fallback, and analytics computation', async () => {
  // Mock localStorage
  const originalLocalStorage = globalThis.localStorage;
  const store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; }
  };

  try {
    const backupTrials = [
      {
        trial_id: 'pt_test_1',
        patient_id: 1, // numeric ID
        level: 1,
        accuracy_score: 1.0,
        sequence_match: true,
        spatial_match: true,
        initiation_latency_ms: 650,
        total_execution_time_ms: 1100,
        perseveration_detected: false,
        omission_count: 0,
        commission_count: 0,
        timestamp: new Date().toISOString()
      },
      {
        trial_id: 'pt_test_2',
        patient_id: 1,
        level: 2,
        accuracy_score: 1.0,
        sequence_match: true,
        spatial_match: true,
        initiation_latency_ms: 700,
        total_execution_time_ms: 1200,
        perseveration_detected: false,
        omission_count: 0,
        commission_count: 0,
        timestamp: new Date().toISOString()
      },
      {
        trial_id: 'pt_test_3',
        patient_id: 1,
        level: 3,
        accuracy_score: 1.0,
        sequence_match: true,
        spatial_match: true,
        initiation_latency_ms: 600,
        total_execution_time_ms: 1100,
        perseveration_detected: false,
        omission_count: 0,
        commission_count: 0,
        timestamp: new Date().toISOString()
      }
    ];

    globalThis.localStorage.setItem('smriti_patterntrace_trials_backup', JSON.stringify(backupTrials));

    // 1. Query with number 1
    const trialsNum = await PatternTraceTelemetryService.getTrials(1);
    assert.ok(trialsNum.length >= 3, `Expected >= 3 trials, got ${trialsNum.length}`);

    // 2. Query with string "1" (resilient type matching)
    const trialsStr = await PatternTraceTelemetryService.getTrials("1");
    assert.ok(trialsStr.length >= 3, `Expected >= 3 trials with string ID, got ${trialsStr.length}`);

    // 3. Query with UUID (single-patient device fallback)
    const trialsUuid = await PatternTraceTelemetryService.getTrials("3fa85f64-5717-4562-b3fc-2c963f66afa6");
    assert.ok(trialsUuid.length >= 3, `Expected >= 3 trials with UUID fallback, got ${trialsUuid.length}`);

    // 4. Longitudinal analytics computation
    const analytics = await PatternTraceTelemetryService.getLongitudinalAnalytics("3fa85f64-5717-4562-b3fc-2c963f66afa6");
    assert.strictEqual(analytics.totalTrials >= 3, true);
    assert.strictEqual(analytics.sequenceMatchPct, 100);
    assert.ok(analytics.compositeScore >= 75);
    assert.strictEqual(analytics.clinicalStatus, 'Stable');
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});
