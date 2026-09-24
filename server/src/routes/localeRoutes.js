import express from 'express';
import { STATE_LOCALE_MAP } from '../services/geoipService.js';

const router = express.Router();

/**
 * GET /api/v1/locale/detect
 * Returns current locale configuration detected from IP/headers or saved cookie.
 */
router.get('/detect', (req, res) => {
  res.json({
    status: 'success',
    data: req.localeInfo
  });
});

/**
 * POST /api/v1/locale/override
 * Allows caregiver or patient to manually select a language.
 * Sets manual override cookie so subsequent visits NEVER overwrite this choice.
 */
router.post('/override', (req, res) => {
  const { langCode, stateCode } = req.body;

  if (!langCode) {
    return res.status(400).json({ error: 'langCode is required.' });
  }

  // Update cookies
  res.cookie('smritisetu_locale', langCode, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });

  res.cookie('smritisetu_manual_override', 'true', {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });

  if (stateCode) {
    res.cookie('smritisetu_region', stateCode, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
  }

  res.json({
    status: 'success',
    message: 'Manual language preference saved securely.',
    activeLocale: langCode,
    manualOverride: true
  });
});

/**
 * GET /api/v1/locale/supported
 * Returns supported state and language metadata.
 */
router.get('/supported', (req, res) => {
  res.json({
    status: 'success',
    states: Object.values(STATE_LOCALE_MAP)
  });
});

export default router;
