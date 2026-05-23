export const BACKEND_URL = "http://localhost:8000";

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

export async function getHealth() {
  return jsonOrThrow(await fetch(`${BACKEND_URL}/health`));
}

export async function listExperiments() {
  return jsonOrThrow(await fetch(`${BACKEND_URL}/experiments`));
}

export async function getExperiment(id) {
  return jsonOrThrow(await fetch(`${BACKEND_URL}/experiments/${id}`));
}

export async function tutorChat(experimentId, stepId, messages) {
  return jsonOrThrow(
    await fetch(`${BACKEND_URL}/tutor/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experiment_id: experimentId,
        step_id: stepId,
        messages,
      }),
    })
  );
}

export async function tutorTransition(experimentId, currentStepId, nextStepId, observations) {
  return jsonOrThrow(
    await fetch(`${BACKEND_URL}/tutor/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experiment_id: experimentId,
        current_step_id: currentStepId,
        next_step_id: nextStepId,
        verification_observations: observations,
      }),
    })
  );
}

export async function verifyCheckpoint(experimentId, stepId, imageB64) {
  return jsonOrThrow(
    await fetch(`${BACKEND_URL}/vision/checkpoint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experiment_id: experimentId,
        step_id: stepId,
        image_b64: imageB64,
      }),
    })
  );
}

/** Fetches TTS audio as a blob URL the caller can drop into Audio.src. */
export async function ttsAudioUrl(text, voiceId) {
  const res = await fetch(`${BACKEND_URL}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
