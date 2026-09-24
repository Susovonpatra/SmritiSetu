/**
 * Next.js Edge Middleware for Zero Layout Shift Locale Resolution (JavaScript)
 * Place this file at the root of a Next.js project as `middleware.js`.
 *
 * It intercepts incoming requests, reads GeoIP subdivision headers (Vercel / Cloudflare),
 * checks for existing caregiver preference cookies, and injects the resolved locale
 * into request headers or cookies.
 */

import { NextResponse } from 'next/server';

const STATE_MAPPINGS = {
  OD: { lang: 'or', nativeName: 'ଓଡ଼ିଆ', pair: ['or', 'en'] },
  OR: { lang: 'or', nativeName: 'ଓଡ଼ିଆ', pair: ['or', 'en'] },
  GJ: { lang: 'gu', nativeName: 'ગુજરાતી', pair: ['gu', 'en'] },
  AS: { lang: 'as', nativeName: 'অসমীয়া', pair: ['as', 'en'] },
  WB: { lang: 'bn', nativeName: 'বাংলা', pair: ['bn', 'en'] },
  MH: { lang: 'mr', nativeName: 'मराठी', pair: ['mr', 'en'] },
  KA: { lang: 'kn', nativeName: 'ಕನ್ನಡ', pair: ['kn', 'en'] },
  TN: { lang: 'ta', nativeName: 'தமிழ்', pair: ['ta', 'en'] },
  KL: { lang: 'ml', nativeName: 'മലയാളം', pair: ['ml', 'en'] },
  TG: { lang: 'te', nativeName: 'తెలుగు', pair: ['te', 'en'] },
  AP: { lang: 'te', nativeName: 'తెలుగు', pair: ['te', 'en'] },
  PB: { lang: 'pa', nativeName: 'ਪੰਜਾਬੀ', pair: ['pa', 'en'] },
  DL: { lang: 'hi', nativeName: 'हिन्दी', pair: ['hi', 'en'] },
  UP: { lang: 'hi', nativeName: 'हिन्दी', pair: ['hi', 'en'] },
  MP: { lang: 'hi', nativeName: 'हिन्दी', pair: ['hi', 'en'] },
  RJ: { lang: 'hi', nativeName: 'हिन्दी', pair: ['hi', 'en'] },
  BR: { lang: 'hi', nativeName: 'हिन्दी', pair: ['hi', 'en'] }
};

const DEFAULT_CONFIG = {
  lang: 'en',
  nativeName: 'English',
  pair: ['en', 'or']
};

export function middleware(request) {
  const { cookies, headers } = request;

  // 1. Check for caregiver manual override
  const savedLocale = cookies.get('smritisetu_locale')?.value;
  const isOverridden = cookies.get('smritisetu_manual_override')?.value === 'true';

  let activeLang = savedLocale;
  let activePair = DEFAULT_CONFIG.pair;
  let detectedSubdivision = 'IN';

  if (!savedLocale || !isOverridden) {
    // 2. Resolve region from Edge GeoIP Headers
    const regionCode = (
      headers.get('x-vercel-ip-subdivision') ||
      headers.get('cf-region-code') ||
      headers.get('cf-region') ||
      ''
    ).toUpperCase();

    detectedSubdivision = regionCode;

    if (regionCode && STATE_MAPPINGS[regionCode]) {
      const config = STATE_MAPPINGS[regionCode];
      activeLang = config.lang;
      activePair = config.pair;
    } else {
      activeLang = DEFAULT_CONFIG.lang;
      activePair = DEFAULT_CONFIG.pair;
    }
  }

  // 3. Clone response and set headers & cookies for zero-layout-shift hydration
  const response = NextResponse.next();

  response.headers.set('x-smritisetu-locale', activeLang || 'en');
  response.headers.set('x-smritisetu-pair', JSON.stringify(activePair));
  response.headers.set('x-smritisetu-region', detectedSubdivision);

  // Set persistent cookie if not yet set
  if (!savedLocale) {
    response.cookies.set('smritisetu_locale', activeLang || 'en', {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax'
    });
    response.cookies.set('smritisetu_region', detectedSubdivision, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax'
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
