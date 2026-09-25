"""
Unified TTS API route.
Priority chain: ElevenLabs Multilingual V2 → Bhashini IndicTTS → Web Speech API fallback.
Designed for open-source dementia care across all Indian languages.
"""

import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings

router = APIRouter(prefix="/tts", tags=["Speech & TTS"])

# ── Universal Premade Voice IDs (Work on every ElevenLabs account) ────
# Pre-made, universally accessible voices tuned for calm, empathetic tone.
DEFAULT_VOICES = {
    "female": "pFZP5JQG7iQjIQuC4Bku",  # Lily (Warm, soothing, clear articulation)
    "male": "N2lVS1w4EtoT3dr4eOWO",    # Callum (Gentle, friendly, steady pace)
}

# ── Comprehensive Indian Language & Voice Map ─────────────────────────
ELEVENLABS_VOICE_MAP: dict[str, dict] = {
    "hi": {"name": "Hindi (हिन्दी)", "female": "pFZP5JQG7iQjIQuC4Bku", "male": "N2lVS1w4EtoT3dr4eOWO"},
    "bn": {"name": "Bengali (বাংলা)", "female": "pFZP5JQG7iQjIQuC4Bku", "male": "N2lVS1w4EtoT3dr4eOWO"},
    "ta": {"name": "Tamil (தமிழ்)", "female": "pFZP5JQG7iQjIQuC4Bku", "male": "N2lVS1w4EtoT3dr4eOWO"},
    "te": {"name": "Telugu (తెలుగు)", "female": "pFZP5JQG7iQjIQuC4Bku", "male": "N2lVS1w4EtoT3dr4eOWO"},
    "mr": {"name": "Marathi (मराठी)", "female": "pFZP5JQG7iQjIQuC4Bku", "male": "N2lVS1w4EtoT3dr4eOWO"},
    "gu": {"name": "Gujarati (ગુજરાતી)", "female": "pFZP5JQG7iQjIQuC4Bku", "male": "N2lVS1w4EtoT3dr4eOWO"},
    "kn": {"name": "Kannada (ಕನ್ನಡ)", "female": "pFZP5JQG7iQjIQuC4Bku", "male": "N2lVS1w4EtoT3dr4eOWO"},
    "ml": {"name": "Malayalam (മലയാളം)", "female": "pFZP5JQG7iQjIQuC4Bku", "male": "N2lVS1w4EtoT3dr4eOWO"},
    "or": {"name": "Odia (ଓଡ଼ିଆ)", "female": "pFZP5JQG7iQjIQuC4Bku", "male": "N2lVS1w4EtoT3dr4eOWO"},
    "pa": {"name": "Punjabi (ਪੰਜਾਬੀ)", "female": "pFZP5JQG7iQjIQuC4Bku", "male": "N2lVS1w4EtoT3dr4eOWO"},
    "as": {"name": "Assamese (অসমীয়া)", "female": "pFZP5JQG7iQjIQuC4Bku", "male": "N2lVS1w4EtoT3dr4eOWO"},
    "en": {"name": "Indian English", "female": "EXAVITQu4vr4xnSDxMaL", "male": "onwK4e9ZLuTAKqWW03F9"},
}


class TTSRequest(BaseModel):
    text: str
    language: str = "hi"
    gender: str = "female"  # "female" or "male"
    rate: Optional[float] = 0.88  # Paced for elderly comprehension
    pitch: Optional[float] = 1.05


@router.post("")
async def synthesize_speech(payload: TTSRequest):
    """
    Unified TTS endpoint.
    1. Tries ElevenLabs (eleven_multilingual_v2) for realistic human voice.
    2. Falls back to Bhashini IndicTTS if Bhashini credentials are set.
    3. Returns fallback metadata for client-side Web Speech API otherwise.
    """
    lang_key = payload.language.lower()
    gender_key = payload.gender.lower() if payload.gender.lower() in ("female", "male") else "female"

    # ── 1. ElevenLabs Multilingual V2 ─────────────────────────────────
    if settings.ELEVENLABS_API_KEY:
        lang_config = ELEVENLABS_VOICE_MAP.get(lang_key, ELEVENLABS_VOICE_MAP.get("en", {}))
        voice_id = lang_config.get(gender_key, DEFAULT_VOICES[gender_key])
        display_name = lang_config.get("name", "Multilingual Voice")

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(
                    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                    headers={
                        "Accept": "audio/mpeg",
                        "Content-Type": "application/json",
                        "xi-api-key": settings.ELEVENLABS_API_KEY,
                    },
                    json={
                        "text": payload.text,
                        "model_id": "eleven_multilingual_v2",
                        "voice_settings": {
                            "stability": 0.65,        # Calm, steady cadence
                            "similarity_boost": 0.80, # High clarity for accents
                            "style": 0.10,            # Subtle warmth
                            "use_speaker_boost": True,
                        },
                    },
                )
                if res.status_code == 200:
                    import base64
                    audio_b64 = base64.b64encode(res.content).decode("utf-8")
                    return {
                        "status": "success",
                        "provider": "elevenlabs",
                        "voice": f"{display_name} ({gender_key.capitalize()})",
                        "audio_base64": audio_b64,
                        "format": "audio/mp3",
                    }
        except Exception:
            pass  # fall through to Bhashini

    # ── 2. Bhashini IndicTTS ────────────────────────────────────────
    if settings.BHASHINI_API_KEY and settings.BHASHINI_USER_ID:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(
                    settings.BHASHINI_INFERENCE_URL,
                    headers={
                        "Authorization": settings.BHASHINI_API_KEY,
                        "userID": settings.BHASHINI_USER_ID,
                    },
                    json={
                        "pipelineTasks": [{
                            "taskType": "tts",
                            "config": {
                                "language": {"sourceLanguage": lang_key},
                                "gender": gender_key,
                            },
                        }],
                        "inputData": {
                            "input": [{"source": payload.text}],
                        },
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    audio_content = (
                        data.get("pipelineResponse", [{}])[0]
                        .get("audio", [{}])[0]
                        .get("audioContent", "")
                    )
                    if audio_content:
                        return {
                            "status": "success",
                            "audio_base64": audio_content,
                            "provider": "bhashini",
                            "format": "audio/wav",
                        }
        except Exception:
            pass  # fall through to local fallback

    # ── 3. Resilient Client-Side Fallback ────────────────────────────
    return {
        "status": "fallback",
        "message": "Using browser Web Speech API fallback",
        "language": payload.language,
        "text": payload.text,
        "provider": "web_speech_api",
    }

