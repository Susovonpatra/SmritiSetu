/**
 * Central API Client for Match the Shapes Game & Caregiver Analytics
 */

import { apiClient } from './client.js';

export const shapeGameApi = {
  /**
   * Start a new shape game session
   */
  startSession: ({ patientId = 1, seed = null, clientVersion = '1.0.0' } = {}) =>
    apiClient('/api/shape-game/sessions', {
      method: 'POST',
      body: { patient_id: patientId || 1, seed, client_version: clientVersion }
    }),

  /**
   * Ingest batched timestamped events (offline-safe, idempotent)
   */
  sendEvents: (sessionId, events = []) =>
    apiClient(`/api/shape-game/sessions/${sessionId}/events`, {
      method: 'POST',
      body: { events }
    }),

  /**
   * End session with attempts report & events
   */
  endSession: (sessionId, payload) =>
    apiClient(`/api/shape-game/sessions/${sessionId}/end`, {
      method: 'POST',
      body: payload
    }),

  /**
   * Caregiver summary metrics & trends (7d, 30d, 90d)
   */
  getCaregiverSummary: (patientId = 1, range = '30d') =>
    apiClient(`/api/caregiver/patients/${patientId}/shape-game/summary?range=${range}`),

  /**
   * List sessions with pagination
   */
  getCaregiverSessions: (patientId = 1, limit = 50, offset = 0) =>
    apiClient(`/api/caregiver/patients/${patientId}/shape-game/sessions?limit=${limit}&offset=${offset}`),

  /**
   * Drill-down into a specific session
   */
  getCaregiverSessionDetail: (patientId = 1, sessionId) =>
    apiClient(`/api/caregiver/patients/${patientId}/shape-game/sessions/${sessionId}`),

  /**
   * Fetch active alerts
   */
  getCaregiverAlerts: (patientId = 1) =>
    apiClient(`/api/caregiver/patients/${patientId}/shape-game/alerts`),

  /**
   * Acknowledge/dismiss alert
   */
  acknowledgeAlert: (patientId = 1, alertId) =>
    apiClient(`/api/caregiver/patients/${patientId}/shape-game/alerts/${alertId}/acknowledge`, {
      method: 'POST'
    }),

  /**
   * Export CSV or JSON report for doctor sharing
   */
  getExportUrl: (patientId = 1, format = 'csv') =>
    `/api/caregiver/patients/${patientId}/shape-game/export?format=${format}`
};
