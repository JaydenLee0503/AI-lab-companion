// Data layer for the NovaMind AI frontend (Supabase backend).
//
// Experiments are read directly from the public `experiments` table (anon key +
// RLS). AI/voice calls go to Supabase Edge Functions, which hold the Featherless
// and ElevenLabs keys server-side. No secret ever reaches the browser.

import {
  IS_CONFIGURED,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  supabase,
} from "./supabaseClient";

const NOT_CONFIGURED =
  "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local with your project's real values, then restart the dev server.";

function ensureConfigured() {
  if (!IS_CONFIGURED) throw new Error(NOT_CONFIGURED);
}

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

const functionHeaders = () => ({
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
});

/** POST to a Supabase Edge Function and parse JSON. */
async function callFunction(name, body) {
  ensureConfigured();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: functionHeaders(),
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
  ensureConfigured();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/health`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  return jsonOrThrow(res);
}

// ---------- experiments (shared core) ----------

export async function listExperiments() {
  ensureConfigured();
  const { data, error } = await supabase
    .from("experiments")
    .select("data")
    .order("id");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => summarize(row.data));
}

export async function getExperiment(id) {
  ensureConfigured();
  const { data, error } = await supabase
    .from("experiments")
    .select("data")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("experiment not found");
  return data.data;
}

// ---------- Socratic Tutor (Simulation Lab) ----------

export async function tutorChat(experimentId, stepId, messages) {
  return callFunction("tutor-chat", {
    experiment_id: experimentId,
    step_id: stepId,
    messages,
  });
}

export async function tutorTransition(
  experimentId,
  currentStepId,
  nextStepId,
  observations
) {
  return callFunction("tutor-transition", {
    experiment_id: experimentId,
    current_step_id: currentStepId,
    next_step_id: nextStepId,
    verification_observations: observations,
  });
}

// ---------- AI Lab Supporter (Real Lab Guide) ----------

export async function verifyCheckpoint(experimentId, stepId, imageB64) {
  return callFunction("vision-checkpoint", {
    experiment_id: experimentId,
    step_id: stepId,
    image_b64: imageB64,
  });
}

// ---------- voice ----------

/** Fetches TTS audio as a blob URL the caller can drop into Audio.src. */
export async function ttsAudioUrl(text, voiceId) {
  ensureConfigured();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/tts`, {
    method: "POST",
    headers: functionHeaders(),
    body: JSON.stringify({ text, voice_id: voiceId ?? null }),
  });
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
