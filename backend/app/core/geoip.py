"""
State-to-Language Mapping & GeoIP Resolution Service for India.
Maps ISO 3166-2:IN subdivision codes to primary language, native script label, and English fallback.
Ported from server/src/services/geoipService.js into Python for unified FastAPI backend.
"""

from typing import Optional

# ── State → Language Map ──────────────────────────────────────────────

STATE_LOCALE_MAP: dict[str, dict] = {
    # Primary Target States
    "OD": {
        "stateCode": "OD", "stateName": "Odisha",
        "langCode": "or", "langCodeFull": "or-IN",
        "nativeName": "ଓଡ଼ିଆ", "englishName": "Odia",
        "pair": ["or", "en"],
    },
    "OR": {  # Legacy ISO alias for Odisha
        "stateCode": "OD", "stateName": "Odisha",
        "langCode": "or", "langCodeFull": "or-IN",
        "nativeName": "ଓଡ଼ିଆ", "englishName": "Odia",
        "pair": ["or", "en"],
    },
    "GJ": {
        "stateCode": "GJ", "stateName": "Gujarat",
        "langCode": "gu", "langCodeFull": "gu-IN",
        "nativeName": "ગુજરાતી", "englishName": "Gujarati",
        "pair": ["gu", "en"],
    },
    "AS": {
        "stateCode": "AS", "stateName": "Assam",
        "langCode": "as", "langCodeFull": "as-IN",
        "nativeName": "অসমীয়া", "englishName": "Assamese",
        "pair": ["as", "en"],
    },
    "WB": {
        "stateCode": "WB", "stateName": "West Bengal",
        "langCode": "bn", "langCodeFull": "bn-IN",
        "nativeName": "বাংলা", "englishName": "Bengali",
        "pair": ["bn", "en"],
    },
    "MH": {
        "stateCode": "MH", "stateName": "Maharashtra",
        "langCode": "mr", "langCodeFull": "mr-IN",
        "nativeName": "मराठी", "englishName": "Marathi",
        "pair": ["mr", "en"],
    },
    "KA": {
        "stateCode": "KA", "stateName": "Karnataka",
        "langCode": "kn", "langCodeFull": "kn-IN",
        "nativeName": "ಕನ್ನಡ", "englishName": "Kannada",
        "pair": ["kn", "en"],
    },
    "TN": {
        "stateCode": "TN", "stateName": "Tamil Nadu",
        "langCode": "ta", "langCodeFull": "ta-IN",
        "nativeName": "தமிழ்", "englishName": "Tamil",
        "pair": ["ta", "en"],
    },
    "KL": {
        "stateCode": "KL", "stateName": "Kerala",
        "langCode": "ml", "langCodeFull": "ml-IN",
        "nativeName": "മലയാളം", "englishName": "Malayalam",
        "pair": ["ml", "en"],
    },
    "TG": {
        "stateCode": "TG", "stateName": "Telangana",
        "langCode": "te", "langCodeFull": "te-IN",
        "nativeName": "తెలుగు", "englishName": "Telugu",
        "pair": ["te", "en"],
    },
    "AP": {
        "stateCode": "AP", "stateName": "Andhra Pradesh",
        "langCode": "te", "langCodeFull": "te-IN",
        "nativeName": "తెలుగు", "englishName": "Telugu",
        "pair": ["te", "en"],
    },
    "PB": {
        "stateCode": "PB", "stateName": "Punjab",
        "langCode": "pa", "langCodeFull": "pa-IN",
        "nativeName": "ਪੰਜਾਬੀ", "englishName": "Punjabi",
        "pair": ["pa", "en"],
    },
    # Hindi Belt
    "DL": {"stateCode": "DL", "stateName": "Delhi", "langCode": "hi", "langCodeFull": "hi-IN", "nativeName": "हिन्दी", "englishName": "Hindi", "pair": ["hi", "en"]},
    "UP": {"stateCode": "UP", "stateName": "Uttar Pradesh", "langCode": "hi", "langCodeFull": "hi-IN", "nativeName": "हिन्दी", "englishName": "Hindi", "pair": ["hi", "en"]},
    "MP": {"stateCode": "MP", "stateName": "Madhya Pradesh", "langCode": "hi", "langCodeFull": "hi-IN", "nativeName": "हिन्दी", "englishName": "Hindi", "pair": ["hi", "en"]},
    "RJ": {"stateCode": "RJ", "stateName": "Rajasthan", "langCode": "hi", "langCodeFull": "hi-IN", "nativeName": "हिन्दी", "englishName": "Hindi", "pair": ["hi", "en"]},
    "BR": {"stateCode": "BR", "stateName": "Bihar", "langCode": "hi", "langCodeFull": "hi-IN", "nativeName": "हिन्दी", "englishName": "Hindi", "pair": ["hi", "en"]},
}

DEFAULT_FALLBACK_LOCALE: dict = {
    "stateCode": "IN",
    "stateName": "India (Standard)",
    "langCode": "en",
    "langCodeFull": "en-IN",
    "nativeName": "English",
    "englishName": "English",
    "pair": ["en", "or"],
}


def _is_private_or_loopback(ip: str) -> bool:
    """Check whether an IP is loopback, link-local, or private RFC 1918."""
    if not ip:
        return True
    if ip in ("127.0.0.1", "::1") or ip.startswith("::ffff:127.0.0.1"):
        return True
    if ip.startswith("10.") or ip.startswith("192.168."):
        return True
    if ip.startswith("172."):
        parts = ip.split(".")
        if len(parts) >= 2:
            second = int(parts[1])
            if 16 <= second <= 31:
                return True
    return False


def _resolve_known_indian_subnet(ip: str) -> Optional[dict]:
    """Known IP subnet ranges for major Indian cities (for demos/testing)."""
    if ip.startswith("117.239.") or ip.startswith("117.240.") or ip.startswith("43.242.160."):
        return STATE_LOCALE_MAP["OD"]
    if ip.startswith("103.240.232.") or ip.startswith("103.21.58.") or ip.startswith("49.36."):
        return STATE_LOCALE_MAP["GJ"]
    if ip.startswith("117.236.") or ip.startswith("103.206."):
        return STATE_LOCALE_MAP["AS"]
    return None


def extract_client_ip(headers: dict, client_host: str = "127.0.0.1") -> str:
    """Resolve client IP from proxies, reverse proxies, and socket info."""
    forwarded = headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return (
        headers.get("cf-connecting-ip")
        or headers.get("x-real-ip")
        or client_host
    )


def resolve_region(headers: dict, client_host: str = "127.0.0.1", test_region: str = "") -> dict:
    """
    Resolve the user's Indian state/region from edge headers, known subnets, or fallback.
    Returns a dict with locale metadata + detection source.
    """
    # 1. Edge provider headers (Cloudflare, Vercel, AWS CloudFront)
    raw_region = (
        headers.get("cf-region-code") or headers.get("cf-region")
        or headers.get("x-vercel-ip-subdivision")
        or headers.get("cloudfront-viewer-country-region")
    )
    if raw_region:
        upper = raw_region.strip().upper()
        if upper in STATE_LOCALE_MAP:
            return {**STATE_LOCALE_MAP[upper], "isDetected": True, "source": "edge_header"}

    # 2. Client IP resolution
    ip = extract_client_ip(headers, client_host)

    if _is_private_or_loopback(ip):
        override = test_region.upper() if test_region else ""
        if override and override in STATE_LOCALE_MAP:
            return {**STATE_LOCALE_MAP[override], "clientIp": ip, "isDetected": True, "source": "test_override"}
        return {**DEFAULT_FALLBACK_LOCALE, "clientIp": ip, "isDetected": False, "source": "localhost_fallback"}

    # 3. Known ISP subnet lookup
    known = _resolve_known_indian_subnet(ip)
    if known:
        return {**known, "clientIp": ip, "isDetected": True, "source": "subnet_lookup"}

    return {**DEFAULT_FALLBACK_LOCALE, "clientIp": ip, "isDetected": False, "source": "default_fallback"}
