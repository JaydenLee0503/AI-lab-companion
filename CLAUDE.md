# NovaMind AI

A web app giving high school students a hands-free AI lab assistant. Two modes,
one shared core.

## Project overview

- **AI Lab Supporter** (Real Lab Guide) — walks a student through a physical
  experiment by voice; at defined checkpoints, captures one webcam frame and
  uses a vision model to verify the setup is correct and safe. Checkpoint-based,
  NOT continuous video.
- **Socratic Tutor** (Simulation Lab) — interactive simulated experiments for
  students with no equipment; an LLM acts as a Socratic tutor.
- **Shared core** — both modes are driven by the same experiment definition
  (JSON: steps, checkpoints, expected states). New experiment = new file in
  `experiments/`, re-seeded into Supabase.
- **Focus Guard** — a downloadable Manifest V3 Chrome extension that gives local
  alerts when a distracting site takes the active tab during a lab.

## Architecture

```
experiments/*.json        Shared experiment definitions (source of truth)
  └─ scripts/gen-seed.mjs  → supabase/seed.sql (seeds the experiments table)

frontend/                 Vite + React + Tailwind (the app)
  src/supabaseClient.js    supabase-js client (anon key, browser-safe)
  src/api.js               Data layer: Supabase table reads + edge function calls
  src/ui.jsx               Shared dark "mission deck" UI primitives
  src/LandingPage.jsx      Landing (design language source)
  src/HomePage.jsx         Dashboard / experiment library
  src/RealLabGuide.jsx     AI Lab Supporter (webcam → vision checkpoint)
  src/SimulationLab.jsx    Socratic Tutor (chat + voice)
  src/ExtensionPage.jsx    Focus Guard download + install

supabase/                 Supabase backend (primary)
  config.toml              Project + per-function config (verify_jwt = false)
  migrations/0001_init.sql experiments table + public-read RLS
  seed.sql                 Generated experiment rows
  functions/               Deno edge functions (the key-holding proxy)
    _shared/               http, featherless, elevenlabs, experiments helpers
    health, tutor-chat, tutor-transition, vision-checkpoint, tts

chrome-extension/         Focus Guard (MV3) — packaged to
                          frontend/public/focus-guard-extension.zip
```

### Frontend
React + Vite + Tailwind. Camera via `getUserMedia`. The whole app reuses the
landing page's cinematic style via `src/ui.jsx` (black canvas, uppercase bold
type, bordered panels, cyan/amber accents, border-2 invert buttons). Experiments
are read straight from Supabase with the anon key; AI/voice calls go to edge
functions. If the Supabase env vars are missing or still set to the
`.env.example` placeholders, `api.js` surfaces a clear "Supabase not configured"
message instead of a raw network error.

### Supabase backend (primary)
- **Database**: one `public.experiments` table (`id text pk`, `data jsonb`).
  Row-level security allows anonymous **SELECT only** — no writes from the
  browser, no login. Seeded from `supabase/seed.sql`.
- **Edge Functions** (Deno) are the proxy that holds the secret API keys:
  `tutor-chat`, `tutor-transition`, `vision-checkpoint`, `tts`, `health`.
  Secrets (`FEATHERLESS_API_KEY`, `ELEVENLABS_API_KEY`) are set via
  `supabase secrets` and never reach the browser.
- Vision + reasoning: Featherless AI (OpenAI-compatible), Gemma-class VLM
  `google/gemma-3-27b-it`, frames sent as base64. Voice: ElevenLabs TTS.

## Environment variables

Frontend — `frontend/.env.local` (copy from `frontend/.env.example`). These are
PUBLIC / browser-safe:
- `VITE_SUPABASE_URL` — your project URL, e.g. `https://abc.supabase.co`
- `VITE_SUPABASE_ANON_KEY` — anon public key (gated by RLS)

Edge functions — `supabase/functions/.env` (copy from `.env.example`). SECRET,
never committed:
- `FEATHERLESS_API_KEY` (required), optional `FEATHERLESS_BASE_URL`,
  `FEATHERLESS_TEXT_MODEL`, `FEATHERLESS_VISION_MODEL`
- `ELEVENLABS_API_KEY` (required for voice), optional `ELEVENLABS_VOICE_ID`,
  `ELEVENLABS_MODEL`
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are injected by the runtime — do
  not set them.

Never hardcode any key in source. Never expose the service-role key to the
browser.

## Setup & Windows (PowerShell) commands

Frontend:
```powershell
cd frontend
npm install
Copy-Item .env.example .env.local   # then fill in VITE_SUPABASE_* values
npm run dev                          # http://localhost:5173
```

Supabase (requires the Supabase CLI + Docker Desktop):
```powershell
supabase login
supabase link --project-ref YOUR-PROJECT-REF
node scripts/gen-seed.mjs            # regenerate seed.sql from experiments/
supabase db push                     # apply migrations/0001_init.sql
# seed the experiments table (psql) — or paste seed.sql in the SQL editor:
# Get-Content supabase\seed.sql | psql "$env:SUPABASE_DB_URL"
supabase secrets set --env-file supabase\functions\.env
supabase functions deploy            # deploys all functions
```

Local Supabase stack (optional, instead of a hosted project):
```powershell
supabase start
supabase functions serve --env-file supabase\functions\.env
```

Chrome extension:
```powershell
cd frontend
npm run build:extension              # → frontend/public/focus-guard-extension.zip
```
Then in Chrome: `chrome://extensions` → enable Developer mode → **Load
unpacked** → select the `chrome-extension` folder (or unzip the downloaded zip).

## Guardrails
- API keys live ONLY server-side (Supabase edge function secrets). Never expose a
  secret key to the browser. The anon key is browser-safe and gated by RLS.
- Web only. No mobile native app.
- The only database is the public, read-only `experiments` table. No accounts or
  login in the app.
- Vision is checkpoint-based only — no "analyze any experiment".
- Experiments must use cheap/household materials and be safe (no flame, no
  hazardous chemicals). Keep the library small and solid.
- Chrome extension reads only the active tab hostname; never page content,
  credentials, messages, or personal data, and makes no network requests.

## Verification checklist
- [ ] `cd frontend; npm install` succeeds.
- [ ] `npm run build` produces `dist/` (incl. `focus-guard-extension.zip`).
- [ ] `npm run dev` serves http://localhost:5173 with no console errors.
- [ ] `node scripts/gen-seed.mjs` regenerates `supabase/seed.sql` cleanly.
- [ ] `npm run build:extension` writes the zip; it contains a top-level
      `chrome-extension/` folder with `manifest.json` and `icons/`.
- [ ] With Supabase env vars set: experiments load on the dashboard.
- [ ] Socratic Tutor (Simulation Lab) returns tutor replies; voice plays.
- [ ] AI Lab Supporter (Real Lab Guide) verifies a webcam frame and speaks the
      transition.
- [ ] Extension loads unpacked and alerts on a watched site.

## Known limitations / TODOs
- Edge functions are not type-checked in CI here (no Deno installed locally);
  validate with `deno check` or `supabase functions serve` before deploy.
- No automated tests or linter configured yet (`npm test` / `npm run lint` are
  absent). Adding ESLint + a smoke test is a good next step.
- The hero image (`lab-mission-hero.png`, ~1.5 MB) inflates the bundle; consider
  compressing or lazy-loading.
- `focus-guard-extension.zip` is committed for one-click download; regenerate it
  with `npm run build:extension` whenever the extension changes.
- Seeding currently assumes manual `psql`/SQL-editor paste; a `supabase db
  seed` hook could automate it.

## How to work
Make small commits. Never commit secrets. The shared experiment JSON is the
source of truth — after editing it, re-run `node scripts/gen-seed.mjs`.
