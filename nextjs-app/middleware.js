import { NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware for Dementia Localization (JavaScript)
 * - Extracts client IP & region headers (Cloudflare, Vercel, MaxMind)
 * - Resolves Indian state subdivision (OD -> or, GJ -> gu)
 * - Injects resolved locale into request headers for zero-layout-shift SSR
 * - Sets persistent cookie without overriding caregiver choices
 */

const STATE_MAPPINGS = {
  OD: { lang: 'or', nativeName: 'ଓଡ଼ିଆ', pair: ['or', 'en'] },
  OR: { lang: 'or', nativeName: 'ଓଡ଼ିଆ', pair: ['or', 'en'] },
  GJ: { lang: 'gu', nativeName: 'ગુજરાતી', pair: ['gu', 'en'] },
  AS: { lang: 'as', nativeName: 'অসমীয়া', pair: ['as', 'en'] },
  WB: { lang: 'bn', nativeName: 'বাংলা', pair: ['bn', 'en'] },
  MH: { lang: 'mr', nativeName: 'मराठी', pair: ['mr', 'en'] },
  DL: { lang: 'hi', nativeName: 'हिन्दी', pair: ['hi', 'en'] }
};

export function middleware(request) {
  const { cookies, headers } = request;

  const savedLocale = cookies.get('smritisetu_locale')?.value;
  const isOverridden = cookies.get('smritisetu_manual_override')?.value === 'true';

  let activeLang = savedLocale;
  let activePair = ['or', 'en'];
  let regionCode = 'OD';

  if (!savedLocale || !isOverridden) {
    const rawSubdivision = (
      headers.get('x-vercel-ip-subdivision') ||
      headers.get('cf-region-code') ||
      headers.get('cf-region') ||
      'OD'
    ).toUpperCase();

    regionCode = rawSubdivision;
    const config = STATE_MAPPINGS[rawSubdivision] || STATE_MAPPINGS.OD;
    activeLang = config.lang;
    activePair = config.pair;
  }

  const response = NextResponse.next();

  response.headers.set('x-smritisetu-locale', activeLang || 'or');
  response.headers.set('x-smritisetu-pair', JSON.stringify(activePair));
  response.headers.set('x-smritisetu-region', regionCode);

  if (!savedLocale) {
    response.cookies.set('smritisetu_locale', activeLang || 'or', {
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
