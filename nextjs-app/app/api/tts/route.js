import { NextResponse } from 'next/server';

/**
 * Next.js Route Handler for Text-to-Speech via ElevenLabs
 * POST /api/tts
 */

const VOICE_MAP = {
  or: 'pFZP5JQG7iQjIQuC4Bku',  // Lily – warm female, multilingual
  gu: 'pFZP5JQG7iQjIQuC4Bku',
  en: 'EXAVITQu4vr4xnSDxMaL',  // Sarah – clear female
  as: 'pFZP5JQG7iQjIQuC4Bku',
  hi: 'pFZP5JQG7iQjIQuC4Bku',
};

export async function POST(req) {
  try {
    const { text, language = 'or', rate = 0.88, pitch = 1.05 } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = VOICE_MAP[language] || VOICE_MAP.en;

    if (elevenLabsKey) {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenLabsKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.6,
              similarity_boost: 0.75,
              style: 0.15,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return NextResponse.json({
          status: 'success',
          provider: 'elevenlabs',
          audio_base64: base64,
          format: 'audio/mp3',
          voice: voiceId,
        });
      }
    }

    // Fallback response instructing frontend Web Speech API
    return NextResponse.json({
      status: 'fallback',
      message: 'Using Web Speech API fallback',
      language,
      rate,
      pitch,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

