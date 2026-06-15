# NovaMind AI

A web app that gives high school students a **hands-free AI lab assistant**. It runs
two modes on one shared core: a voice guide for real, physical experiments, and a
Socratic tutor for simulated ones — so a student can learn whether or not they have
equipment in front of them.

## What it does

- **AI Lab Supporter (Real Lab Guide)** — walks a student through a physical
  experiment by voice. At defined checkpoints it captures a single webcam frame and
  asks a vision model to confirm the setup is correct and safe before moving on. It's
  checkpoint-based, not continuous video, so it stays cheap and privacy-respecting.
- **Socratic Tutor (Simulation Lab)** — an interactive, simulated experiment for
  students with no equipment. An LLM acts as a Socratic tutor, asking questions and
  guiding reasoning rather than handing over answers. Replies are spoken aloud.
- **Focus Guard** — a downloadable Manifest V3 Chrome extension that gives a local
  alert when a distracting site takes the active tab during a lab. It reads only the
  active tab's hostname; everything network-bound is opt-in and off by default.

Both modes are driven by the **same experiment definition** — a JSON file describing
steps, checkpoints, and expected states. Adding a new experiment is just a new file in
`experiments/`, re-seeded into the database. The library is kept small, and every
experiment uses cheap household materials and is safe (no flame, no hazardous
chemicals).

## How it's built

- **Frontend** — Vite + React + Tailwind, with a cinematic dark "mission deck" design
  language shared across every screen. The webcam uses `getUserMedia`. Experiments are
  read straight from Supabase with the browser-safe anon key; all AI and voice calls go
  through edge functions so no secret ever reaches the browser.
- **Backend (Supabase)** — a single public, read-only `experiments` table guarded by
  row-level security (anonymous SELECT only; no accounts, no login). Deno **edge
  functions** act as the key-holding proxy: `tutor-chat`, `tutor-transition`,
  `vision-checkpoint`, `tts`, `focus-coach`, `summarize`, and `health`.
- **AI services** — vision and reasoning run on Featherless AI (OpenAI-compatible,
  Gemma-class VLM `google/gemma-3-27b-it`), with frames sent as base64. Voice is
  ElevenLabs TTS. API keys live only in Supabase function secrets.

```
experiments/*.json   Shared experiment definitions (source of truth)
frontend/            Vite + React + Tailwind app
supabase/            Migrations, seed, and Deno edge functions
chrome-extension/    Focus Guard (MV3)
```

## Privacy & guardrails

API keys are server-side only — the browser carries just the RLS-gated anon key. The
app is web-only with no user accounts and a single read-only table. Vision is strictly
checkpoint-based. Focus Guard never reads page content, credentials, or personal data
by default; its two opt-in paths (AI nudges and a click-only page summary) sit behind a
single **AI features** toggle that ships off.

## Getting started

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local   # then fill in VITE_SUPABASE_* values
npm run dev                          # http://localhost:5173
```

See `CLAUDE.md` for full setup, including Supabase deployment, seeding, and building the
Chrome extension.
