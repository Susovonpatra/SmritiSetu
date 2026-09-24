/**
 * Centralized Bilingual Text-to-Speech (TTS) Controller for Dementia Patients
 * - Acoustic Tuning: 0.88x speech rate, clear articulation, elevated pitch (+5%).
 * - Provider Hierarchy: Express / Cloud TTS -> Local Web Speech API Fallback.
 * - Handles interruptions: Cancels ongoing utterance before speaking.
 */

const EXPRESS_TTS_ENDPOINT = 'http://127.0.0.1:5001/api/v1/tts';
const FASTAPI_TTS_ENDPOINT = 'http://127.0.0.1:8000/api/v1/tts';

// Audio element singleton for remote cloud playback
let currentAudioElement = null;

// Voice map configuration
export const VOICE_PROFILES = {
  or: {
    langCode: 'or-IN',
    displayName: 'Odia (ଓଡ଼ିଆ)',
    azureVoice: 'or-IN-SukantNeural',
    preferredLocalVoicePrefixes: ['or-IN', 'or', 'hi-IN', 'en-IN']
  },
  gu: {
    langCode: 'gu-IN',
    displayName: 'Gujarati (ગુજરાતી)',
    azureVoice: 'gu-IN-DhwaniNeural',
    preferredLocalVoicePrefixes: ['gu-IN', 'gu', 'hi-IN', 'en-IN']
  },
  as: {
    langCode: 'as-IN',
    displayName: 'Assamese (অসমীয়া)',
    azureVoice: 'as-IN-Standard',
    preferredLocalVoicePrefixes: ['as-IN', 'as', 'bn-IN', 'en-IN']
  },
  en: {
    langCode: 'en-IN',
    displayName: 'Indian English',
    azureVoice: 'en-IN-NeerjaNeural',
    preferredLocalVoicePrefixes: ['en-IN', 'en-GB', 'en']
  }
};

/**
 * Main TTS speaker function
 * @param {string} text - The cognitive prompt or instruction to speak
 * @param {string} langCode - 'or', 'gu', 'as', or 'en'
 * @param {Function} onFinished - Optional callback when audio ends
 * @param {Object} options - Custom rate/pitch overrides
 */
export async function speakCognitivePrompt(text, langCode = 'or', onFinished, options = {}) {
  const rate = options.rate || 0.88;
  const pitch = options.pitch || 1.05;

  // 1. Immediately cancel any currently playing audio or browser synthesis
  cancelSpeech();

  const profile = VOICE_PROFILES[langCode] || VOICE_PROFILES.en;

  // 2. Attempt Cloud Synthesis via Express Server (with 1200ms abort timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch(EXPRESS_TTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language: langCode,
        rate,
        pitch
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.audio_base64) {
        currentAudioElement = new Audio(`data:${data.format || 'audio/mp3'};base64,${data.audio_base64}`);
        currentAudioElement.onended = () => {
          currentAudioElement = null;
          if (onFinished) onFinished();
        };
        currentAudioElement.onerror = () => {
          fallbackWebSpeech(text, profile, rate, pitch, onFinished);
        };
        await currentAudioElement.play();
        return;
      }
    }
  } catch (err) {
    // Timeout or network unreachable: seamlessly fall through to browser synthesis
  } finally {
    clearTimeout(timeoutId);
  }

  // 3. Resilient Secondary Fallback: Web Speech API
  fallbackWebSpeech(text, profile, rate, pitch, onFinished);
}

/**
 * Stops all ongoing speech (both HTML5 Audio and Web Speech API)
 */
export function cancelSpeech() {
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Browser Web Speech API fallback with dementia-optimized acoustics
 */
function fallbackWebSpeech(text, profile, rate, pitch, onFinished) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onFinished) onFinished();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = profile.langCode;
  utterance.rate = rate; // 0.88x (dementia comprehension pacing)
  utterance.pitch = pitch; // 1.05x (clear articulation)

  // Find best matching installed regional voice
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
    if (onFinished) onFinished();
  };

  utterance.onerror = () => {
    if (onFinished) onFinished();
  };

  window.speechSynthesis.speak(utterance);
}
