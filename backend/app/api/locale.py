"""
Locale detection & manual override API routes.
Ported from server/src/routes/localeRoutes.js + geoipMiddleware.js.
"""

from fastapi import APIRouter, Request, Response
from pydantic import BaseModel
from typing import Optional
from app.core.geoip import resolve_region, STATE_LOCALE_MAP

router = APIRouter(prefix="/locale", tags=["Locale & GeoIP"])

COOKIE_LOCALE_KEY = "smritisetu_locale"
COOKIE_REGION_KEY = "smritisetu_region"
COOKIE_OVERRIDE_KEY = "smritisetu_manual_override"
COOKIE_MAX_AGE = 30 * 24 * 60 * 60  # 30 days


def _detect_locale(request: Request) -> dict:
    """Core detection logic: honours cookie override, else resolves via GeoIP."""
    cookies = request.cookies
    has_manual_override = cookies.get(COOKIE_OVERRIDE_KEY) == "true"
    saved_locale = cookies.get(COOKIE_LOCALE_KEY)
    saved_region = cookies.get(COOKIE_REGION_KEY)

    headers = dict(request.headers)
    client_host = request.client.host if request.client else "127.0.0.1"
    test_region = request.query_params.get("testRegion", "")

    detected = resolve_region(headers, client_host, test_region)

    if has_manual_override and saved_locale:
        active_lang = saved_locale
        active_region = STATE_LOCALE_MAP.get(saved_region, detected) if saved_region else detected
    else:
        active_lang = detected.get("langCode", "en")
        active_region = detected

    return {
        "activeLocale": active_lang,
        "stateCode": active_region.get("stateCode"),
        "stateName": active_region.get("stateName"),
        "nativeName": active_region.get("nativeName"),
        "englishName": active_region.get("englishName"),
        "pair": active_region.get("pair", [active_lang, "en"]),
        "isDetected": detected.get("isDetected", False),
        "detectionSource": detected.get("source", "unknown"),
        "clientIp": detected.get("clientIp", "127.0.0.1"),
        "hasManualOverride": has_manual_override,
    }


@router.get("/detect")
async def detect_locale(request: Request, response: Response):
    """
    GET /api/v1/locale/detect
    Returns current locale configuration detected from IP/headers or saved cookie.
    Sets persistence cookies on first visit.
    """
    info = _detect_locale(request)

    # Set cookie for first-visit persistence
    if not request.cookies.get(COOKIE_LOCALE_KEY) and not info["hasManualOverride"]:
        response.set_cookie(COOKIE_LOCALE_KEY, info["activeLocale"], max_age=COOKIE_MAX_AGE, httponly=False, samesite="lax")
        response.set_cookie(COOKIE_REGION_KEY, info["stateCode"] or "IN", max_age=COOKIE_MAX_AGE, httponly=False, samesite="lax")

    return {"status": "success", "data": info}


class OverrideRequest(BaseModel):
    langCode: str
    stateCode: Optional[str] = None


@router.post("/override")
async def override_locale(payload: OverrideRequest, response: Response):
    """
    POST /api/v1/locale/override
    Allows caregiver or patient to manually select a language.
    Sets manual override cookie so subsequent visits never overwrite this choice.
    """
    response.set_cookie(COOKIE_LOCALE_KEY, payload.langCode, max_age=COOKIE_MAX_AGE, httponly=False, samesite="lax")
    response.set_cookie(COOKIE_OVERRIDE_KEY, "true", max_age=COOKIE_MAX_AGE, httponly=False, samesite="lax")

    if payload.stateCode:
        response.set_cookie(COOKIE_REGION_KEY, payload.stateCode, max_age=COOKIE_MAX_AGE, httponly=False, samesite="lax")

    return {
        "status": "success",
        "message": "Manual language preference saved securely.",
        "activeLocale": payload.langCode,
        "manualOverride": True,
    }


@router.get("/supported")
async def supported_locales():
    """
    GET /api/v1/locale/supported
    Returns supported state and language metadata.
    """
    # De-duplicate (OR is alias of OD)
    seen = set()
    unique = []
    for v in STATE_LOCALE_MAP.values():
        key = v["stateCode"]
        if key not in seen:
            seen.add(key)
            unique.append(v)
    return {"status": "success", "states": unique}
