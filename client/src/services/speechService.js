/**
 * Backward-compatible wrapper around centralized speechController.
 * Ensures existing components calling speakPrompt continue to function
 * with the new multi-lingual (Odia, Gujarati, Assamese, English) TTS engine.
 */

import { speakCognitivePrompt, cancelSpeech } from './speechController';

export { cancelSpeech };

export async function speakPrompt(text, dialect = 'Assamese', onFinished) {
  let langCode = 'en';

  if (typeof dialect === 'string') {
    const d = dialect.toLowerCase();
    if (d === 'odia' || d === 'or') langCode = 'or';
    else if (d === 'gujarati' || d === 'gu') langCode = 'gu';
    else if (d === 'assamese' || d === 'as') langCode = 'as';
    else if (d === 'manipuri' || d === 'mni') langCode = 'mni';
    else langCode = 'en';
  }

  return speakCognitivePrompt(text, langCode, onFinished);
}
