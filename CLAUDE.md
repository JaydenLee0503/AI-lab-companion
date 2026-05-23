# AI Lab Companion

A web app giving high school students a hands-free AI lab assistant. Two modes,
one shared core.

## Modes
- **Real Lab Guide** — walks a student through a physical experiment by voice;
  at defined checkpoints, captures one webcam frame and uses a vision model to
  verify the setup is correct and safe. Checkpoint-based, NOT continuous video.
- **Simulation Lab** — interactive simulated experiments for students with no
  equipment; an LLM acts as a Socratic tutor.
- **Shared core** — both modes are driven by the same experiment definition
  files (JSON: steps, checkpoints, expected states). New experiment = new file.

## Stack
- Frontend: React + Vite + Tailwind. Camera via getUserMedia.
- Backend: Python FastAPI — thin proxy holding API keys.
- Vision + reasoning: Featherless AI, OpenAI-compatible API. Gemma-class VLM
  (`google/gemma-3-27b-it`), frames sent as base64.
- Voice: ElevenLabs TTS (later: STT for student questions).

## Guardrails
- API keys live ONLY in the backend. Never expose a key to the browser.
- Web only. No mobile native app.
- No accounts, login, or database until everything else works.
- Vision is checkpoint-based only — no "analyze any experiment".
- Experiments must use cheap/household materials and be safe (no flame, no
  hazardous chemicals). Keep the library small and solid.

## Milestones
- M0 — Scaffold: FastAPI backend with /health, Vite React frontend, both run.
- M1 — Experiment definition schema + one complete sample experiment.
- M2 — Simulation Lab (text) for one experiment, with the Featherless LLM tutor.
- M3 — Add ElevenLabs voice to the Simulation Lab.
- M4 — Real Lab Guide: webcam frame -> Featherless VLM -> verification result.
- M5 — Full voice loop: VLM verifies -> LLM forms next instruction -> TTS speaks.
- M6 — Polish: second experiment, accessibility, error handling, demo.

## How to work
Do one milestone at a time. Before coding, restate the goal and list
assumptions. Make small commits. Never commit secrets. Stop for review after
each milestone.
