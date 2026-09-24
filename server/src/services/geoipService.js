/**
 * State-to-Language Mapping Table for India
 * Maps ISO 3166-2:IN subdivision codes and regional names to primary language,
 * native script display label, and English fallback.
 */
export const STATE_LOCALE_MAP = {
  // Primary Target States as specified
  OD: {
    stateCode: 'OD',
    stateName: 'Odisha',
    langCode: 'or',
    langCodeFull: 'or-IN',
    nativeName: 'ଓଡ଼ିଆ',
    englishName: 'Odia',
    voiceName: 'or-IN-SukantNeural',
    googleVoice: 'or-IN-Standard-A',
    pair: ['or', 'en']
  },
  OR: {
    // Legacy ISO code alias for Odisha
    stateCode: 'OD',
    stateName: 'Odisha',
    langCode: 'or',
    langCodeFull: 'or-IN',
    nativeName: 'ଓଡ଼ିଆ',
    englishName: 'Odia',
    voiceName: 'or-IN-SukantNeural',
    googleVoice: 'or-IN-Standard-A',
    pair: ['or', 'en']
  },
  GJ: {
    stateCode: 'GJ',
    stateName: 'Gujarat',
    langCode: 'gu',
    langCodeFull: 'gu-IN',
    nativeName: 'ગુજરાતી',
    englishName: 'Gujarati',
    voiceName: 'gu-IN-DhwaniNeural',
    googleVoice: 'gu-IN-Standard-A',
    pair: ['gu', 'en']
  },
  // Additional Indian States
  AS: {
    stateCode: 'AS',
    stateName: 'Assam',
    langCode: 'as',
    langCodeFull: 'as-IN',
    nativeName: 'অসমীয়া',
    englishName: 'Assamese',
    voiceName: 'as-IN-Standard',
    googleVoice: 'as-IN-Standard-A',
    pair: ['as', 'en']
  },
  WB: {
    stateCode: 'WB',
    stateName: 'West Bengal',
    langCode: 'bn',
    langCodeFull: 'bn-IN',
    nativeName: 'বাংলা',
    englishName: 'Bengali',
    voiceName: 'bn-IN-TanishaaNeural',
    googleVoice: 'bn-IN-Standard-A',
    pair: ['bn', 'en']
  },
  MH: {
    stateCode: 'MH',
    stateName: 'Maharashtra',
    langCode: 'mr',
    langCodeFull: 'mr-IN',
    nativeName: 'मराठी',
    englishName: 'Marathi',
    voiceName: 'mr-IN-AarohiNeural',
    googleVoice: 'mr-IN-Standard-A',
    pair: ['mr', 'en']
  },
  KA: {
    stateCode: 'KA',
    stateName: 'Karnataka',
    langCode: 'kn',
    langCodeFull: 'kn-IN',
    nativeName: 'ಕನ್ನಡ',
    englishName: 'Kannada',
    voiceName: 'kn-IN-GaganNeural',
    googleVoice: 'kn-IN-Standard-A',
    pair: ['kn', 'en']
  },
  TN: {
    stateCode: 'TN',
    stateName: 'Tamil Nadu',
    langCode: 'ta',
    langCodeFull: 'ta-IN',
    nativeName: 'தமிழ்',
    englishName: 'Tamil',
    voiceName: 'ta-IN-PallaviNeural',
    googleVoice: 'ta-IN-Standard-A',
    pair: ['ta', 'en']
  },
  KL: {
    stateCode: 'KL',
    stateName: 'Kerala',
    langCode: 'ml',
    langCodeFull: 'ml-IN',
    nativeName: 'മലയാളം',
    englishName: 'Malayalam',
    voiceName: 'ml-IN-SobhanaNeural',
    googleVoice: 'ml-IN-Standard-A',
    pair: ['ml', 'en']
  },
  TG: {
    stateCode: 'TG',
    stateName: 'Telangana',
    langCode: 'te',
    langCodeFull: 'te-IN',
    nativeName: 'తెలుగు',
    englishName: 'Telugu',
    voiceName: 'te-IN-ShrutiNeural',
    googleVoice: 'te-IN-Standard-A',
    pair: ['te', 'en']
  },
  AP: {
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    langCode: 'te',
    langCodeFull: 'te-IN',
    nativeName: 'తెలుగు',
    englishName: 'Telugu',
    voiceName: 'te-IN-ShrutiNeural',
    googleVoice: 'te-IN-Standard-A',
    pair: ['te', 'en']
  },
  PB: {
    stateCode: 'PB',
    stateName: 'Punjab',
    langCode: 'pa',
    langCodeFull: 'pa-IN',
    nativeName: 'ਪੰਜਾਬੀ',
    englishName: 'Punjabi',
    voiceName: 'pa-IN-OjasNeural',
    googleVoice: 'pa-IN-Standard-A',
    pair: ['pa', 'en']
  },
  // Hindi Belt
  DL: { stateCode: 'DL', stateName: 'Delhi', langCode: 'hi', langCodeFull: 'hi-IN', nativeName: 'हिन्दी', englishName: 'Hindi', voiceName: 'hi-IN-SwaraNeural', googleVoice: 'hi-IN-Standard-A', pair: ['hi', 'en'] },
  UP: { stateCode: 'UP', stateName: 'Uttar Pradesh', langCode: 'hi', langCodeFull: 'hi-IN', nativeName: 'हिन्दी', englishName: 'Hindi', voiceName: 'hi-IN-SwaraNeural', googleVoice: 'hi-IN-Standard-A', pair: ['hi', 'en'] },
  MP: { stateCode: 'MP', stateName: 'Madhya Pradesh', langCode: 'hi', langCodeFull: 'hi-IN', nativeName: 'हिन्दी', englishName: 'Hindi', voiceName: 'hi-IN-SwaraNeural', googleVoice: 'hi-IN-Standard-A', pair: ['hi', 'en'] },
  RJ: { stateCode: 'RJ', stateName: 'Rajasthan', langCode: 'hi', langCodeFull: 'hi-IN', nativeName: 'हिन्दी', englishName: 'Hindi', voiceName: 'hi-IN-SwaraNeural', googleVoice: 'hi-IN-Standard-A', pair: ['hi', 'en'] },
  BR: { stateCode: 'BR', stateName: 'Bihar', langCode: 'hi', langCodeFull: 'hi-IN', nativeName: 'हिन्दी', englishName: 'Hindi', voiceName: 'hi-IN-SwaraNeural', googleVoice: 'hi-IN-Standard-A', pair: ['hi', 'en'] }
};

export const DEFAULT_FALLBACK_LOCALE = {
  stateCode: 'IN',
  stateName: 'India (Standard)',
  langCode: 'en',
  langCodeFull: 'en-IN',
  nativeName: 'English',
  englishName: 'English',
  voiceName: 'en-IN-NeerjaNeural',
  googleVoice: 'en-IN-Wavenet-D',
  pair: ['en', 'or'] // Provides a secondary toggle option
};

/**
 * Resolves client IP address from various proxies, reverse proxies, and socket info.
 */
export function extractClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const list = forwarded.split(',');
    return list[0].trim();
  }
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
}

/**
 * Resolves region subdivision code from edge headers or MaxMind
 */
export function resolveRegionFromRequest(req) {
  // 1. Direct Edge Provider Headers (Cloudflare, Vercel, Fastly, AWS CloudFront)
  const cfRegion = req.headers['cf-region-code'] || req.headers['cf-region'];
  const vercelRegion = req.headers['x-vercel-ip-subdivision'];
  const cloudfrontRegion = req.headers['cloudfront-viewer-country-region'];

  const rawRegion = cfRegion || vercelRegion || cloudfrontRegion;
  if (rawRegion) {
    const upper = String(rawRegion).trim().toUpperCase();
    if (STATE_LOCALE_MAP[upper]) {
      return {
        ...STATE_LOCALE_MAP[upper],
        isDetected: true,
        source: 'edge_header'
      };
    }
  }

  // 2. Client IP Resolution
  const ip = extractClientIp(req);

  // Check if private or loopback
  if (isPrivateOrLoopbackIp(ip)) {
    // If a test query parameter or custom header is passed for development/testing:
    const overrideRegion = (req.query?.testRegion || req.headers['x-test-region'] || '').toUpperCase();
    if (overrideRegion && STATE_LOCALE_MAP[overrideRegion]) {
      return {
        ...STATE_LOCALE_MAP[overrideRegion],
        clientIp: ip,
        isDetected: true,
        source: 'test_override'
      };
    }

    // Default safe fallback for localhost/development
    return {
      ...DEFAULT_FALLBACK_LOCALE,
      clientIp: ip,
      isDetected: false,
      source: 'localhost_fallback'
    };
  }

  // 3. Known Sample IP Range Mapping for Indian ISPs (Bhubaneswar, Ahmedabad, Guwahati, etc.)
  const knownMapping = resolveKnownIndianSubnet(ip);
  if (knownMapping) {
    return {
      ...knownMapping,
      clientIp: ip,
      isDetected: true,
      source: 'subnet_lookup'
    };
  }

  // Fallback to default
  return {
    ...DEFAULT_FALLBACK_LOCALE,
    clientIp: ip,
    isDetected: false,
    source: 'default_fallback'
  };
}

/**
 * Determines whether an IP is loopback, link-local, or private RFC 1918.
 */
function isPrivateOrLoopbackIp(ip) {
  if (!ip) return true;
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.0.0.1')) return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    const second = parseInt(parts[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

/**
 * Known IP subnet ranges for major Indian cities for testing and zero-setup offline demos.
 */
function resolveKnownIndianSubnet(ip) {
  // Test IPs for Odisha (BSNL Odisha, RailTel Bhubaneswar)
  if (ip.startsWith('117.239.') || ip.startsWith('117.240.') || ip.startsWith('43.242.160.')) {
    return STATE_LOCALE_MAP.OD;
  }
  // Test IPs for Gujarat (GTPL Ahmedabad, Jio Gujarat)
  if (ip.startsWith('103.240.232.') || ip.startsWith('103.21.58.') || ip.startsWith('49.36.')) {
    return STATE_LOCALE_MAP.GJ;
  }
  // Test IPs for Assam (Guwahati)
  if (ip.startsWith('117.236.') || ip.startsWith('103.206.')) {
    return STATE_LOCALE_MAP.AS;
  }
  return null;
}
