import test from 'node:test';
import assert from 'node:assert/strict';
import { TRANSLATIONS } from '../src/locales/translations.js';
import { generateSessionHash } from '../src/utils/crypto.js';

test('Translations: all 4 core dialects exist and have essential sections', () => {
  const supportedLangs = ['en', 'or', 'gu', 'as'];
  for (const lang of supportedLangs) {
    assert.ok(TRANSLATIONS[lang], `Missing translation table for ${lang}`);
    assert.ok(TRANSLATIONS[lang].languageName, `Missing languageName in ${lang}`);
    assert.ok(TRANSLATIONS[lang].englishName, `Missing englishName in ${lang}`);
    assert.ok(TRANSLATIONS[lang].nav, `Missing nav dictionary in ${lang}`);
    assert.ok(TRANSLATIONS[lang].games, `Missing games dictionary in ${lang}`);
    assert.ok(TRANSLATIONS[lang].asha, `Missing asha dictionary in ${lang}`);
  }
});

test('Crypto: generateSessionHash produces 64-char sha-256 hex digest', async () => {
  const samplePayload = { patientId: 1, caregiver: 'Ananya Baruah', consent: true };
  const hash = await generateSessionHash(samplePayload);
  assert.strictEqual(typeof hash, 'string');
  assert.strictEqual(hash.length, 64);
  assert.match(hash, /^[0-9a-f]{64}$/);
});
