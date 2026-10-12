import { apiClient } from './client';

export const localeApi = {
  detectLocale: () =>
    apiClient('/api/v1/locale/detect', { credentials: 'include' }),

  overrideLocale: ({ langCode, stateCode = null }) =>
    apiClient('/api/v1/locale/override', {
      method: 'POST',
      body: { langCode, stateCode },
      credentials: 'include'
    }),

  getSupportedLocales: () =>
    apiClient('/api/v1/locale/supported')
};
