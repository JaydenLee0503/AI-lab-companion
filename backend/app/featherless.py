from __future__ import annotations

import json
import re
from typing import Any

import httpx
from fastapi import HTTPException

from . import config


def _require_key() -> str:
    if not config.FEATHERLESS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="FEATHERLESS_API_KEY is not configured on the server.",
        )
    return config.FEATHERLESS_API_KEY


async def chat(
    messages: list[dict[str, Any]],
    *,
    model: str | None = None,
    temperature: float = 0.4,
    max_tokens: int = 400,
) -> str:
    api_key = _require_key()
    body = {
        "model": model or config.FEATHERLESS_TEXT_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                f"{config.FEATHERLESS_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json=body,
            )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Featherless network error: {e}")
    if r.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Featherless error {r.status_code}: {r.text[:300]}",
        )
    data = r.json()
    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as e:
        raise HTTPException(
            status_code=502, detail=f"Unexpected Featherless response: {e}"
        )


async def vision_verify(
    image_b64: str,
    *,
    system_prompt: str,
    user_prompt: str,
) -> dict[str, Any]:
    """Send one image + prompt; expect a JSON object back."""
    api_key = _require_key()
    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": user_prompt},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                },
            ],
        },
    ]
    body = {
        "model": config.FEATHERLESS_VISION_MODEL,
        "messages": messages,
        "temperature": 0.1,
        "max_tokens": 350,
    }
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            r = await client.post(
                f"{config.FEATHERLESS_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json=body,
            )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Featherless network error: {e}")
    if r.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Featherless error {r.status_code}: {r.text[:300]}",
        )
    content = r.json()["choices"][0]["message"]["content"]
    return _extract_json(content)


def _extract_json(text: str) -> dict[str, Any]:
    """Best-effort: find the first {...} block and parse it."""
    text = text.strip()
    # strip code fences if present
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    m = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass
    # last resort: pass the raw text through as observations with passed=false
    return {"passed": False, "observations": text[:400]}
