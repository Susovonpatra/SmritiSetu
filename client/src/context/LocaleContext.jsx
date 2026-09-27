import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TRANSLATIONS } from '../locales/translations';

const LocaleContext = createContext(null);

const STORAGE_KEY_LOCALE = 'smritisetu_locale';
const STORAGE_KEY_REGION = 'smritisetu_region';
const STORAGE_KEY_OVERRIDE = 'smritisetu_manual_override';

// Comprehensive Indian State Language & Region Map
const REGION_PAIR_MAP = {
  OD: { primary: 'or', secondary: 'en', native: 'ଓଡ଼ିଆ', name: 'Odisha' },
  OR: { primary: 'or', secondary: 'en', native: 'ଓଡ଼ିଆ', name: 'Odisha' },
  ODISHA: { primary: 'or', secondary: 'en', native: 'ଓଡ଼ିଆ', name: 'Odisha' },
  ORISSA: { primary: 'or', secondary: 'en', native: 'ଓଡ଼ିଆ', name: 'Odisha' },
  
  GJ: { primary: 'gu', secondary: 'en', native: 'ગુજરાતી', name: 'Gujarat' },
  GUJARAT: { primary: 'gu', secondary: 'en', native: 'ગુજરાતી', name: 'Gujarat' },
  
  AS: { primary: 'as', secondary: 'en', native: 'অসমীয়া', name: 'Assam' },
  ASSAM: { primary: 'as', secondary: 'en', native: 'অসমীয়া', name: 'Assam' },
  
  WB: { primary: 'or', secondary: 'en', native: 'ଓଡ଼ିଆ', name: 'Odisha' }, // default east pair
  MH: { primary: 'or', secondary: 'en', native: 'ଓଡ଼ିଆ', name: 'Odisha' },
};

export function LocaleProvider({ children }) {
  const [activeLang, setActiveLang] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_LOCALE) || 'or';
  });
  const [availablePair, setAvailablePair] = useState(['or', 'en']);
  const [regionInfo, setRegionInfo] = useState({
    stateCode: 'OD',
    stateName: 'Odisha',
    nativeName: 'ଓଡ଼ିଆ',
    englishName: 'Odia',
    isDetected: false,
    detectionSource: 'initial'
  });
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and automatically detect region from IP
  useEffect(() => {
    async function initAndDetectIP() {
      // Check saved override first
      const savedOverride = localStorage.getItem(STORAGE_KEY_OVERRIDE) === 'true';
      const savedLocale = localStorage.getItem(STORAGE_KEY_LOCALE);
      const savedRegion = localStorage.getItem(STORAGE_KEY_REGION);

      if (savedOverride && savedLocale) {
        setIsManualOverride(true);
        setActiveLang(savedLocale);
      }

      // Try automatic IP Geolocation
      try {
        // 1. Try public IP API for real-time IP region resolution
        const ipRes = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          const regionName = (ipData.region || ipData.region_code || '').toUpperCase();
          const matched = REGION_PAIR_MAP[regionName] || REGION_PAIR_MAP[ipData.region_code] || REGION_PAIR_MAP.OD;

          setRegionInfo({
            stateCode: matched.primary.toUpperCase(),
            stateName: ipData.region || matched.name,
            nativeName: matched.native,
            englishName: matched.primary,
            isDetected: true,
            detectionSource: 'ipapi'
          });
          setAvailablePair([matched.primary, 'en']);
          if (!savedOverride) {
            setActiveLang(matched.primary);
          }
          setIsLoading(false);
          return;
        }
      } catch (err) {
        // Fallback to backend / API endpoint
        try {
          const res = await fetch('http://127.0.0.1:8000/api/v1/locale/detect', { credentials: 'include' });
          if (res.ok) {
            const body = await res.json();
            const data = body.data;
            if (data) {
              setRegionInfo({
                stateCode: data.stateCode || 'OD',
                stateName: data.stateName || 'Odisha',
                nativeName: data.nativeName || 'ଓଡ଼ିଆ',
                englishName: data.englishName || 'Odia',
                isDetected: true,
                detectionSource: 'backend_geoip'
              });
              if (data.pair) setAvailablePair(data.pair);
              if (!savedOverride) setActiveLang(data.activeLocale || 'or');
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          // Default fallback
        }
      }

      // Default fallback: Odisha (Odia)
      const defaultMeta = REGION_PAIR_MAP.OD;
      setRegionInfo({
        stateCode: 'OD',
        stateName: 'Odisha',
        nativeName: defaultMeta.native,
        englishName: 'Odia',
        isDetected: false,
        detectionSource: 'default_fallback'
      });
      setAvailablePair(['or', 'en']);
      if (!savedOverride) {
        setActiveLang('or');
      }
      setIsLoading(false);
    }

    initAndDetectIP();
  }, []);

  // Language Toggle: Switches between Regional and English
  const toggleLanguage = useCallback(() => {
    setActiveLang((prev) => {
      const primary = availablePair[0] || 'or';
      const secondary = availablePair[1] || 'en';
      const next = prev === primary ? secondary : primary;

      setIsManualOverride(true);
      localStorage.setItem(STORAGE_KEY_LOCALE, next);
      localStorage.setItem(STORAGE_KEY_OVERRIDE, 'true');
      return next;
    });
  }, [availablePair]);

  // Direct Language Setter
  const setLanguage = useCallback((lang) => {
    setActiveLang(lang);
    setIsManualOverride(true);
    localStorage.setItem(STORAGE_KEY_LOCALE, lang);
    localStorage.setItem(STORAGE_KEY_OVERRIDE, 'true');
  }, []);

  // Translation Helper Function
  const t = useCallback((path, defaultVal = '') => {
    if (!path) return '';
    const keys = path.split('.');
    
    // 1. Try active selected language
    const currentDict = TRANSLATIONS[activeLang] || TRANSLATIONS.or;
    let curr = currentDict;
    for (const k of keys) {
      if (!curr || typeof curr !== 'object') {
        curr = undefined;
        break;
      }
      curr = curr[k];
    }
    if (typeof curr === 'string' && curr.trim() !== '') return curr;

    // 2. Fallback to English dictionary
    const fallbackDict = TRANSLATIONS.en || {};
    let fallback = fallbackDict;
    for (const k of keys) {
      if (!fallback || typeof fallback !== 'object') {
        fallback = undefined;
        break;
      }
      fallback = fallback[k];
    }
    if (typeof fallback === 'string' && fallback.trim() !== '') return fallback;

    return defaultVal || path;
  }, [activeLang]);

  return (
    <LocaleContext.Provider
      value={{
        activeLang,
        availablePair,
        regionInfo,
        isManualOverride,
        isLoading,
        toggleLanguage,
        setLanguage,
        t
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
