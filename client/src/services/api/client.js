/**
 * Central API Client for SmritiSetu frontend.
 * Provides normalized AppError, timeout handling, and consistent JSON fetch requests.
 */

import { config } from '../../config/env.js';

export class AppError extends Error {
  constructor(message, { code = 'UNKNOWN_ERROR', status = 500, details = null } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiClient(endpoint, {
  method = 'GET',
  body = null,
  headers = {},
  timeoutMs = 10000,
  credentials = 'omit'
} = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${config.apiBaseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials,
    signal: controller.signal,
  };

  if (body !== null && method !== 'GET' && method !== 'HEAD') {
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);
    clearTimeout(timer);

    const contentType = response.headers.get('content-type') || '';
    let responseData = null;

    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const message = (responseData && typeof responseData === 'object' && responseData.detail)
        ? responseData.detail
        : `Request failed with status ${response.status}`;

      throw new AppError(message, {
        code: `HTTP_${response.status}`,
        status: response.status,
        details: responseData
      });
    }

    return responseData;
  } catch (error) {
    clearTimeout(timer);

    if (error instanceof AppError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new AppError(`Request to ${url} timed out after ${timeoutMs}ms`, {
        code: 'TIMEOUT',
        status: 408
      });
    }

    throw new AppError(error.message || 'Network request failed', {
      code: 'NETWORK_ERROR',
      status: 0,
      details: error
    });
  }
}
