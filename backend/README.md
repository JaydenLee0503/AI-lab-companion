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
