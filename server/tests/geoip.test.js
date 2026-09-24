import assert from 'node:assert';
import { resolveRegionFromRequest, STATE_LOCALE_MAP, DEFAULT_FALLBACK_LOCALE } from '../src/services/geoipService.js';

console.log('🧪 Starting GeoIP & State-to-Language Resolution Tests...\n');

// Test 1: Odisha detection via Cloudflare header
{
  const mockReq = {
    headers: { 'cf-region-code': 'OD' },
    socket: { remoteAddress: '117.239.10.20' }
  };
  const result = resolveRegionFromRequest(mockReq);
  assert.strictEqual(result.langCode, 'or', 'Odisha should map to langCode "or"');
  assert.strictEqual(result.nativeName, 'ଓଡ଼ିଆ', 'Odisha should have nativeName "ଓଡ଼ିଆ"');
  assert.deepStrictEqual(result.pair, ['or', 'en'], 'Odisha should have 2-way toggle pair ["or", "en"]');
  console.log('✅ Test 1 Passed: Odisha detected via cf-region-code (Odia: ଓଡ଼ିଆ ⇄ English)');
}

// Test 2: Gujarat detection via Vercel subdivision header
{
  const mockReq = {
    headers: { 'x-vercel-ip-subdivision': 'GJ' },
    socket: { remoteAddress: '103.240.232.1' }
  };
  const result = resolveRegionFromRequest(mockReq);
  assert.strictEqual(result.langCode, 'gu', 'Gujarat should map to langCode "gu"');
  assert.strictEqual(result.nativeName, 'ગુજરાતી', 'Gujarat should have nativeName "ગુજરાતી"');
  assert.deepStrictEqual(result.pair, ['gu', 'en'], 'Gujarat should have 2-way toggle pair ["gu", "en"]');
  console.log('✅ Test 2 Passed: Gujarat detected via x-vercel-ip-subdivision (Gujarati: ગુજરાતી ⇄ English)');
}

// Test 3: Localhost fallback (127.0.0.1) does not crash and provides clean fallback
{
  const mockReq = {
    headers: {},
    socket: { remoteAddress: '127.0.0.1' }
  };
  const result = resolveRegionFromRequest(mockReq);
  assert.strictEqual(result.isDetected, false, 'Localhost should not be falsely detected');
  assert.strictEqual(result.langCode, 'en', 'Localhost should fallback to en-IN');
  console.log('✅ Test 3 Passed: Localhost 127.0.0.1 safely falls back to standard locale without errors');
}

// Test 4: Developer test override query parameter (?testRegion=GJ)
{
  const mockReq = {
    headers: {},
    query: { testRegion: 'GJ' },
    socket: { remoteAddress: '127.0.0.1' }
  };
  const result = resolveRegionFromRequest(mockReq);
  assert.strictEqual(result.langCode, 'gu', 'Test override GJ should resolve to Gujarati');
  console.log('✅ Test 4 Passed: Developer test override (?testRegion=GJ) resolved correctly');
}

console.log('\n🎉 All GeoIP & Localization Unit Tests Passed Successfully!');
