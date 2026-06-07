# Frontend

Vite + React + Tailwind. Reads experiments from Supabase (anon key) and calls
Supabase Edge Functions for AI/voice.

## Run

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local   # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```

Open http://localhost:5173. Restart the dev server after editing `.env.local`
(Vite only reads env vars at startup). See the repo root `CLAUDE.md` for the full
Supabase setup.
