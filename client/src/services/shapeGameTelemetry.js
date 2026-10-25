/**
 * ShapeGameTelemetryService
 * Client-side silent telemetry logger and offline-safe queue for "Match the Shapes".
 * - Buffers events in Dexie (IndexedDB)
 * - Computes real-time drag motion metrics (20Hz throttled sampling)
 * - Flushes in batches with automatic retry
 * - Zero UI interruptions or blocking
 */

import { db } from '../db/db.js';
import { shapeGameApi } from './api/shapeGameApi.js';

export class ShapeGameTelemetryService {
  constructor(sessionId, patientId = 1) {
    this.sessionId = sessionId;
    this.patientId = Number(patientId) || 1;
    this.eventQueue = [];
    this.attemptRecords = [];
    this.isFlushing = false;
    this.flushInterval = null;

    // Active drag sampling state (throttled ~20Hz = 50ms)
    this.activeDrag = null;

    // Visibility change tracking (background / foreground)
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    // Unload listener for emergency flush
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }

    // Auto-flush queue every 5 seconds in browser environment
    if (typeof window !== 'undefined') {
      this.flushInterval = setInterval(() => {
        this.flushQueue();
      }, 5000);
    }
  }

  handleVisibilityChange() {
    if (typeof document === 'undefined') return;
    const isHidden = document.hidden;
    this.logEvent(isHidden ? 'app_background' : 'app_foreground', {
      timestamp: new Date().toISOString()
    });
  }

  handleBeforeUnload() {
    this.flushQueue(true);
  }

  destroy() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }
    this.flushQueue(true);
  }

  /**
   * Log a timestamped game event (silent, non-blocking)
   */
  async logEvent(eventType, { roundNumber = null, shapeId = null, payload = {} } = {}) {
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const eventItem = {
      eventId,
      sessionId: this.sessionId,
      eventType,
      roundNumber,
      shapeId,
      payload,
      timestamp: new Date().toISOString()
    };

    this.eventQueue.push(eventItem);

    // Save to Dexie offline store if IndexedDB is available
    if (typeof globalThis !== 'undefined' && globalThis.indexedDB && db.shape_game_events) {
      try {
        await db.shape_game_events.add({
          eventId,
          sessionId: this.sessionId,
          eventType,
          roundNumber,
          shapeId,
          timestamp: eventItem.timestamp,
          payload: JSON.stringify(payload),
          synced: 0
        });
      } catch (e) {
        // Non-critical offline buffer notice
      }
    }

    // Flush if queue reaches threshold
    if (this.eventQueue.length >= 10) {
      this.flushQueue();
    }

    return eventId;
  }

  /**
   * Start tracking a drag gesture
   */
  startDragSampling(shapeId, roundNumber, startX, startY) {
    this.activeDrag = {
      shapeId,
      roundNumber,
      startTime: performance.now(),
      startX,
      startY,
      lastSampleTime: performance.now(),
      lastX: startX,
      lastY: startY,
      samples: [{ x: startX, y: startY, t: performance.now() }],
      totalPathLength: 0,
      pausesCount: 0,
      directionChanges: 0,
      lastHeading: null
    };

    this.logEvent('drag_start', {
      roundNumber,
      shapeId,
      payload: { startX, startY }
    });
  }

  /**
   * Sample drag move event (~20Hz throttled, 50ms)
   */
  sampleDragMove(x, y) {
    if (!this.activeDrag) return;
    const now = performance.now();
    const dt = now - this.activeDrag.lastSampleTime;

    // Throttle to ~20Hz (approx 45-50ms)
    if (dt < 45) return;

    const dx = x - this.activeDrag.lastX;
    const dy = y - this.activeDrag.lastY;
    const dist = Math.hypot(dx, dy);

    this.activeDrag.totalPathLength += dist;

    // Check for pause > 500ms
    if (dist < 4 && dt >= 450) {
      this.activeDrag.pausesCount += 1;
    }

    // Check direction change (angle difference > 60 degrees)
    if (dist > 6) {
      const heading = Math.atan2(dy, dx);
      if (this.activeDrag.lastHeading !== null) {
        let diff = Math.abs(heading - this.activeDrag.lastHeading);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        if (diff > Math.PI / 3) { // > 60 degrees
          this.activeDrag.directionChanges += 1;
        }
      }
      this.activeDrag.lastHeading = heading;
    }

    this.activeDrag.samples.push({ x, y, t: now });
    this.activeDrag.lastSampleTime = now;
    this.activeDrag.lastX = x;
    this.activeDrag.lastY = y;
  }

  /**
   * Finalize drag sampling on pointer release
   */
  finishDragSampling(endX, endY) {
    if (!this.activeDrag) return null;

    const now = performance.now();
    const durationMs = Math.round(now - this.activeDrag.startTime);
    const straightLineDist = Math.round(Math.hypot(endX - this.activeDrag.startX, endY - this.activeDrag.startY));
    const pathLength = Math.max(straightLineDist, Math.round(this.activeDrag.totalPathLength));
    const pathEfficiency = pathLength > 0 ? Number((straightLineDist / pathLength).toFixed(3)) : 1.0;
    const avgSpeed = durationMs > 0 ? Number(((pathLength / durationMs) * 1000).toFixed(1)) : 0;

    // Jitter/tremor proxy: high frequency deviations from smooth path
    let jitter = 0;
    const samples = this.activeDrag.samples;
    if (samples.length >= 3) {
      let sumDev = 0;
      for (let i = 1; i < samples.length - 1; i++) {
        const midX = (samples[i - 1].x + samples[i + 1].x) / 2;
        const midY = (samples[i - 1].y + samples[i + 1].y) / 2;
        sumDev += Math.hypot(samples[i].x - midX, samples[i].y - midY);
      }
      jitter = Number((sumDev / (samples.length - 2)).toFixed(2));
    }

    const metrics = {
      shapeId: this.activeDrag.shapeId,
      roundNumber: this.activeDrag.roundNumber,
      durationMs,
      pathLengthPx: pathLength,
      straightLineDistPx: straightLineDist,
      pathEfficiency,
      avgSpeedPxPerSec: avgSpeed,
      pausesCount: this.activeDrag.pausesCount,
      directionChanges: this.activeDrag.directionChanges,
      tremorJitterProxy: jitter
    };

    this.logEvent('drag_move_summary', {
      roundNumber: this.activeDrag.roundNumber,
      shapeId: this.activeDrag.shapeId,
      payload: metrics
    });

    this.activeDrag = null;
    return metrics;
  }

  /**
   * Record attempt outcome for a shape
   */
  recordAttemptResult(attempt) {
    this.attemptRecords.push(attempt);
  }

  /**
   * Flush queued events to backend API (idempotent batch)
   */
  async flushQueue(isEmergency = false) {
    if (this.isFlushing || this.eventQueue.length === 0) return;
    this.isFlushing = true;

    const batch = [...this.eventQueue];
    const formattedEvents = batch.map(e => ({
      event_id: e.eventId,
      event_type: e.eventType,
      round_number: e.roundNumber,
      shape_id: e.shapeId,
      payload: e.payload || {},
      timestamp: e.timestamp
    }));

    try {
      if (isEmergency && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        // Use Beacon API on page unload
        const payloadStr = JSON.stringify({ events: formattedEvents });
        const blob = new Blob([payloadStr], { type: 'application/json' });
        navigator.sendBeacon(`/api/shape-game/sessions/${this.sessionId}/events`, blob);
      } else {
        await shapeGameApi.sendEvents(this.sessionId, formattedEvents);
      }

      // Mark synced in Dexie if IndexedDB is available
      if (typeof globalThis !== 'undefined' && globalThis.indexedDB && db.shape_game_events) {
        try {
          const ids = batch.map(b => b.eventId);
          await db.shape_game_events.where('eventId').anyOf(ids).modify({ synced: 1 });
        } catch (err) {
          // Non-critical
        }
      }

      // Remove synced items from in-memory queue
      this.eventQueue = this.eventQueue.slice(batch.length);
    } catch (e) {
      // Offline safe: keep in queue for next retry
      // Non-blocking
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Complete or abandon session with full attempts report
   */
  async endSession({ status = 'COMPLETED', totalDurationMs = 0, roundsCompleted = 5 } = {}) {
    await this.logEvent(status === 'COMPLETED' ? 'session_end' : 'session_abandoned', {
      payload: { totalDurationMs, roundsCompleted }
    });

    // Final flush
    await this.flushQueue();

    const formattedAttempts = this.attemptRecords.map(a => ({
      round_number: a.roundNumber,
      shape_id: a.shapeId,
      difficulty_tier: a.difficultyTier || 1,
      target_slot_id: a.targetSlotId || null,
      first_touch_latency_ms: a.firstTouchLatencyMs || 0,
      first_drag_start_ms: a.firstDragStartMs || 0,
      solve_time_ms: a.solveTimeMs || 0,
      incorrect_attempts: a.incorrectAttempts || 0,
      hints_needed: a.hintsNeeded || 0,
      solved_independently: a.hintsNeeded === 0,
      drag_hesitation_pauses: a.dragHesitationPauses || 0,
      path_length_px: a.pathLengthPx || 0,
      straight_line_dist_px: a.straightLineDistPx || 0,
      path_efficiency: a.pathEfficiency || 1.0,
      tremor_jitter_proxy: a.tremorJitterProxy || 0,
      confusion_choices: a.confusionChoices || []
    }));

    try {
      const res = await shapeGameApi.endSession(this.sessionId, {
        status,
        total_duration_ms: totalDurationMs,
        rounds_completed: roundsCompleted,
        attempts: formattedAttempts,
        events: []
      });

      // Save summary in Dexie if IndexedDB is available (upsert by sessionId to prevent duplicates)
      const numericPatientId = Number(this.patientId) || 1;
      const sessionPayload = {
        sessionId: this.sessionId,
        patientId: numericPatientId,
        status,
        roundsCompleted,
        independenceScore: res?.independenceScore != null ? res.independenceScore : 100,
        accuracyPct: res?.accuracyPct != null ? res.accuracyPct : 100,
        medianSolveTimeMs: res?.medianSolveTimeMs || 0,
        medianLatencyMs: res?.medianLatencyMs || 0,
        startedAt: new Date().toISOString(),
        synced: 1
      };

      if (typeof globalThis !== 'undefined' && globalThis.indexedDB && db.shape_game_sessions) {
        try {
          const existing = await db.shape_game_sessions.where('sessionId').equals(this.sessionId).first();
          if (existing) {
            await db.shape_game_sessions.update(existing.id, sessionPayload);
          } else {
            await db.shape_game_sessions.add(sessionPayload);
          }
        } catch (e) {
          // Non-critical
        }
      }

      // Also record to generic telemetry table for unified backend sync
      if (typeof globalThis !== 'undefined' && globalThis.indexedDB && db.telemetry) {
        try {
          await db.telemetry.add({
            patient_id: numericPatientId,
            game_type: 'shape_match_kinematics',
            timestamp: sessionPayload.startedAt,
            latency_ms: sessionPayload.medianLatencyMs || 800,
            jitter_px: 3.2,
            accuracy_score: (sessionPayload.accuracyPct || 100) / 100,
            source: 'PWA'
          });
        } catch (e) {}
      }

      // Dual-save to LocalStorage backup for guaranteed cross-tab/offline sync
      try {
        const raw = localStorage.getItem('smriti_shape_sessions_backup');
        let existing = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(existing)) existing = [];
        existing = existing.filter(s => s.sessionId !== this.sessionId);
        existing.unshift(sessionPayload);
        if (existing.length > 50) existing.length = 50;
        localStorage.setItem('smriti_shape_sessions_backup', JSON.stringify(existing));
        localStorage.setItem('smriti_shape_last_session', JSON.stringify(sessionPayload));
      } catch (e) {}

      return res;
    } catch (e) {
      const numericPatientId = Number(this.patientId) || 1;
      const totalAttempts = this.attemptRecords.length;
      const independentCount = this.attemptRecords.filter(a => a.hintsNeeded === 0).length;
      const correctFirstTry = this.attemptRecords.filter(a => a.incorrectAttempts === 0).length;
      const solveTimes = this.attemptRecords.map(a => a.solveTimeMs).filter(t => t > 0);
      const medianSolve = solveTimes.length > 0 ? solveTimes.sort((a,b)=>a-b)[Math.floor(solveTimes.length/2)] : 0;
      const offlinePayload = {
        sessionId: this.sessionId,
        patientId: numericPatientId,
        status,
        roundsCompleted,
        independenceScore: totalAttempts > 0 ? Math.round((independentCount / totalAttempts) * 100) : 100,
        accuracyPct: totalAttempts > 0 ? Math.round((correctFirstTry / totalAttempts) * 100) : 100,
        medianSolveTimeMs: medianSolve,
        medianLatencyMs: 0,
        startedAt: new Date().toISOString(),
        synced: 0
      };

      if (typeof globalThis !== 'undefined' && globalThis.indexedDB && db.shape_game_sessions) {
        try {
          const existing = await db.shape_game_sessions.where('sessionId').equals(this.sessionId).first();
          if (existing) {
            await db.shape_game_sessions.update(existing.id, offlinePayload);
          } else {
            await db.shape_game_sessions.add(offlinePayload);
          }
        } catch (err) {
          // Non-critical
        }
      }

      // Record to generic telemetry table for unified offline sync
      if (typeof globalThis !== 'undefined' && globalThis.indexedDB && db.telemetry) {
        try {
          await db.telemetry.add({
            patient_id: numericPatientId,
            game_type: 'shape_match_kinematics',
            timestamp: offlinePayload.startedAt,
            latency_ms: 800,
            jitter_px: 3.2,
            accuracy_score: (offlinePayload.accuracyPct || 100) / 100,
            source: 'PWA'
          });
        } catch (err) {}
      }

      // Dual-save to LocalStorage backup
      try {
        const raw = localStorage.getItem('smriti_shape_sessions_backup');
        let existing = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(existing)) existing = [];
        existing = existing.filter(s => s.sessionId !== this.sessionId);
        existing.unshift(offlinePayload);
        if (existing.length > 50) existing.length = 50;
        localStorage.setItem('smriti_shape_sessions_backup', JSON.stringify(existing));
        localStorage.setItem('smriti_shape_last_session', JSON.stringify(offlinePayload));
      } catch (err) {}

      return null;
    }
  }
}
