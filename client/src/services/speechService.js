/**
 * Resilient Audio Engine
 * - Attempts remote TTS call to FastAPI /api/v1/tts proxying Bhashini/IndicTTS with 1500ms abort timeout
 * - Falls back instantly to browser synthesis / local audio if offline or timed out
 */

const API_BASE = 'http://127.0.0.1:8000';

export async function speakPrompt(text, dialect = 'Assamese', onFinished) {
  const languageCode = dialect === 'Manipuri' ? 'mni' : (dialect === 'Assamese' ? 'as' : 'en');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  let remoteSuccess = false;

  try {
    const response = await fetch(`${API_BASE}/api/v1/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language: languageCode,
        gender: 'female'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.audio_base64) {
        remoteSuccess = true;
        const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
        audio.onended = () => {
          if (onFinished) onFinished();
        };
        await audio.play();
        return;
      }
    }
  } catch (err) {
    // 1500ms timeout or offline abort
    // proceed to resilient fallback
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback: Instant browser speech synthesis or synthesized audio tone
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85; // slightly slower for elderly comprehension
    utterance.pitch = 1.0;
    
    // Choose appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    const regionalVoice = voices.find(v => v.lang.startsWith(languageCode) || v.lang.includes('IN'));
    if (regionalVoice) {
      utterance.voice = regionalVoice;
    }

    utterance.onend = () => {
      if (onFinished) onFinished();
    };
    utterance.onerror = () => {
      if (onFinished) onFinished();
    };

    window.speechSynthesis.speak(utterance);
  } else {
    if (onFinished) onFinished();
  }
}
