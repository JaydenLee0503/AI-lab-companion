import os
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env if present. Missing keys are fine — endpoints check at call time.
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)


FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY", "").strip()
FEATHERLESS_BASE_URL = os.getenv(
    "FEATHERLESS_BASE_URL", "https://api.featherless.ai/v1"
).strip()
FEATHERLESS_TEXT_MODEL = os.getenv(
    "FEATHERLESS_TEXT_MODEL", "google/gemma-3-27b-it"
).strip()
FEATHERLESS_VISION_MODEL = os.getenv(
    "FEATHERLESS_VISION_MODEL", "google/gemma-3-27b-it"
).strip()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
ELEVENLABS_VOICE_ID = os.getenv(
    "ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM"
).strip()
ELEVENLABS_MODEL = os.getenv("ELEVENLABS_MODEL", "eleven_turbo_v2_5").strip()
