/**
 * biographicalTelemetry.js
 * Neurocognitive Telemetry & Assessment Service for Biographical Recognition in Dementia Care
 * 
 * Implements:
 * - Immutable trial logging (RecognitionTrialLog)
 * - Longitudinal 7-day and 30-day moving averages
 * - Relational memory tier decay metrics (Tiers 1 to 4)
 * - Confusion Frequency Matrix (recurring confabulations / mistaken identities)
 * - Cognitive Fatigue Analysis (Questions 1-3 vs Questions 7+)
 * - Spatial perseveration slot analysis
 * - Full IndexedDB with LocalStorage fallback & backend synchronization
 */

import { db, DEFAULT_BIOGRAPHICAL_QUESTIONS } from '../db/db';

const STORAGE_KEY_QUESTIONS = 'smriti_biographical_questions';
const STORAGE_KEY_TRIALS = 'smriti_biographical_trials_backup';

export class BiographicalTelemetryService {
  /**
   * Fetch all configured biographical questions
   */
  static async getQuestions(patientId = 1) {
    try {
      if (db.biographical_questions) {
        const questions = await db.biographical_questions.toArray();
        if (questions && questions.length > 0) {
          return questions.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        }
      }
    } catch (err) {
      console.warn('IndexedDB questions read failed, checking localStorage fallback:', err);
    }

    // LocalStorage fallback
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUESTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        }
      }
    } catch (e) {
      console.warn('LocalStorage questions read failed:', e);
    }

    return DEFAULT_BIOGRAPHICAL_QUESTIONS;
  }

  /**
   * Batch save questions (Reorder, Add, Edit, Delete)
   */
  static async saveQuestionsBatch(questions, patientId = 1) {
    const formatted = questions.map((q, idx) => ({
      ...q,
      patientId: patientId,
      orderIndex: idx,
      updatedAt: new Date().toISOString()
    }));

    // 1. IndexedDB
    try {
      if (db.biographical_questions) {
        await db.biographical_questions.clear();
        await db.biographical_questions.bulkAdd(formatted);
      }
    } catch (e) {
      console.warn('Could not persist questions to IndexedDB:', e);
    }

    // 2. LocalStorage Fallback
    try {
      localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(formatted));
    } catch (e) {
      console.warn('Could not backup questions to LocalStorage:', e);
    }

    // 3. Optional backend sync attempt
    try {
      fetch('http://localhost:8000/api/v1/memory/biographical-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, questions: formatted })
      }).catch(() => {
        // Silent catch for offline PWA operation
      });
    } catch {
      // Offline safe
    }

    return formatted;
  }

  /**
   * Log an immutable RecognitionTrialLog
   */
  static async logTrial(trialData) {
    const trialRecord = {
      trialId: trialData.trialId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `trial-${Date.now()}`),
      sessionId: trialData.sessionId || `session-${Date.now()}`,
      timestamp: trialData.timestamp || new Date().toISOString(),
      questionId: trialData.questionId,
      patientId: trialData.patientId || 1,
      relationTier: trialData.relationTier || 'TIER_1_CORE',
      selectedOptionIndex: Number(trialData.selectedOptionIndex),
      correctOptionIndex: Number(trialData.correctOptionIndex),
      isCorrect: Boolean(trialData.isCorrect),
      selectedText: String(trialData.selectedText || ''),
      correctText: String(trialData.correctText || ''),
      latencyMs: Math.max(0, Math.round(Number(trialData.latencyMs) || 0)),
      hesitationCount: Math.max(0, Math.round(Number(trialData.hesitationCount) || 0)),
      selectedPosition: Number(trialData.selectedPosition ?? trialData.selectedOptionIndex ?? 0)
    };

    // 1. IndexedDB Persistence
    try {
      if (db.biographical_trials) {
        await db.biographical_trials.add(trialRecord);
      }
    } catch (e) {
      console.warn('Failed to insert trial into IndexedDB:', e);
    }

    // 2. LocalStorage backup (keep last 100 trials for emergency restore)
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TRIALS);
      const existing = raw ? JSON.parse(raw) : [];
      existing.unshift(trialRecord);
      if (existing.length > 100) existing.length = 100;
      localStorage.setItem(STORAGE_KEY_TRIALS, JSON.stringify(existing));
    } catch (e) {
      console.warn('LocalStorage trial backup skipped:', e);
    }

    // 3. Optional backend telemetry sync
    try {
      fetch('http://localhost:8000/api/v1/telemetry/biographical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trialRecord)
      }).catch(() => {});
    } catch {}

    return trialRecord;
  }

  /**
   * Fetch all recorded trials for analytics
   */
  static async getAllTrials(patientId = 1) {
    let trials = [];
    try {
      if (db.biographical_trials) {
        trials = await db.biographical_trials.toArray();
      }
    } catch (err) {
      console.warn('Error reading biographical trials from IndexedDB:', err);
    }

    if (!trials || trials.length === 0) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_TRIALS);
        if (raw) trials = JSON.parse(raw);
      } catch (e) {}
    }

    return trials.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * 1. Longitudinal Trend Chart:
   * Visualizing 7-day and 30-day moving average of recognition accuracy and response speed (latency).
   */
  static async getLongitudinalTrends(patientId = 1) {
    const trials = await this.getAllTrials(patientId);
    if (!trials || trials.length === 0) {
      return [];
    }

    // Bucket by calendar date (YYYY-MM-DD)
    const dailyMap = new Map();
    trials.forEach(t => {
      const d = new Date(t.timestamp);
      const dateKey = d.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          dateKey,
          timestamp: d.getTime(),
          trials: []
        });
      }
      dailyMap.get(dateKey).trials.push(t);
    });

    const sortedDates = Array.from(dailyMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    // Compute daily averages
    const dailyStats = sortedDates.map(day => {
      const total = day.trials.length;
      const correct = day.trials.filter(t => t.isCorrect).length;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      const totalLatency = day.trials.reduce((sum, t) => sum + (t.latencyMs || 0), 0);
      const avgLatency = total > 0 ? Math.round(totalLatency / total) : 0;
      const totalHesitation = day.trials.reduce((sum, t) => sum + (t.hesitationCount || 0), 0);
      const avgHesitation = total > 0 ? Number((totalHesitation / total).toFixed(1)) : 0;

      const dateObj = new Date(day.dateKey);
      const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        dateKey: day.dateKey,
        displayDate,
        accuracy,
        avgLatency,
        avgHesitation,
        count: total
      };
    });

    // Compute 7-day and 30-day moving averages (rolling window over dailyStats)
    const result = dailyStats.map((item, idx) => {
      // 7-day window (up to 7 previous available data points)
      const window7Start = Math.max(0, idx - 6);
      const window7 = dailyStats.slice(window7Start, idx + 1);
      const ma7Acc = Math.round(window7.reduce((sum, i) => sum + i.accuracy, 0) / window7.length);
      const ma7Lat = Math.round(window7.reduce((sum, i) => sum + i.avgLatency, 0) / window7.length);

      // 30-day window (up to 30 previous data points)
      const window30Start = Math.max(0, idx - 29);
      const window30 = dailyStats.slice(window30Start, idx + 1);
      const ma30Acc = Math.round(window30.reduce((sum, i) => sum + i.accuracy, 0) / window30.length);
      const ma30Lat = Math.round(window30.reduce((sum, i) => sum + i.avgLatency, 0) / window30.length);

      return {
        ...item,
        ma7Accuracy: ma7Acc,
        ma7Latency: ma7Lat,
        ma30Accuracy: ma30Acc,
        ma30Latency: ma30Lat
      };
    });

    return result;
  }

  /**
   * 2. Relational Memory Breakdown:
   * Accuracy grouped by relationTier (TIER_1_CORE to TIER_4_EXTENDED)
   */
  static async getRelationalMemoryBreakdown(patientId = 1) {
    const trials = await this.getAllTrials(patientId);

    const tierMeta = {
      TIER_1_CORE: {
        label: 'Tier 1: Core (Spouse / Primary)',
        shortName: 'Tier 1 (Spouse)',
        color: '#059669', // Emerald
        clinicalMeaning: 'Core autobiographical anchors; highest resilience.'
      },
      TIER_2_CHILD: {
        label: 'Tier 2: Child (Immediate Children)',
        shortName: 'Tier 2 (Children)',
        color: '#2563eb', // Blue
        clinicalMeaning: 'Immediate filial ring; secondary vulnerability.'
      },
      TIER_3_SIBLING: {
        label: 'Tier 3: Sibling (Close Kin & Roots)',
        shortName: 'Tier 3 (Siblings)',
        color: '#d97706', // Amber
        clinicalMeaning: 'Mid-term biographical memory; early signs of erosion.'
      },
      TIER_4_EXTENDED: {
        label: 'Tier 4: Extended (Distant / Nostalgia)',
        shortName: 'Tier 4 (Extended)',
        color: '#dc2626', // Rose
        clinicalMeaning: 'Distant contextual memory; earliest decay vulnerability.'
      }
    };

    const buckets = {
      TIER_1_CORE: { total: 0, correct: 0, latencies: [], hesitations: [] },
      TIER_2_CHILD: { total: 0, correct: 0, latencies: [], hesitations: [] },
      TIER_3_SIBLING: { total: 0, correct: 0, latencies: [], hesitations: [] },
      TIER_4_EXTENDED: { total: 0, correct: 0, latencies: [], hesitations: [] }
    };

    trials.forEach(t => {
      const tier = t.relationTier || 'TIER_1_CORE';
      if (buckets[tier]) {
        buckets[tier].total += 1;
        if (t.isCorrect) buckets[tier].correct += 1;
        if (t.latencyMs) buckets[tier].latencies.push(t.latencyMs);
        if (t.hesitationCount != null) buckets[tier].hesitations.push(t.hesitationCount);
      }
    });

    return Object.entries(buckets).map(([key, data]) => {
      const meta = tierMeta[key];
      const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      const avgLatency = data.latencies.length > 0
        ? Math.round(data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length)
        : 0;
      const avgHesitation = data.hesitations.length > 0
        ? Number((data.hesitations.reduce((a, b) => a + b, 0) / data.hesitations.length).toFixed(1))
        : 0;

      let riskAssessment = 'Robust Stability';
      if (accuracy < 60) riskAssessment = 'Marked Degradation';
      else if (accuracy < 75) riskAssessment = 'Moderate Attenuation';
      else if (accuracy < 88) riskAssessment = 'Mild Drift';

      return {
        tierKey: key,
        tierLabel: meta.label,
        shortName: meta.shortName,
        accuracy,
        avgLatency,
        avgHesitation,
        totalTrials: data.total,
        correctTrials: data.correct,
        color: meta.color,
        clinicalMeaning: meta.clinicalMeaning,
        riskAssessment
      };
    });
  }

  /**
   * 3. Confusion Frequency Matrix:
   * Log and quantify recurring mistaken selections (e.g. clicks "Sister" when asked for "Daughter")
   */
  static async getConfusionFrequencyMatrix(patientId = 1) {
    const trials = await this.getAllTrials(patientId);
    const questions = await this.getQuestions(patientId);
    const qMap = new Map(questions.map(q => [q.questionId, q.questionText]));

    const confusionMap = new Map();

    trials.forEach(t => {
      if (!t.isCorrect) {
        const qText = qMap.get(t.questionId) || 'Biographical Memory Prompt';
        const key = `${t.questionId}:::${t.correctText}:::${t.selectedText}`;
        if (!confusionMap.has(key)) {
          confusionMap.set(key, {
            questionId: t.questionId,
            questionText: qText,
            relationTier: t.relationTier,
            correctText: t.correctText,
            selectedText: t.selectedText,
            frequency: 0,
            avgLatency: 0,
            latencies: [],
            lastOccurred: t.timestamp
          });
        }
        const entry = confusionMap.get(key);
        entry.frequency += 1;
        entry.latencies.push(t.latencyMs);
        if (new Date(t.timestamp) > new Date(entry.lastOccurred)) {
          entry.lastOccurred = t.timestamp;
        }
      }
    });

    const list = Array.from(confusionMap.values()).map(item => {
      const avgLatency = Math.round(item.latencies.reduce((a, b) => a + b, 0) / item.latencies.length);
      return {
        ...item,
        avgLatency,
        isRecurrent: item.frequency >= 2,
        relativeSeverity: item.frequency >= 3 ? 'High Frequency Misattribution' : item.frequency === 2 ? 'Recurring Confabulation' : 'Isolated Slips'
      };
    });

    // Sort by frequency descending
    return list.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * 4. Cognitive Fatigue Metric:
   * Graph & metric comparing accuracy and latency in Questions 1–3 vs Questions 7+
   */
  static async getCognitiveFatigueMetric(patientId = 1) {
    const trials = await this.getAllTrials(patientId);

    // Group trials by sessionId
    const sessionMap = new Map();
    trials.forEach(t => {
      const sId = t.sessionId || 'session-default';
      if (!sessionMap.has(sId)) {
        sessionMap.set(sId, []);
      }
      sessionMap.get(sId).push(t);
    });

    let earlyTrials = []; // index 0, 1, 2 (Questions 1-3)
    let midTrials = [];   // index 3, 4, 5 (Questions 4-6)
    let lateTrials = [];  // index >= 6 (Questions 7+)

    sessionMap.forEach(sTrials => {
      // Sort within session by timestamp
      sTrials.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      sTrials.forEach((t, indexInSession) => {
        if (indexInSession < 3) earlyTrials.push(t);
        else if (indexInSession < 6) midTrials.push(t);
        else lateTrials.push(t);
      });
    });

    const calcGroup = (group, name, description) => {
      const count = group.length;
      if (count === 0) return { name, description, count: 0, accuracy: 0, avgLatency: 0, avgHesitation: 0 };
      const correct = group.filter(t => t.isCorrect).length;
      const accuracy = Math.round((correct / count) * 100);
      const totalLat = group.reduce((sum, t) => sum + (t.latencyMs || 0), 0);
      const avgLatency = Math.round(totalLat / count);
      const totalHes = group.reduce((sum, t) => sum + (t.hesitationCount || 0), 0);
      const avgHesitation = Number((totalHes / count).toFixed(1));
      return { name, description, count, accuracy, avgLatency, avgHesitation };
    };

    const earlyMetrics = calcGroup(earlyTrials, 'Questions 1–3', 'Baseline Focus (Early Session)');
    const midMetrics = calcGroup(midTrials, 'Questions 4–6', 'Sustained Phase (Mid Session)');
    const lateMetrics = calcGroup(lateTrials, 'Questions 7+', 'Fatigue Threshold (Late Session)');

    // Accuracy Drop & Latency Increase
    const accuracyDropPercent = earlyMetrics.accuracy > 0
      ? Math.max(0, earlyMetrics.accuracy - lateMetrics.accuracy)
      : 0;
    const latencySlowdownMs = lateMetrics.avgLatency > earlyMetrics.avgLatency
      ? lateMetrics.avgLatency - earlyMetrics.avgLatency
      : 0;

    let fatigueRiskLevel = 'Minimal Fatigue Drift';
    if (accuracyDropPercent >= 20 || latencySlowdownMs >= 800) {
      fatigueRiskLevel = 'Significant Cognitive Depletion';
    } else if (accuracyDropPercent >= 10 || latencySlowdownMs >= 400) {
      fatigueRiskLevel = 'Moderate Cognitive Strain';
    }

    return {
      early: earlyMetrics,
      mid: midMetrics,
      late: lateMetrics,
      accuracyDropPercent,
      latencySlowdownMs,
      fatigueRiskLevel,
      chartData: [
        { phase: 'Early (Q 1–3)', accuracy: earlyMetrics.accuracy, latency: earlyMetrics.avgLatency, hesitation: earlyMetrics.avgHesitation },
        { phase: 'Mid (Q 4–6)', accuracy: midMetrics.accuracy, latency: midMetrics.avgLatency, hesitation: midMetrics.avgHesitation },
        { phase: 'Late (Q 7+)', accuracy: lateMetrics.accuracy, latency: lateMetrics.avgLatency, hesitation: lateMetrics.avgHesitation }
      ]
    };
  }

  /**
   * 5. Spatial Perseveration & Slot Distribution:
   * Detects if patient repeatedly taps the same physical screen slot (0-3)
   */
  static async getSpatialDistribution(patientId = 1) {
    const trials = await this.getAllTrials(patientId);
    const slots = [0, 0, 0, 0];
    trials.forEach(t => {
      const pos = Number(t.selectedPosition ?? t.selectedOptionIndex ?? 0);
      if (pos >= 0 && pos < 4) {
        slots[pos] += 1;
      }
    });

    const total = trials.length;
    return slots.map((count, slotIdx) => ({
      slot: slotIdx,
      label: `Slot ${slotIdx + 1} (${slotIdx === 0 ? 'Top Left' : slotIdx === 1 ? 'Top Right' : slotIdx === 2 ? 'Bottom Left' : 'Bottom Right'})`,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 25,
      isBiased: total > 20 && (count / total) > 0.45 // Perseveration alert if >45% taps concentrated on single slot
    }));
  }

  /**
   * Overall Summary Snapshot
   */
  static async getExecutiveSummary(patientId = 1) {
    const trials = await this.getAllTrials(patientId);
    const questions = await this.getQuestions(patientId);
    if (!trials || trials.length === 0) {
      return {
        totalTrials: 0,
        overallAccuracy: 0,
        averageLatencyMs: 0,
        tier1Stability: 0,
        questionPoolSize: questions.length
      };
    }

    const totalTrials = trials.length;
    const correctCount = trials.filter(t => t.isCorrect).length;
    const overallAccuracy = Math.round((correctCount / totalTrials) * 100);
    const avgLatency = Math.round(trials.reduce((sum, t) => sum + (t.latencyMs || 0), 0) / totalTrials);

    const tier1Trials = trials.filter(t => t.relationTier === 'TIER_1_CORE');
    const tier1Correct = tier1Trials.filter(t => t.isCorrect).length;
    const tier1Stability = tier1Trials.length > 0 ? Math.round((tier1Correct / tier1Trials.length) * 100) : 100;

    return {
      totalTrials,
      overallAccuracy,
      averageLatencyMs: avgLatency,
      tier1Stability,
      questionPoolSize: questions.length
    };
  }
}
