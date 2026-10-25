import { test } from 'node:test';
import assert from 'node:assert';
import {
  EXERCISE_TYPES,
  generateClinicalReportHtml
} from '../src/services/clinicalPdfReportGenerator.js';

test('Clinical Report Generator: creates Biographical Recall individual report with micro-progress', () => {
  const patient = {
    name: 'Rabindra N. Ghosh',
    age: '74',
    abha_id: '91-4523-8821-0021',
    locality: 'Bhubaneswar, Odisha',
    caregiverName: 'Siddharth Ghosh'
  };

  const analytics = {
    biographicalAnalytics: {
      summary: { overallAccuracy: 0.94, totalTrials: 12 }
    }
  };

  const html = generateClinicalReportHtml({
    type: EXERCISE_TYPES.BIOGRAPHICAL,
    patient,
    analytics
  });

  assert.ok(html.includes('Biographical Face-Name & Kinship Recall Diagnostic Report'));
  assert.ok(html.includes('Rabindra N. Ghosh'));
  assert.ok(html.includes('91-4523-8821-0021'));
  assert.ok(html.includes('94%')); // Recall accuracy
  assert.ok(html.includes('Recognition Latency'));
  assert.ok(html.includes('-310 ms vs Baseline'));
  assert.ok(html.includes('Hesitation Pauses'));
  assert.ok(html.includes('Anima Ghosh'));
  assert.ok(html.includes('DPDP Act 2023 Consent'));
});

test('Clinical Report Generator: creates PatternTrace individual report with working memory span', () => {
  const patient = { name: 'Rabindra N. Ghosh', age: '74', abha_id: '91-4523-8821-0021' };
  const analytics = {
    patternAnalytics: {
      meanAccuracyPct: 88,
      currentLevel: 3,
      perseverationCount: 0
    }
  };

  const html = generateClinicalReportHtml({
    type: EXERCISE_TYPES.PATTERN,
    patient,
    analytics
  });

  assert.ok(html.includes('PatternTrace™ Visuomotor Working Memory Diagnostic Report'));
  assert.ok(html.includes('Span Level 3') || html.includes('Level 3'));
  assert.ok(html.includes('88%'));
  assert.ok(html.includes('Trajectory Fluidity'));
  assert.ok(html.includes('0 Slips (Optimal)'));
  assert.ok(html.includes('Frontoparietal'));
});

test('Clinical Report Generator: creates Shape Match individual report with kinematic tremor', () => {
  const patient = { name: 'Rabindra N. Ghosh', age: '74', abha_id: '91-4523-8821-0021' };
  const analytics = {
    shapeAnalytics: {
      metrics: {
        medianJitterPx: 1.2,
        averageIndependenceScore: 94
      }
    }
  };

  const html = generateClinicalReportHtml({
    type: EXERCISE_TYPES.SHAPE,
    patient,
    analytics
  });

  assert.ok(html.includes('Shape Match & Kinematic Coordination Diagnostic Report'));
  assert.ok(html.includes('1.2 px'));
  assert.ok(html.includes('94%'));
  assert.ok(html.includes('Euclidean Efficiency'));
  assert.ok(html.includes('Circle'));
  assert.ok(html.includes('Triangle'));
});

test('Clinical Report Generator: creates Daily Routine Sequencer individual report with ADL steps', () => {
  const patient = { name: 'Rabindra N. Ghosh', age: '74', abha_id: '91-4523-8821-0021' };
  const analytics = {
    routineAnalytics: {
      overallAccuracyPct: 92,
      averageLatencyMs: 780,
      totalSessions: 5
    }
  };

  const html = generateClinicalReportHtml({
    type: EXERCISE_TYPES.ROUTINE,
    patient,
    analytics
  });

  assert.ok(html.includes('Daily Routine Sequencer ADL Diagnostic Report'));
  assert.ok(html.includes('92%'));
  assert.ok(html.includes('Inversion Errors'));
  assert.ok(html.includes('0 Order Reversals'));
  assert.ok(html.includes('Morning Hygiene Routine'));
  assert.ok(html.includes('Medication Schedule'));
});

test('Clinical Report Generator: creates Consolidated Clinical Dossier combining all 4 exercises', () => {
  const patient = {
    name: 'Rabindra N. Ghosh',
    age: '74',
    abha_id: '91-4523-8821-0021',
    locality: 'Bhubaneswar, Odisha',
    caregiverName: 'Siddharth Ghosh'
  };

  const analytics = {
    biographicalAnalytics: { summary: { overallAccuracy: 0.92 } },
    patternAnalytics: { meanAccuracyPct: 86, currentLevel: 3, perseverationCount: 0 },
    shapeAnalytics: { metrics: { medianJitterPx: 1.2, averageIndependenceScore: 94 } },
    routineAnalytics: { overallAccuracyPct: 92, averageLatencyMs: 780, totalSessions: 4 }
  };

  const html = generateClinicalReportHtml({
    type: EXERCISE_TYPES.CONSOLIDATED,
    patient,
    analytics
  });

  // Check Executive Summary
  assert.ok(html.includes('Executive Clinical Biomarker Overview'));
  assert.ok(html.includes('Overall Cognitive Stability'));

  // Check that all 4 exercises are present
  assert.ok(html.includes('1. Biographical Recognition'));
  assert.ok(html.includes('2. PatternTrace™ Visuomotor Working Memory'));
  assert.ok(html.includes('3. Shape Match & Fine Motor Kinematics'));
  assert.ok(html.includes('4. Daily Routine Sequencer'));

  // Check that 7-Day Matrix is present
  assert.ok(html.includes('7-Day Multi-Exercise Micro-Progress Telemetry Matrix'));
  assert.ok(html.includes('Day 1 (Mon)'));
  assert.ok(html.includes('Today (Sun)'));

  // Check Doctor's signature & DPDP
  assert.ok(html.includes('Dr. S. K. Mahapatra'));
  assert.ok(html.includes('DPDP Act 2023 Section 6(1)'));
});
