# PROJECT_SPEC — AI Lab Companion

> This file is the single source of truth for the project. Claude Code must
> read it at the start of every `/goal` run and keep it updated as the project
> evolves.

## 1. One-line vision

A web app that gives high school students a hands-free AI lab assistant — one
mode guides them through **real physical experiments** using a camera, the
other lets them run **simulated experiments** when they have no equipment.

## 2. Target user

High school students (ages ~14–18), especially those in schools that lack lab
equipment or a STEM specialist teacher. The app must run in a normal browser
(including school Chromebooks) with no install.

## 3. The core problem this addresses

STEM learning is hands-on, but labs require equipment, time, and an expert to
catch mistakes as they happen. Many students never get that. This app delivers
**immediate, step-by-step feedback during practical work** — the thing a lab TA
would do — and a simulation fallback for when materials aren't available.

## 4. The two modes (one app, shared core)

### Mode A — Real Lab Guide
- Student picks an experiment. The app walks them through it **by voice**.
- At defined **checkpoints**, the app asks the student to hold their setup up
  to the webcam, captures a single frame, and sends it to a vision model.
- The vision model verifies the setup against the checkpoint's expected state
  (correct / incorrect / unsafe). The app then speaks the next instruction or a
  correction.
- IMPORTANT: this is **checkpoint-based**, not continuous video analysis. One
  frame per checkpoint. Do not attempt real-time video understanding.

### Mode B — Simulation Lab
- Student runs an interactive, simulated version of the same experiment in the
  browser (canvas / parametric controls). No camera, no equipment.
- An LLM acts as a Socratic tutor: it reacts to what the student does, asks
  guiding questions, and explains outcomes.

### Shared core — Experiment Definitions
Both modes are driven by the **same** experiment definition files (see §6).
Building a new experiment = writing one definition file; it should work in both
modes with no code changes.

## 5. Tech stack

- **Frontend:** React + Vite + Tailwind CSS. Camera via `getUserMedia`.
- **Backend:** Python FastAPI — a thin proxy that holds API keys and calls
  Featherless and ElevenLabs. The frontend never sees an API key.
- **Vision + reasoning:** Featherless AI (OpenAI-compatible API).
  - Vision model: a Gemma-class VLM (default `google/gemma-3-27b-it`).
  - Send frames as base64 in a chat completion request.
- **Voice:** ElevenLabs — text-to-speech for guidance; optionally
  speech-to-text so students can ask questions out loud.
- **Storage:** start with local JSON files for experiment definitions. No
  database needed for the first version.

## 6. Experiment Definition schema (draft — refine in M1)

Each experiment is one JSON file in `backend/experiments/`:

```json
{
  "id": "ph-indicator",
  "title": "Testing pH with a Cabbage Indicator",
  "subject": "chemistry",
  "grade_level": "9-10",
  "materials": ["red cabbage", "hot water", "clear cups", "lemon juice", "baking soda"],
  "safety_notes": ["Use warm not boiling water", "Do not drink any samples"],
  "steps": [
    {
      "id": "s1",
      "instruction": "Pour the cabbage indicator into three clear cups.",
      "checkpoint": {
        "expected": "three cups each with purple liquid",
        "vision_prompt": "Are there three clear cups, each containing purple liquid? Answer setup_ok, setup_wrong, or unsafe with a one-sentence reason."
      }
    }
  ],
  "simulation": {
    "type": "ph-mixer",
    "params": { "...": "mode-B specific config" }
  }
}
```

## 7. Hard constraints / guardrails

- API keys live ONLY in the backend `.env`. Never ship a key to the browser.
- Real Lab Guide is checkpoint-based. No continuous video inference.
- Choose experiments that use **cheap or household materials** and are **safe**
  (no open flame, no hazardous chemicals). Safety checks are a feature.
- Keep the experiment library small and high-quality. 2 solid experiments beat
  10 broken ones.
- Accessibility: voice output, large text, keyboard-navigable, works on low
  bandwidth. Cache TTS audio for the fixed step set where possible.

## 8. Non-goals (do NOT build these)

- User accounts, login, or a database (until everything else works).
- A mobile native app. Web only.
- General-purpose "analyze any experiment" vision. Only defined checkpoints.
- Grading or gradebook features.

## 9. Milestones

- **M0 — Scaffold.** Repo structure, FastAPI backend with `/health`, Vite React
  frontend that loads, both run locally with one command each. README updated.
- **M1 — Experiment schema.** Finalize the Experiment Definition schema. Write
  ONE complete sample experiment file. A loader reads it.
- **M2 — Simulation Lab (text).** One playable simulated experiment driven by a
  definition file, with the LLM tutor responding in text via Featherless.
- **M3 — Voice in Simulation.** Add ElevenLabs TTS so the tutor speaks.
- **M4 — Real Lab Guide (vision).** Camera capture, send a checkpoint frame to
  the Featherless VLM, display the verification result.
- **M5 — Voice guidance loop.** Full Real Lab loop: VLM verifies → LLM forms the
  next instruction → ElevenLabs speaks it.
- **M6 — Polish.** Second experiment, accessibility pass, error handling,
  demo script and recording.

## 10. Working agreement for Claude Code

- Work one milestone (or sub-task) at a time. Do not jump ahead.
- Before coding, restate the goal and list assumptions; flag anything unclear.
- Make small, focused git commits with clear messages.
- After each milestone, update the "Progress log" below.

## Progress log

- (empty — Claude Code appends dated entries here)
