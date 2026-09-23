import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/db';

const API_BASE = 'http://127.0.0.1:8000';

export function useSyncEngine() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [offlineDriftAlert, setOfflineDriftAlert] = useState(null);

  // Run local 7+ day offline heuristic
  const evaluateLocalOfflineDrift = useCallback(async () => {
    try {
      const records = await db.telemetry.toArray();
      if (!records || records.length === 0) return;

      const patient = await db.patients.toCollection().first();
      const baseline = patient?.baseline_latency || 800;

      // Group last 7 items vs baseline
      const recent = records.slice(-7);
      const meanLatency = recent.reduce((sum, r) => sum + r.latency_ms, 0) / recent.length;
      const drift = ((meanLatency - baseline) / baseline) * 100;

      if (drift > 35.0) {
        setOfflineDriftAlert({
          driftPercent: Math.round(drift * 10) / 10,
          meanLatency: Math.round(meanLatency),
          baseline,
          message: `On-Device Offline Alert: 7-day cognitive latency drift is +${drift.toFixed(1)}% (exceeds 35% clinical threshold)`
        });
      } else {
        setOfflineDriftAlert(null);
      }
    } catch (err) {
      console.warn('Error computing offline drift heuristic:', err);
    }
  }, []);

  // Sync queued records from Dexie to FastAPI backend
  const syncPendingRecords = useCallback(async () => {
    if (!navigator.onLine) {
      await evaluateLocalOfflineDrift();
      return;
    }

    try {
      setIsSyncing(true);
      const unsyncedTelemetry = await db.telemetry.toArray();

      if (unsyncedTelemetry.length > 0) {
        const payload = {
          records: unsyncedTelemetry.map(t => ({
            patient_id: t.patient_id || 1,
            game_type: t.game_type,
            latency_ms: t.latency_ms,
            jitter_px: t.jitter_px || 0.0,
            accuracy_score: t.accuracy_score || 1.0,
            source: t.source || 'PWA',
            timestamp: t.timestamp
          }))
        };

        const res = await fetch(`${API_BASE}/api/v1/telemetry/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setLastSyncTime(new Date().toLocaleTimeString());
        }
      }

      // Also sync ASHA queue if unsynced
      const unsyncedAsha = await db.asha_queue.filter(a => a.synced === false).toArray();
      if (unsyncedAsha.length > 0) {
        await fetch(`${API_BASE}/api/v1/asha/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(unsyncedAsha.map(a => ({
            patient_id: a.patient_id,
            patient_name: a.patient_name,
            village: a.village,
            triage_status: a.triage_status,
            notes: a.notes,
            worker_id: 'ASHA-NAGAON-01'
          })))
        });

        await db.asha_queue.filter(a => a.synced === false).modify({ synced: true });
      }
    } catch (err) {
      console.warn('Sync failed (server offline or unreachable), remaining in Dexie local storage:', err);
      await evaluateLocalOfflineDrift();
    } finally {
      setIsSyncing(false);
    }
  }, [evaluateLocalOfflineDrift]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingRecords();
    };

    const handleOffline = () => {
      setIsOnline(false);
      evaluateLocalOfflineDrift();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial evaluation
    evaluateLocalOfflineDrift();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingRecords, evaluateLocalOfflineDrift]);

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    offlineDriftAlert,
    syncPendingRecords,
    evaluateLocalOfflineDrift
  };
}
