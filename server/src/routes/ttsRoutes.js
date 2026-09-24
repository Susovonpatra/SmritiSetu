import express from 'express';

const router = express.Router();

/**
 * Voice configurations for Azure / Google Cloud TTS
 */
const CLOUD_VOICE_MAP = {
  or: {
    languageCode: 'or-IN',
    azureVoice: 'or-IN-SukantNeural',
    azureAltVoice: 'or-IN-SubhasiniNeural',
    googleVoice: 'or-IN-Standard-A',
    displayName: 'Odia (Sukant Neural)'
  },
  gu: {
    languageCode: 'gu-IN',
    azureVoice: 'gu-IN-DhwaniNeural',
    azureAltVoice: 'gu-IN-NiranjanNeural',
    googleVoice: 'gu-IN-Standard-A',
    displayName: 'Gujarati (Dhwani Neural)'
  },
  en: {
    languageCode: 'en-IN',
    azureVoice: 'en-IN-NeerjaNeural',
    azureAltVoice: 'en-IN-PrabhatNeural',
    googleVoice: 'en-IN-Wavenet-D',
    displayName: 'Indian English (Neerja Neural)'
  },
  as: {
    languageCode: 'as-IN',
    azureVoice: 'as-IN-Standard',
    googleVoice: 'as-IN-Standard-A',
    displayName: 'Assamese (Standard)'
  }
};

/**
 * POST /api/v1/tts
 * Synthesizes text to speech with dementia-tuned acoustic parameters:
 * - Slower speech rate (0.88x)
 * - Clear articulation / slightly elevated pitch (1.05x)
 */
router.post('/', async (req, res) => {
  const { text, language = 'en', gender = 'female', rate = 0.88, pitch = 1.05 } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required for TTS synthesis.' });
  }

  const voiceProfile = CLOUD_VOICE_MAP[language] || CLOUD_VOICE_MAP.en;

  // Check if Azure / Google Cloud credentials are configured in environment
  const azureKey = process.env.AZURE_SPEECH_KEY;
  const azureRegion = process.env.AZURE_SPEECH_REGION;

  if (azureKey && azureRegion) {
    try {
      // Azure Speech REST synthesis with SSML
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${voiceProfile.languageCode}">
          <voice name="${voiceProfile.azureVoice}">
            <prosody rate="${rate}" pitch="+5%">${escapeXml(text)}</prosody>
          </voice>
        </speak>
      `.trim();

      const response = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'SmritiSetuDementiaEngine'
        },
        body: ssml
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        return res.json({
          status: 'success',
          provider: 'azure_cloud_neural',
          voice: voiceProfile.azureVoice,
          audio_base64: base64Audio,
          format: 'audio/mp3',
          rate,
          pitch
        });
      }
    } catch (err) {
      console.warn('Azure TTS synthesis failed, switching to local fallback:', err.message);
    }
  }

  // Graceful fallback response: Tells client to invoke local Web Speech API
  return res.json({
    status: 'fallback',
    message: 'Cloud TTS bypassed; client will use tuned Web Speech API synthesis.',
    provider: 'web_speech_api_fallback',
    languageCode: voiceProfile.languageCode,
    suggestedVoice: voiceProfile.displayName,
    text,
    rate,
    pitch
  });
});

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export default router;
