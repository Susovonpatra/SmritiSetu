import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter(prefix="/tts", tags=["Speech & Bhashini"])

class TTSRequest(BaseModel):
    text: str
    language: str = "as"  # 'as' for Assamese, 'mni' for Manipuri, 'en' for English
    gender: str = "female"

@router.post("")
async def synthesize_speech(payload: TTSRequest):
    """
    Proxy to Bhashini IndicTTS pipeline. If credentials not configured,
    returns standard fallback metadata so frontend resiliently switches
    to pre-cached audio or local Web Speech API synthesis within 1500ms.
    """
    if settings.BHASHINI_API_KEY and settings.BHASHINI_USER_ID:
        try:
            async with httpx.AsyncClient(timeout=1.4) as client:
                res = await client.post(
                    settings.BHASHINI_INFERENCE_URL,
                    headers={
                        "Authorization": settings.BHASHINI_API_KEY,
                        "userID": settings.BHASHINI_USER_ID
                    },
                    json={
                        "pipelineTasks": [{
                            "taskType": "tts",
                            "config": {
                                "language": {"sourceLanguage": payload.language},
                                "gender": payload.gender
                            }
                        }],
                        "inputData": {
                            "input": [{"source": payload.text}]
                        }
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    # return base64 audio
                    audio_content = data.get("pipelineResponse", [{}])[0].get("audio", [{}])[0].get("audioContent", "")
                    if audio_content:
                        return {"status": "success", "audio_base64": audio_content, "provider": "bhashini"}
        except Exception:
            pass # fall through to local fallback

    # Resilient fallback response
    return {
        "status": "fallback",
        "message": "Using local regional audio engine fallback",
        "language": payload.language,
        "text": payload.text,
        "provider": "local_indic_cache"
    }
