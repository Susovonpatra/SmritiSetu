import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TRANSLATIONS } from '../locales/translations';

const LocaleContext = createContext(null);

const STORAGE_KEY_LOCALE = 'smritisetu_locale';
const STORAGE_KEY_REGION = 'smritisetu_region';
const STORAGE_KEY_OVERRIDE = 'smritisetu_manual_override';

// Supported fallback language map
const REGION_PAIR_MAP = {
  OD: { primary: 'or', secondary: 'en', native: 'ଓଡ଼ିଆ', name: 'Odisha' },
  OR: { primary: 'or', secondary: 'en', native: 'ଓଡ଼ିଆ', name: 'Odisha' },
  GJ: { primary: 'gu', secondary: 'en', native: 'ગુજરાતી', name: 'Gujarat' },
  AS: { primary: 'as', secondary: 'en', native: 'অসমীয়া', name: 'Assam' },
  WB: { primary: 'bn', secondary: 'en', native: 'বাংলা', name: 'West Bengal' },
  MH: { primary: 'mr', secondary: 'en', native: 'मराठी', name: 'Maharashtra' }
};

export function LocaleProvider({ children }) {
  const [activeLang, setActiveLang] = useState('or'); // Default to target Regional (e.g. Odia)
  const [availablePair, setAvailablePair] = useState(['or', 'en']);
  const [regionInfo, setRegionInfo] = useState({
    stateCode: 'OD',
    stateName: 'Odisha',
    nativeName: 'ଓଡ଼ିଆ',
    englishName: 'Odia',
    isDetected: true,
    detectionSource: 'initial'
  });
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from cookies, localStorage, or server-side GeoIP endpoint
  useEffect(() => {
    async function initLocale() {
      // 1. Check local storage for persistent caregiver choices
      const savedOverride = localStorage.getItem(STORAGE_KEY_OVERRIDE) === 'true';
      const savedLocale = localStorage.getItem(STORAGE_KEY_LOCALE);
      const savedRegion = localStorage.getItem(STORAGE_KEY_REGION);

      if (savedOverride && savedLocale) {
        setIsManualOverride(true);
        setActiveLang(savedLocale);
        const regionMeta = REGION_PAIR_MAP[savedRegion] || REGION_PAIR_MAP.OD;
        setAvailablePair([regionMeta.primary, 'en']);
        setRegionInfo({
          stateCode: savedRegion || 'OD',
          stateName: regionMeta.name,
          nativeName: regionMeta.native,
          englishName: regionMeta.primary,
          isDetected: false,
          detectionSource: 'localStorage_override'
        });
        setIsLoading(false);
        return;
      }

      // 2. Query GeoIP API from Express server (if running) or fallback
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/locale/detect', {
          credentials: 'include'
        });

        if (res.ok) {
          const body = await res.json();
          const data = body.data;

          if (data && data.pair) {
            setActiveLang(data.activeLocale || 'or');
            setAvailablePair(data.pair);
            setRegionInfo({
              stateCode: data.stateCode,
              stateName: data.stateName,
              nativeName: data.nativeName,
              englishName: data.englishName,
              isDetected: data.isDetected,
              detectionSource: data.detectionSource
            });
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        // Express server might not be running yet; fallback to browser / sensible defaults
      }

      // 3. Fallback: Default to Odisha (or) + English (en) pair as specified
      setActiveLang('or');
      setAvailablePair(['or', 'en']);
      setRegionInfo({
        stateCode: 'OD',
        stateName: 'Odisha',
        nativeName: 'ଓଡ଼ିଆ',
        englishName: 'Odia',
        isDetected: false,
        detectionSource: 'default_odisha'
      });
      setIsLoading(false);
    }

    initLocale();
  }, []);

  // Manual Toggle function (switches between primary and secondary pair)
  const toggleLanguage = useCallback(() => {
    setActiveLang((prev) => {
      const next = prev === availablePair[0] ? availablePair[1] : availablePair[0];

      // Mark manual override so GeoIP doesn't revert user preference
      setIsManualOverride(true);
      localStorage.setItem(STORAGE_KEY_LOCALE, next);
      localStorage.setItem(STORAGE_KEY_OVERRIDE, 'true');
      localStorage.setItem(STORAGE_KEY_REGION, regionInfo.stateCode);

      // Notify backend if connected
      fetch('http://127.0.0.1:8000/api/v1/locale/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ langCode: next, stateCode: regionInfo.stateCode })
      }).catch(() => {});

      return next;
    });
  }, [availablePair, regionInfo]);

  // Direct language setter
  const setLanguage = useCallback((lang) => {
    setActiveLang(lang);
    setIsManualOverride(true);
    localStorage.setItem(STORAGE_KEY_LOCALE, lang);
    localStorage.setItem(STORAGE_KEY_OVERRIDE, 'true');
  }, []);

  // Development helper to simulate different regions (Odisha vs Gujarat vs Assam)
  const simulateRegion = useCallback((stateCode) => {
    const target = REGION_PAIR_MAP[stateCode] || REGION_PAIR_MAP.OD;
    setActiveLang(target.primary);
    setAvailablePair([target.primary, 'en']);
    setRegionInfo({
      stateCode,
      stateName: target.name,
      nativeName: target.native,
      englishName: target.primary,
      isDetected: true,
      detectionSource: 'simulation'
    });
    localStorage.setItem(STORAGE_KEY_LOCALE, target.primary);
    localStorage.setItem(STORAGE_KEY_REGION, stateCode);
    localStorage.setItem(STORAGE_KEY_OVERRIDE, 'false'); // reset override
  }, []);

  // Translation helper function
  const t = useCallback((path) => {
    const keys = path.split('.');
    const dict = TRANSLATIONS[activeLang] || TRANSLATIONS.en;
    let curr = dict;
    for (const k of keys) {
      if (!curr || typeof curr !== 'object') break;
      curr = curr[k];
    }
    if (typeof curr === 'string') return curr;

    // Fallback to English dictionary
    let fallback = TRANSLATIONS.en;
    for (const k of keys) {
      if (!fallback || typeof fallback !== 'object') return path;
      fallback = fallback[k];
    }
    return typeof fallback === 'string' ? fallback : path;
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
        simulateRegion,
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
