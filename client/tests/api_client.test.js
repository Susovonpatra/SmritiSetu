import test from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../src/services/api/client.js';
import { config } from '../src/config/env.js';

test('AppError sets correct code, status, and details', () => {
  const err = new AppError('Resource missing', {
    code: 'NOT_FOUND',
    status: 404,
    details: { resourceId: 'patient_42' }
  });

  assert.strictEqual(err.name, 'AppError');
  assert.strictEqual(err.message, 'Resource missing');
  assert.strictEqual(err.code, 'NOT_FOUND');
  assert.strictEqual(err.status, 404);
  assert.deepStrictEqual(err.details, { resourceId: 'patient_42' });
  assert.ok(err instanceof Error);
});

test('AppError defaults to UNKNOWN_ERROR and status 500', () => {
  const err = new AppError('Server crash');
  assert.strictEqual(err.code, 'UNKNOWN_ERROR');
  assert.strictEqual(err.status, 500);
  assert.strictEqual(err.details, null);
});

test('Client config provides default API base URL', () => {
  assert.ok(config.apiBaseUrl, 'config.apiBaseUrl should be defined');
  assert.strictEqual(typeof config.apiBaseUrl, 'string');
});
