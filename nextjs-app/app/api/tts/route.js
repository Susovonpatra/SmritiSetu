import { NextResponse } from 'next/server';

/**
 * Next.js Route Handler for Text-to-Speech (TTS) (JavaScript)
 * POST /api/tts
 */
export async function POST(req) {
  try {
    const { text, language = 'or', rate = 0.88, pitch = 1.05 } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }

    // Proxy to Azure Cloud Speech if configured
    const azureKey = process.env.AZURE_SPEECH_KEY;
    const azureRegion = process.env.AZURE_SPEECH_REGION;

    if (azureKey && azureRegion) {
      const voiceMap = {
        or: 'or-IN-SukantNeural',
        gu: 'gu-IN-DhwaniNeural',
        en: 'en-IN-NeerjaNeural',
        as: 'as-IN-Standard'
      };

      const voice = voiceMap[language] || voiceMap.en;
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="${voice}"><prosody rate="${rate}" pitch="+5%">${text}</prosody></voice></speak>`;

      const res = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
        },
        body: ssml
      });

      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return NextResponse.json({
          status: 'success',
          audio_base64: base64,
          format: 'audio/mp3',
          voice
        });
      }
    }

    // Fallback response instructing frontend Web Speech API
    return NextResponse.json({
      status: 'fallback',
      message: 'Using Web Speech API fallback',
      language,
      rate,
      pitch
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
