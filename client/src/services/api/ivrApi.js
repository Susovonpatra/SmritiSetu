import { apiClient } from './client';

export const ivrApi = {
  simulateCall: ({ patient_id, q1, q2, q3, call_sid = 'WEB-SIM-101' }) =>
    apiClient('/api/v1/ivr/simulate', {
      method: 'POST',
      body: {
        patient_id,
        q1,
        q2,
        q3,
        call_sid
      }
    })
};
