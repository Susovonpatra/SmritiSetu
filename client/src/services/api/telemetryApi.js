import { apiClient } from './client';

export const telemetryApi = {
  getDrift: (patientId = 1) =>
    apiClient(`/api/v1/telemetry/drift/${patientId}`),

  getAnalytics: (patientId = 1, days = 30) =>
    apiClient(`/api/v1/telemetry/analytics/${patientId}?days=${days}`),

  syncBatch: (records) =>
    apiClient('/api/v1/telemetry/sync', {
      method: 'POST',
      body: { records }
    }),

  logBiographicalTrial: (trial) =>
    apiClient('/api/v1/telemetry/biographical', {
      method: 'POST',
      body: trial
    }),

  getBiographicalTrials: (patientId = 1) =>
    apiClient(`/api/v1/telemetry/biographical/${patientId}`)
};
