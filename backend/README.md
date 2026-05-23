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

## Endpoints

- `GET /health` — liveness.
- `GET /experiments` — list of `{id, title, summary, grade_level, duration_minutes}`.
- `GET /experiments/{id}` — full experiment JSON (see `experiments/` at repo root).

Experiment JSON files are validated by `app/experiments.py` (Pydantic). The
file's stem must equal its `id` (e.g., `density-column.json` -> `id: density-column`).
