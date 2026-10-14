import { apiClient } from './client';

export const ashaApi = {
  getQueue: (workerId = 'ASHA-NAGAON-01') =>
    apiClient(`/api/v1/asha/queue?worker_id=${encodeURIComponent(workerId)}`),

  addRecord: (record) =>
    apiClient('/api/v1/asha/queue', {
      method: 'POST',
      body: record
    }),

  syncBatch: (records) =>
    apiClient('/api/v1/asha/sync', {
      method: 'POST',
      body: records
    })
};
