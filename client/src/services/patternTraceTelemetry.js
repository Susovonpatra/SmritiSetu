/**
 * PatternTraceTelemetryService.js
 * Neurocognitive Telemetry & Assessment Engine for Dementia / MCI PatternTrace Game
 * 
 * Computes:
 * - Accuracy Score (Normalized 0.0 - 1.0)
 * - Sequence Match vs Spatial Match
 * - Initiation Latency (Demonstration End -> First Touch)
 * - Motor Execution Time
 * - Perseveration Biomarker Detection (repetition of previous trial's pattern)
 * - Omission (missed nodes) & Commission (false positive nodes) Errors
 * - Adaptive Staircase Difficulty Progression
 * - Longitudinal Rolling Analytics & Clinical Working Memory Index
 */

import { db } from '../db/db.js';
import { telemetryApi } from './api/telemetryApi.js';

export class PatternTraceTelemetryService {
  /**
   * Evaluates patient response against target and previous trial patterns
   */
  static evaluateTrial({
    trialId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `trial-${Date.now()}`,
    patientId = 1,
    level = 1,
    targetSequence = [],
    userSequence = [],
    previousTargetSequence = null,
    initiationLatencyMs = 0,
    totalExecutionTimeMs = 0,
    timestamp = new Date().toISOString()
  }) {
    const targetSet = new Set(targetSequence);
    const userSet = new Set(userSequence);

    // 1. Exact Sequence Match (exact order & nodes)
    const sequenceMatch =
      targetSequence.length === userSequence.length &&
      targetSequence.every((val, idx) => val === userSequence[idx]);

    // 2. Spatial Match (visited correct set of nodes regardless of order)
    const spatialMatch =
      targetSet.size === userSet.size &&
      [...targetSet].every(node => userSet.has(node));

    // 3. Omission Count (target nodes not touched)
    const omissionCount = targetSequence.filter(node => !userSet.has(node)).length;

    // 4. Commission Count (incorrect nodes touched that were not in target)
    const commissionCount = userSequence.filter(node => !targetSet.has(node)).length;

    // 5. Normalized Accuracy Score (0.0 to 1.0)
    let accuracyScore = 0.0;
    if (sequenceMatch) {
      accuracyScore = 1.0;
    } else if (spatialMatch) {
      accuracyScore = 0.8; // Correct nodes, slight ordering transposition
    } else {
      const correctNodesVisited = targetSequence.filter(node => userSet.has(node)).length;
      const penalty = commissionCount * 0.25;
      const rawScore = (correctNodesVisited - penalty) / Math.max(1, targetSequence.length);
      accuracyScore = Math.max(0.0, Math.min(1.0, Math.round(rawScore * 100) / 100));
    }

    // 6. Perseveration Detection:
    // Did user replicate the pattern (or >=75% of it) from the PREVIOUS trial instead of the current one?
    // Perseveration is a classic neurocognitive marker of frontal lobe / Alzheimer's executive dysfunction.
    let perseverationDetected = false;
    if (previousTargetSequence && previousTargetSequence.length > 0 && !sequenceMatch) {
      const prevTargetSet = new Set(previousTargetSequence);
      const matchesPrevExact =
        previousTargetSequence.length === userSequence.length &&
        previousTargetSequence.every((val, idx) => val === userSequence[idx]);

      const overlapWithPrev = userSequence.filter(node => prevTargetSet.has(node)).length;
      const prevOverlapRatio = overlapWithPrev / Math.max(1, previousTargetSequence.length);

      if (matchesPrevExact || (prevOverlapRatio >= 0.75 && userSequence.length >= 3)) {
        perseverationDetected = true;
      }
    }

    const payload = {
      trial_id: trialId,
      patient_id: patientId,
      level,
      target_sequence: [...targetSequence],
      user_sequence: [...userSequence],
      accuracy_score: accuracyScore,
      sequence_match: sequenceMatch,
      spatial_match: spatialMatch,
      initiation_latency_ms: Math.max(50, Math.round(initiationLatencyMs)),
      total_execution_time_ms: Math.max(100, Math.round(totalExecutionTimeMs)),
      perseveration_detected: perseverationDetected,
      omission_count: omissionCount,
      commission_count: commissionCount,
      timestamp,
      game_type: 'patterntrace_visuospatial',
      source: 'PWA'
    };

    return payload;
  }

  /**
   * Resiliently fetches trials for a patient, handling number/string type conversions,
   * single-patient PWA fallback, and LocalStorage backup failover.
   */
  static async getTrials(patientId = 1) {
    let trials = [];
    try {
      if (db.patterntrace_trials) {
        // 1. Try querying with the patientId as provided
        if (patientId !== undefined && patientId !== null) {
          try {
            const byId = await db.patterntrace_trials.where('patient_id').equals(patientId).toArray();
            if (byId && byId.length > 0) {
              trials = byId;
            }
          } catch (e) {}

          // 2. Try numeric / string conversions
          if (trials.length === 0 && !isNaN(Number(patientId))) {
            try {
              const byNum = await db.patterntrace_trials.where('patient_id').equals(Number(patientId)).toArray();
              if (byNum && byNum.length > 0) trials = byNum;
            } catch (e) {}
          }
          if (trials.length === 0) {
            try {
              const byStr = await db.patterntrace_trials.where('patient_id').equals(String(patientId)).toArray();
              if (byStr && byStr.length > 0) trials = byStr;
            } catch (e) {}
          }
        }

        // 3. Lenient fallback: If no strict match, fetch all and filter leniently (or return all for single-patient PWA)
        if (trials.length === 0) {
          const all = await db.patterntrace_trials.toArray();
          if (all && all.length > 0) {
            const filtered = all.filter(t => 
              t.patient_id == patientId || 
              String(t.patient_id) === String(patientId) ||
              t.patientId == patientId
            );
            trials = filtered.length > 0 ? filtered : all;
          }
        }
      }
    } catch (err) {
      console.warn('Dexie patterntrace_trials query error:', err);
    }

    // 4. LocalStorage fallback backup (ensures reliability across incognito, restarts, or IndexedDB latency)
    if (!trials || trials.length === 0) {
      try {
        const raw = localStorage.getItem('smriti_patterntrace_trials_backup');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const filtered = parsed.filter(t => 
              t.patient_id == patientId || 
              String(t.patient_id) === String(patientId) ||
              t.patientId == patientId
            );
            trials = filtered.length > 0 ? filtered : parsed;
          }
        }
      } catch (e) {}
    }

    return trials.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Persists trial to Dexie database and general telemetry table for synchronization
   */
  static async recordTrial(trialPayload) {
    try {
      // 1. Store in dedicated patterntrace_trials table
      if (db.patterntrace_trials) {
        await db.patterntrace_trials.add(trialPayload);
      }

      // 2. Also record to generic telemetry table for backend FastAPI/Supabase sync
      if (db.telemetry) {
        await db.telemetry.add({
          patient_id: Number(trialPayload.patient_id) || 1,
          game_type: 'patterntrace_visuospatial',
          timestamp: trialPayload.timestamp,
          latency_ms: trialPayload.initiation_latency_ms,
          jitter_px: Math.min(30, Math.round(8 + (trialPayload.total_execution_time_ms / 300))),
          accuracy_score: trialPayload.accuracy_score,
          source: 'PWA'
        });
      }

      // 3. Dual-save to LocalStorage backup
      try {
        const raw = localStorage.getItem('smriti_patterntrace_trials_backup');
        let existing = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(existing)) existing = [];
        existing.unshift(trialPayload);
        if (existing.length > 100) existing.length = 100;
        localStorage.setItem('smriti_patterntrace_trials_backup', JSON.stringify(existing));
      } catch (e) {}

      // 4. Multi-channel broadcast so Caretaker dashboard updates instantly
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('smritisetu:game_completed', {
          detail: { game: 'pattern', trial: trialPayload }
        }));
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const ch = new BroadcastChannel('smritisetu_sync');
            ch.postMessage({ type: 'TRIAL_RECORDED', game: 'pattern' });
            ch.close();
          }
        } catch (e) {}
      }

      return trialPayload;
    } catch (err) {
      console.error('Failed to record PatternTrace telemetry trial:', err);
      // Fallback save to localStorage even if Dexie threw an error
      try {
        const raw = localStorage.getItem('smriti_patterntrace_trials_backup');
        let existing = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(existing)) existing = [];
        existing.unshift(trialPayload);
        localStorage.setItem('smriti_patterntrace_trials_backup', JSON.stringify(existing));
      } catch (e) {}
      return trialPayload;
    }
  }

  /**
   * Computes comprehensive longitudinal analytics and clinical summaries
   */
  static async getLongitudinalAnalytics(patientId = 1) {
    try {
      const trials = await this.getTrials(patientId);

      if (!trials || trials.length === 0) {
        return this.getFallbackAnalytics();
      }

      const totalTrials = trials.length;
      const sequenceMatches = trials.filter(t => t.sequence_match).length;
      const spatialMatches = trials.filter(t => t.spatial_match).length;
      const perseverationCount = trials.filter(t => t.perseveration_detected).length;

      const totalLatency = trials.reduce((acc, t) => acc + (t.initiation_latency_ms || 0), 0);
      const meanLatency = Math.round(totalLatency / totalTrials);

      const totalExecTime = trials.reduce((acc, t) => acc + (t.total_execution_time_ms || 0), 0);
      const meanExecTime = Math.round(totalExecTime / totalTrials);

      const totalAccuracy = trials.reduce((acc, t) => acc + (t.accuracy_score || 0), 0);
      const meanAccuracyPct = Math.round((totalAccuracy / totalTrials) * 100);

      const totalOmissions = trials.reduce((acc, t) => acc + (t.omission_count || 0), 0);
      const totalCommissions = trials.reduce((acc, t) => acc + (t.commission_count || 0), 0);

      // Trajectory (Level over trials)
      const trajectory = trials.slice(-15).map((t, idx) => ({
        trial: idx + 1,
        trial_id: t.trial_id,
        level: t.level,
        accuracy: Math.round(t.accuracy_score * 100),
        latency: t.initiation_latency_ms,
        perseveration: t.perseveration_detected,
        time: t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
      }));

      // Current max level reached
      const currentLevel = trials[trials.length - 1]?.level || 1;
      const maxLevelAchieved = Math.max(...trials.map(t => t.level || 1));

      // Working Memory Composite Index (0 - 100)
      // Combines sequence accuracy (40%), level capacity (30%), latency efficiency (20%), perseveration penalty (10%)
      const accuracyComponent = meanAccuracyPct * 0.4;
      const levelComponent = (maxLevelAchieved / 5.0) * 100 * 0.3;
      const latencyComponent = Math.max(0, 100 - ((meanLatency - 600) / 15)) * 0.2;
      const perseverationPenalty = Math.min(20, (perseverationCount / totalTrials) * 100 * 0.5);

      const compositeScore = Math.min(100, Math.max(10, Math.round(
        accuracyComponent + levelComponent + latencyComponent - perseverationPenalty
      )));

      // Clinical Interpretation
      let clinicalStatus = 'Stable';
      let clinicalBadgeColor = 'emerald';
      let clinicalNotes = 'Visuospatial working memory span is robust and shows normal recall trajectories.';

      if (perseverationCount >= 2 || meanAccuracyPct < 65 || compositeScore < 55) {
        clinicalStatus = 'Moderate Decline / MCI Warning';
        clinicalBadgeColor = 'rose';
        clinicalNotes = 'Elevated pattern omission rate and detected perseveration. Indicates mild frontal/parietal working memory latency drift. Recommend clinical teleconsultation.';
      } else if (meanAccuracyPct < 80 || compositeScore < 75) {
        clinicalStatus = 'Mild Visuospatial Variation';
        clinicalBadgeColor = 'amber';
        clinicalNotes = 'Patient exhibits slight spatial recall latency under Level 3+ complex patterns. Motor execution intact.';
      }

      return {
        totalTrials,
        currentLevel,
        maxLevelAchieved,
        compositeScore,
        meanAccuracyPct,
        sequenceMatchPct: Math.round((sequenceMatches / totalTrials) * 100),
        spatialMatchPct: Math.round((spatialMatches / totalTrials) * 100),
        meanLatency,
        meanExecTime,
        perseverationCount,
        perseverationRatePct: Math.round((perseverationCount / totalTrials) * 100),
        totalOmissions,
        totalCommissions,
        clinicalStatus,
        clinicalBadgeColor,
        clinicalNotes,
        trajectory,
        trials: trials.slice(-20).reverse()
      };
    } catch (err) {
      console.error('Error fetching longitudinal analytics:', err);
      return this.getFallbackAnalytics();
    }
  }

  static getFallbackAnalytics() {
    return {
      totalTrials: 0,
      currentLevel: 1,
      maxLevelAchieved: 1,
      compositeScore: 0,
      meanAccuracyPct: 0,
      sequenceMatchPct: 0,
      spatialMatchPct: 0,
      meanLatency: 0,
      meanExecTime: 0,
      perseverationCount: 0,
      perseverationRatePct: 0,
      totalOmissions: 0,
      totalCommissions: 0,
      clinicalStatus: 'Awaiting Session',
      clinicalBadgeColor: 'slate',
      clinicalNotes: 'No PatternTrace sessions recorded yet. Telemetry will record as soon as the first game is played.',
      trajectory: [],
      trials: []
    };
  }

  /**
   * Analyzes an individual game session's progress across its completed trials.
   * Computes neurocognitive metrics, working memory capacity, and clinical status.
   */
  static analyzeSessionProgress({
    patientId = 1,
    sessionTrials = []
  }) {
    if (!sessionTrials || sessionTrials.length === 0) {
      return {
        totalTrials: 0,
        sequenceMatches: 0,
        sequenceMatchPct: 0,
        spatialMatches: 0,
        spatialMatchPct: 0,
        meanAccuracyPct: 0,
        meanLatencyMs: 0,
        meanExecutionTimeMs: 0,
        startingLevel: 1,
        highestLevel: 1,
        finalLevel: 1,
        perseverationCount: 0,
        omissionCount: 0,
        commissionCount: 0,
        workingMemoryScore: 0,
        clinicalStatus: 'No Trials Played',
        clinicalBadgeColor: 'slate',
        clinicalNotes: 'No trials were completed during this session.',
        recommendation: 'Play a full 5-trial session to map working memory span.',
        timestamp: new Date().toISOString()
      };
    }

    const totalTrials = sessionTrials.length;
    const sequenceMatches = sessionTrials.filter(t => t.sequence_match).length;
    const spatialMatches = sessionTrials.filter(t => t.spatial_match).length;
    const perseverationCount = sessionTrials.filter(t => t.perseveration_detected).length;

    const totalLatency = sessionTrials.reduce((acc, t) => acc + (t.initiation_latency_ms || 0), 0);
    const meanLatencyMs = Math.round(totalLatency / totalTrials);

    const totalExecTime = sessionTrials.reduce((acc, t) => acc + (t.total_execution_time_ms || 0), 0);
    const meanExecutionTimeMs = Math.round(totalExecTime / totalTrials);

    const totalAccuracy = sessionTrials.reduce((acc, t) => acc + (t.accuracy_score || 0), 0);
    const meanAccuracyPct = Math.round((totalAccuracy / totalTrials) * 100);

    const omissionCount = sessionTrials.reduce((acc, t) => acc + (t.omission_count || 0), 0);
    const commissionCount = sessionTrials.reduce((acc, t) => acc + (t.commission_count || 0), 0);

    const startingLevel = sessionTrials[0]?.level || 1;
    const finalLevel = sessionTrials[sessionTrials.length - 1]?.level || 1;
    const highestLevel = Math.max(...sessionTrials.map(t => t.level || 1));

    // Working Memory Composite Score for this session (0 - 100)
    // 40% Accuracy + 30% Level Capacity achieved + 20% Latency (<1200ms) - 10% Perseveration penalty
    const accuracyComponent = meanAccuracyPct * 0.4;
    const maxAttainableForSession = Math.min(5, Math.max(3, startingLevel + Math.floor((totalTrials - 1) / 2)));
    const levelRatio = Math.min(1.0, highestLevel / maxAttainableForSession);
    const levelComponent = levelRatio * 100 * 0.3;
    const latencyComponent = Math.max(0, 100 - ((meanLatencyMs - 500) / 15)) * 0.2;
    const perseverationPenalty = Math.min(20, (perseverationCount / totalTrials) * 100 * 0.5);

    const workingMemoryScore = Math.min(100, Math.max(10, Math.round(
      accuracyComponent + levelComponent + latencyComponent - perseverationPenalty
    )));

    // Clinical Interpretation & Recommendations
    let clinicalStatus = 'Stable Visuospatial Function';
    let clinicalBadgeColor = 'emerald';
    let clinicalNotes = 'Visuospatial working memory span is robust. The patient demonstrated prompt motor initiation and accurate sequence reconstruction.';
    let recommendation = 'Maintain consistent daily 5-trial practice sessions to reinforce cognitive retention and spatial agility.';

    if (perseverationCount >= 2 || meanAccuracyPct < 65 || workingMemoryScore < 55) {
      clinicalStatus = 'Moderate Decline / MCI Warning';
      clinicalBadgeColor = 'rose';
      clinicalNotes = 'Elevated pattern omission rate and detected perseverative repetitions from prior trials. Suggestive of frontal-parietal working memory latency drift.';
      recommendation = 'Recommend reviewing progress with family or attending doctor via eSanjeevani teleconsultation. Keep practice gentle and unhurried.';
    } else if (meanAccuracyPct < 80 || workingMemoryScore < 75) {
      clinicalStatus = 'Mild Visuospatial Variation';
      clinicalBadgeColor = 'amber';
      clinicalNotes = 'Patient exhibits slight spatial recall latency under Level 3+ multi-node patterns. Core motor execution and single-node taps remain intact.';
      recommendation = 'Gentle encouragement on 3-to-4 node sequences. Encourage pausing and taking breaths between trials.';
    }

    return {
      patientId,
      totalTrials,
      sequenceMatches,
      sequenceMatchPct: Math.round((sequenceMatches / totalTrials) * 100),
      spatialMatches,
      spatialMatchPct: Math.round((spatialMatches / totalTrials) * 100),
      meanAccuracyPct,
      meanLatencyMs,
      meanExecutionTimeMs,
      startingLevel,
      highestLevel,
      finalLevel,
      perseverationCount,
      omissionCount,
      commissionCount,
      workingMemoryScore,
      clinicalStatus,
      clinicalBadgeColor,
      clinicalNotes,
      recommendation,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Syncs completed session progress to Dexie, dispatches UI events to the Caretaker Dashboard,
   * and pushes queued telemetry to the FastAPI backend.
   */
  static async syncSessionProgress({
    patientId = 1,
    sessionTrials = [],
    sessionSummary = null
  }) {
    const summary = sessionSummary || this.analyzeSessionProgress({ patientId, sessionTrials });

    try {
      // 1. Dispatch reactive event and broadcast across all tabs so Caretaker Dashboard immediately refreshes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('smritisetu:game_completed', {
          detail: {
            game: 'pattern',
            sessionSummary: summary,
            patientId
          }
        }));

        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const ch = new BroadcastChannel('smritisetu_sync');
            ch.postMessage({ type: 'GAME_COMPLETED', game: 'pattern', sessionSummary: summary });
            ch.close();
          }
        } catch (e) {}

        try {
          localStorage.setItem('smriti_patterntrace_last_session', JSON.stringify({
            summary,
            patientId,
            timestamp: new Date().toISOString()
          }));
        } catch (e) {}
      }

      // 2. Attempt push to backend FastAPI /api/v1/telemetry/sync if online
      let backendSynced = false;
      const normalizedNumericPatientId = Number(patientId) || 1;
      if (typeof navigator === 'undefined' || navigator.onLine) {
        try {
          let recordsToSync = [];
          if (db.telemetry) {
            const unsyncedTelemetry = await db.telemetry
              .where('game_type')
              .equals('patterntrace_visuospatial')
              .toArray();

            if (unsyncedTelemetry && unsyncedTelemetry.length > 0) {
              recordsToSync = unsyncedTelemetry.slice(-10).map(t => ({
                patient_id: Number(t.patient_id) || normalizedNumericPatientId,
                game_type: t.game_type,
                latency_ms: t.latency_ms,
                jitter_px: t.jitter_px || 0.0,
                accuracy_score: t.accuracy_score || 1.0,
                source: t.source || 'PWA',
                timestamp: t.timestamp
              }));
            }
          }

          if (recordsToSync.length === 0 && sessionTrials.length > 0) {
            recordsToSync = sessionTrials.map(t => ({
              patient_id: Number(t.patient_id) || normalizedNumericPatientId,
              game_type: 'patterntrace_visuospatial',
              latency_ms: t.initiation_latency_ms || 800,
              jitter_px: Math.min(30, Math.round(8 + (t.total_execution_time_ms / 300))),
              accuracy_score: t.accuracy_score || 1.0,
              source: 'PWA',
              timestamp: t.timestamp
            }));
          }

          if (recordsToSync.length > 0) {
            await telemetryApi.syncBatch(recordsToSync);
            backendSynced = true;
          }
        } catch (apiErr) {
          console.warn('Direct backend sync deferred to offline queue:', apiErr);
        }
      }

      return {
        success: true,
        sessionSummary: summary,
        backendSynced
      };
    } catch (err) {
      console.error('Failed to sync session progress:', err);
      return {
        success: false,
        sessionSummary: summary,
        backendSynced: false,
        error: err.message
      };
    }
  }

  /**
   * Generates next pattern according to the current level
   */
  static generatePatternForLevel(level = 1, lastTarget = null) {
    // 3x3 Matrix Node Indices:
    // 0  1  2
    // 3  4  5
    // 6  7  8
    const levelPatterns = {
      1: [
        [0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8],
        [0, 3], [1, 4], [2, 5], [3, 6], [4, 7], [5, 8],
        [0, 4], [4, 8], [2, 4], [4, 6]
      ],
      2: [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 1, 4], [1, 2, 5], [3, 4, 7], [4, 5, 8],
        [0, 4, 8], [2, 4, 6], [6, 4, 2], [8, 4, 0]
      ],
      3: [
        [0, 1, 4, 3], [1, 2, 5, 4], [3, 4, 7, 6], [4, 5, 8, 7],
        [0, 3, 4, 1], [1, 4, 5, 2], [0, 4, 7, 6], [2, 4, 7, 8],
        [0, 1, 2, 5], [6, 7, 8, 5], [0, 3, 6, 7], [2, 5, 8, 7]
      ],
      4: [
        [0, 1, 2, 5, 8], [6, 7, 8, 5, 2], [0, 3, 6, 7, 8],
        [0, 1, 4, 7, 8], [2, 1, 4, 7, 6], [6, 3, 4, 5, 2],
        [0, 3, 4, 1, 2], [8, 5, 4, 7, 6], [1, 4, 7, 6, 3]
      ],
      5: [
        [0, 1, 2, 5, 4, 3], [0, 3, 6, 7, 8, 5],
        [2, 1, 0, 3, 4, 7, 8], [6, 7, 8, 5, 4, 1, 0],
        [0, 4, 8, 7, 6, 3, 1], [2, 4, 6, 7, 8, 5, 1]
      ]
    };

    const targetPool = levelPatterns[Math.min(5, Math.max(1, level))] || levelPatterns[1];
    
    // Pick pattern different from last target to test active recall
    let candidate = targetPool[Math.floor(Math.random() * targetPool.length)];
    if (lastTarget && targetPool.length > 1) {
      let attempts = 0;
      while (attempts < 5 && JSON.stringify(candidate) === JSON.stringify(lastTarget)) {
        candidate = targetPool[Math.floor(Math.random() * targetPool.length)];
        attempts++;
      }
    }
    return candidate;
  }
}
