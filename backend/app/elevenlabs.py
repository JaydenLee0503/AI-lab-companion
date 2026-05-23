from __future__ import annotations

import httpx
from fastapi import HTTPException

from . import config


def _require_key() -> str:
    if not config.ELEVENLABS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="ELEVENLABS_API_KEY is not configured on the server.",
        )
    return config.ELEVENLABS_API_KEY


async def synthesize(text: str, voice_id: str | None = None) -> bytes:
    api_key = _require_key()
    voice = voice_id or config.ELEVENLABS_VOICE_ID
    body = {
        "text": text,
        "model_id": config.ELEVENLABS_MODEL,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }
    headers = {
        "xi-api-key": api_key,
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice}",
                headers=headers,
                json=body,
            )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"ElevenLabs network error: {e}")
    if r.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"ElevenLabs error {r.status_code}: {r.text[:300]}",
        )
    return r.content
