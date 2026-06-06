// Data layer for the AI Lab Companion frontend.
//
// Primary backend: Supabase. Experiments are read directly from the public
// `experiments` table (anon key + RLS). AI/voice calls go to Supabase Edge
// Functions, which hold the Featherless and ElevenLabs keys server-side.
//
// Fallback: if VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set, the app
// falls back to the legacy local FastAPI proxy at VITE_BACKEND_URL. This keeps
// local development working without the Supabase CLI.

import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  supabase,
  USE_SUPABASE,
} from "./supabaseClient";

export { USE_SUPABASE };

const LEGACY_BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000";

const NOT_CONFIGURED =
  "Backend not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local (or VITE_BACKEND_URL for the legacy proxy).";

async function jsonOrThrow(res) {
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      if (j && j.detail) detail = j.detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

/** POST to a Supabase Edge Function and parse JSON. */
async function callFunction(name, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(res);
}

/** POST to a legacy FastAPI endpoint and parse JSON. */
async function callLegacy(path, body) {
  const res = await fetch(`${LEGACY_BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(res);
}

function summarize(exp) {
  return {
    id: exp.id,
    title: exp.title,
    summary: exp.summary,
    grade_level: exp.grade_level,
    duration_minutes: exp.duration_minutes,
  };
}

// ---------- health ----------

export async function getHealth() {
  if (USE_SUPABASE) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    return jsonOrThrow(res);
  }
  if (!import.meta.env.VITE_BACKEND_URL && !LEGACY_BACKEND_URL) {
    throw new Error(NOT_CONFIGURED);
  }
  return jsonOrThrow(await fetch(`${LEGACY_BACKEND_URL}/health`));
}

// ---------- experiments (shared core) ----------

export async function listExperiments() {
  if (USE_SUPABASE) {
    const { data, error } = await supabase
      .from("experiments")
      .select("data")
      .order("id");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => summarize(row.data));
  }
  return jsonOrThrow(await fetch(`${LEGACY_BACKEND_URL}/experiments`));
}

export async function getExperiment(id) {
  if (USE_SUPABASE) {
    const { data, error } = await supabase
      .from("experiments")
      .select("data")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("experiment not found");
    return data.data;
  }
  return jsonOrThrow(await fetch(`${LEGACY_BACKEND_URL}/experiments/${id}`));
}

// ---------- Socratic Tutor (Simulation Lab) ----------

export async function tutorChat(experimentId, stepId, messages) {
  const body = {
    experiment_id: experimentId,
    step_id: stepId,
    messages,
  };
  return USE_SUPABASE
    ? callFunction("tutor-chat", body)
    : callLegacy("/tutor/chat", body);
}

export async function tutorTransition(
  experimentId,
  currentStepId,
  nextStepId,
  observations
) {
  const body = {
    experiment_id: experimentId,
    current_step_id: currentStepId,
    next_step_id: nextStepId,
    verification_observations: observations,
  };
  return USE_SUPABASE
    ? callFunction("tutor-transition", body)
    : callLegacy("/tutor/transition", body);
}

// ---------- AI Lab Supporter (Real Lab Guide) ----------

export async function verifyCheckpoint(experimentId, stepId, imageB64) {
  const body = {
    experiment_id: experimentId,
    step_id: stepId,
    image_b64: imageB64,
  };
  return USE_SUPABASE
    ? callFunction("vision-checkpoint", body)
    : callLegacy("/vision/checkpoint", body);
}

// ---------- voice ----------

/** Fetches TTS audio as a blob URL the caller can drop into Audio.src. */
export async function ttsAudioUrl(text, voiceId) {
  const body = { text, voice_id: voiceId ?? null };
  let res;
  if (USE_SUPABASE) {
    res = await fetch(`${SUPABASE_URL}/functions/v1/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } else {
    res = await fetch(`${LEGACY_BACKEND_URL}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      if (j && j.detail) detail = j.detail;
    } catch {}
    throw new Error(detail);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
