/**
 * Centralized Bilingual Text-to-Speech (TTS) Controller for Dementia Patients
 * - Acoustic Tuning: 0.88x speech rate, clear articulation, elevated pitch (+5%).
 * - Provider Hierarchy: Express / Cloud TTS -> Local Web Speech API Fallback.
 * - Handles interruptions: Cancels ongoing utterance before speaking.
 */

const TTS_ENDPOINT = 'http://127.0.0.1:8000/api/v1/tts';


// Audio element and concurrency control singleton
let currentAudioElement = null;
let activeAbortController = null;
let currentUtteranceId = 0;

// Voice map configuration for local browser fallback
export const VOICE_PROFILES = {
  hi: { langCode: 'hi-IN', displayName: 'Hindi (हिन्दी)', preferredLocalVoicePrefixes: ['hi-IN', 'hi', 'en-IN'] },
  bn: { langCode: 'bn-IN', displayName: 'Bengali (বাংলা)', preferredLocalVoicePrefixes: ['bn-IN', 'bn', 'hi-IN', 'en-IN'] },
  ta: { langCode: 'ta-IN', displayName: 'Tamil (தமிழ்)', preferredLocalVoicePrefixes: ['ta-IN', 'ta', 'en-IN'] },
  te: { langCode: 'te-IN', displayName: 'Telugu (తెలుగు)', preferredLocalVoicePrefixes: ['te-IN', 'te', 'en-IN'] },
  mr: { langCode: 'mr-IN', displayName: 'Marathi (मराठी)', preferredLocalVoicePrefixes: ['mr-IN', 'mr', 'hi-IN', 'en-IN'] },
  gu: { langCode: 'gu-IN', displayName: 'Gujarati (ગુજરાતી)', preferredLocalVoicePrefixes: ['gu-IN', 'gu', 'hi-IN', 'en-IN'] },
  kn: { langCode: 'kn-IN', displayName: 'Kannada (ಕನ್ನಡ)', preferredLocalVoicePrefixes: ['kn-IN', 'kn', 'en-IN'] },
  ml: { langCode: 'ml-IN', displayName: 'Malayalam (മലയാളം)', preferredLocalVoicePrefixes: ['ml-IN', 'ml', 'en-IN'] },
  or: { langCode: 'or-IN', displayName: 'Odia (ଓଡ଼ିଆ)', preferredLocalVoicePrefixes: ['or-IN', 'or', 'hi-IN', 'en-IN'] },
  pa: { langCode: 'pa-IN', displayName: 'Punjabi (ਪੰਜਾਬੀ)', preferredLocalVoicePrefixes: ['pa-IN', 'pa', 'hi-IN', 'en-IN'] },
  as: { langCode: 'as-IN', displayName: 'Assamese (অসমীয়া)', preferredLocalVoicePrefixes: ['as-IN', 'as', 'bn-IN', 'en-IN'] },
  en: { langCode: 'en-IN', displayName: 'Indian English', preferredLocalVoicePrefixes: ['en-IN', 'en-GB', 'en'] }
};

/**
 * Main TTS speaker function with zero-overlap concurrency lock
 * @param {string} text - The cognitive prompt or instruction to speak
 * @param {string} langCode - ISO language code
 * @param {Function} onFinished - Optional callback when audio ends
 * @param {Object} options - Custom rate, pitch, and gender overrides
 */
export async function speakCognitivePrompt(text, langCode = 'hi', onFinished, options = {}) {
  const rate = options.rate || 0.88;
  const pitch = options.pitch || 1.05;
  const gender = options.gender || 'female';

  // 1. Immediately cancel ANY playing audio, browser speech, or in-flight network requests
  cancelSpeech();

  // 2. Lock to this specific utterance request
  const thisUtteranceId = currentUtteranceId;
  const profile = VOICE_PROFILES[langCode] || VOICE_PROFILES.en;

  // 3. Create fresh AbortController for this fetch
  const controller = new AbortController();
  activeAbortController = controller;

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 5000);

  try {
    const response = await fetch(TTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language: langCode,
        gender,
        rate,
        pitch
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // If another speech request was initiated while waiting, discard this one
    if (thisUtteranceId !== currentUtteranceId) {
      return;
    }

    if (response.ok) {
      const data = await response.json();
      if (thisUtteranceId !== currentUtteranceId) return;

      if (data.status === 'success' && data.audio_base64) {
        // Stop any browser speech before playing cloud audio
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }

        const audio = new Audio(`data:${data.format || 'audio/mp3'};base64,${data.audio_base64}`);
        currentAudioElement = audio;

        audio.onended = () => {
          if (currentAudioElement === audio) {
            currentAudioElement = null;
          }
          if (thisUtteranceId === currentUtteranceId && onFinished) {
            onFinished();
          }
        };

        audio.onerror = () => {
          if (thisUtteranceId === currentUtteranceId) {
            fallbackWebSpeech(text, profile, rate, pitch, onFinished, thisUtteranceId);
          }
        };

        await audio.play();
        return;
      }
    }
  } catch (err) {
    // Aborted or network error: will fall through to local Web Speech if still current
  } finally {
    clearTimeout(timeoutId);
  }

  // 4. Fallback only if this request is still the active one
  if (thisUtteranceId === currentUtteranceId) {
    fallbackWebSpeech(text, profile, rate, pitch, onFinished, thisUtteranceId);
  }
}

/**
 * Atomically stops all speech and cancels all pending requests
 */
export function cancelSpeech() {
  // Invalidate any active utterance
  currentUtteranceId += 1;

  // Abort ongoing HTTP fetch
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch (_) {}
    activeAbortController = null;
  }

  // Stop HTML5 Audio
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
      currentAudioElement.src = '';
    } catch (_) {}
    currentAudioElement = null;
  }

  // Cancel Web Speech API
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
}

/**
 * Browser Web Speech API fallback with dementia-optimized acoustics
 */
function fallbackWebSpeech(text, profile, rate, pitch, onFinished, utteranceId) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onFinished) onFinished();
    return;
  }

  // Double-check utterance validity
  if (utteranceId !== undefined && utteranceId !== currentUtteranceId) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = profile.langCode;
  utterance.rate = rate;
  utterance.pitch = pitch;

  // Find best matching regional voice
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    let matchedVoice = null;
    for (const prefix of profile.preferredLocalVoicePrefixes) {
      matchedVoice = voices.find(v => v.lang.startsWith(prefix) || v.lang.includes(prefix));
      if (matchedVoice) break;
    }
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
  }

  utterance.onend = () => {
    if (utteranceId === undefined || utteranceId === currentUtteranceId) {
      if (onFinished) onFinished();
    }
  };

  utterance.onerror = () => {
    if (utteranceId === undefined || utteranceId === currentUtteranceId) {
      if (onFinished) onFinished();
    }
  };

  window.speechSynthesis.speak(utterance);
}

