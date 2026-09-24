import { resolveRegionFromRequest, DEFAULT_FALLBACK_LOCALE, STATE_LOCALE_MAP } from '../services/geoipService.js';

const COOKIE_LOCALE_KEY = 'smritisetu_locale';
const COOKIE_REGION_KEY = 'smritisetu_region';
const COOKIE_OVERRIDE_KEY = 'smritisetu_manual_override';

/**
 * Express Middleware for Location-Aware Localization:
 * - Checks cookies to see if caregiver/user previously set a preference.
 * - If not overridden, dynamically detects region via GeoIP / Edge headers.
 * - Sets persistent cookie if first visit.
 * - Attaches locale metadata to req.localeInfo.
 */
export function geoipLocaleMiddleware(req, res, next) {
  const cookies = req.cookies || {};
  const hasManualOverride = cookies[COOKIE_OVERRIDE_KEY] === 'true';
  const savedLocale = cookies[COOKIE_LOCALE_KEY];
  const savedRegion = cookies[COOKIE_REGION_KEY];

  // Resolve current request's GeoIP
  const detected = resolveRegionFromRequest(req);

  let activeLang;
  let activeRegion = detected;

  if (hasManualOverride && savedLocale) {
    // Respect manual user choice
    activeLang = savedLocale;
    if (savedRegion && STATE_LOCALE_MAP[savedRegion]) {
      activeRegion = STATE_LOCALE_MAP[savedRegion];
    }
  } else {
    // Use detected regional language
    activeLang = detected.langCode;

    // Set cookie for session persistence (30 days)
    if (!savedLocale) {
      res.cookie(COOKIE_LOCALE_KEY, activeLang, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false, // Accessible to client JavaScript for zero layout shift
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      res.cookie(COOKIE_REGION_KEY, detected.stateCode, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    }
  }

  req.localeInfo = {
    activeLocale: activeLang,
    stateCode: activeRegion.stateCode,
    stateName: activeRegion.stateName,
    nativeName: activeRegion.nativeName,
    englishName: activeRegion.englishName,
    pair: activeRegion.pair || [activeLang, 'en'],
    isDetected: detected.isDetected,
    detectionSource: detected.source,
    clientIp: detected.clientIp || '127.0.0.1',
    hasManualOverride
  };

  next();
}
