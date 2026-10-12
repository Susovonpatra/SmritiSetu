import { apiClient } from './client';
import { config } from '../../config/env.js';

export const esanjeevaniApi = {
  dispatchConsultation: ({ patient_id, abha_id, urgency_level = 'Routine', clinical_notes = '' }) =>
    apiClient('/api/v1/esanjeevani/dispatch', {
      method: 'POST',
      body: {
        patient_id,
        abha_id,
        urgency_level,
        clinical_notes
      }
    }),

  getPdfReportUrl: (patientId = 1) =>
    `${config.apiBaseUrl}/report/${patientId}/pdf`
};
