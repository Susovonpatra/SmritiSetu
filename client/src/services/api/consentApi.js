import { apiClient } from './client';

export const consentApi = {
  createRecord: (consentData) =>
    apiClient('/api/v1/consent', {
      method: 'POST',
      body: consentData
    }),

  getPatientConsent: (patientId = 1) =>
    apiClient(`/api/v1/consent/${patientId}`)
};
