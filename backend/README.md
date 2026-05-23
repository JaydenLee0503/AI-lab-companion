# Backend

FastAPI app. Thin proxy that will hold API keys (Featherless, ElevenLabs).

## Run

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then `GET http://localhost:8000/health` -> `{"status":"ok"}`.

## API keys

Copy `.env.example` to `.env` and fill in:

```
FEATHERLESS_API_KEY=...
ELEVENLABS_API_KEY=...
```

Optional overrides: `FEATHERLESS_TEXT_MODEL`, `FEATHERLESS_VISION_MODEL`,
`ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL`.

Without keys, the app still loads — the AI endpoints return `503` with a
clear "API_KEY is not configured" message.

## Endpoints

- `GET /health` — liveness.
- `GET /experiments` — list of `{id, title, summary, grade_level, duration_minutes}`.
- `GET /experiments/{id}` — full experiment JSON (see `experiments/` at repo root).
- `POST /tutor/chat` — Simulation Lab tutor. Body: `{experiment_id, step_id, messages}`.
- `POST /tutor/transition` — Voice-loop narration for a step transition.
- `POST /tts` — ElevenLabs TTS. Returns `audio/mpeg`.
- `POST /vision/checkpoint` — VLM verification of a captured webcam frame.

Experiment JSON files are validated by `app/experiments.py` (Pydantic). The
file's stem must equal its `id` (e.g., `density-column.json` -> `id: density-column`).
