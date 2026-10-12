import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db/db';
import { ashaApi } from '@/services/api/ashaApi';

export function useAshaTriage() {
  const [queue, setQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  const loadQueue = useCallback(async () => {
    try {
      const records = await db.asha_queue.reverse().toArray();
      setQueue(records);
    } catch (err) {
      console.warn('Error loading ASHA queue from Dexie:', err);
      setError(err);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const addScreeningRecord = useCallback(async ({
    patientId = 1,
    patientName,
    village,
    triageStatus = 'Amber',
    notes = ''
  }) => {
    const item = {
      patient_id: patientId,
      worker_id: 'ASHA-NAGAON-01',
      patient_name: patientName,
      village,
      triage_status: triageStatus,
      notes,
      synced: false,
      timestamp: new Date().toISOString()
    };

    await db.asha_queue.add(item);
    await loadQueue();
    return item;
  }, [loadQueue]);

  const syncQueueToPhc = useCallback(async () => {
    const pending = queue.filter(q => !q.synced);
    if (pending.length === 0) return { syncedCount: 0 };

    setIsSyncing(true);
    setError(null);
    try {
      await ashaApi.syncBatch(pending);
      for (const rec of pending) {
        if (rec.id) {
          await db.asha_queue.update(rec.id, { synced: true });
        }
      }
      await loadQueue();
      return { syncedCount: pending.length };
    } catch (err) {
      console.warn('ASHA offline sync failed:', err);
      setError(err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [queue, loadQueue]);

  return {
    queue,
    isSyncing,
    error,
    loadQueue,
    addScreeningRecord,
    syncQueueToPhc
  };
}
