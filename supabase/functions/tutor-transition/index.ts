// Voice loop: compose one short spoken sentence that affirms the previous
// checkpoint and tells the student what to do next.

import { handle, HttpError, json } from "../_shared/http.ts";
import { chat } from "../_shared/featherless.ts";
import { resolveExperiment } from "../_shared/experiments.ts";

Deno.serve(handle(async (req) => {
  const { experiment_id, experiment, next_step_id, verification_observations } =
    await req.json();
  if (!next_step_id) {
    throw new HttpError(400, "next_step_id is required");
  }
  const exp = await resolveExperiment(experiment, experiment_id);
  const nextStep = exp.steps.find((s) => s.id === next_step_id);
  if (!nextStep) throw new HttpError(404, "next_step not found");

  const obs = verification_observations || "(no prior verification)";
  const system =
    "You are a friendly voice lab assistant for a high-school student. " +
    "Given a confirmation of the previous step and the next instruction, " +
    "produce ONE short spoken sentence (max 25 words) that briefly affirms the " +
    "previous result and then tells the student exactly what to do next. " +
    "Plain prose, no markdown, no preamble.";
  const user =
    `Experiment: ${exp.title}\n` +
    `Previous verification observed: ${obs}\n` +
    `Next step instruction: ${nextStep.instruction}\n` +
    "Write the spoken sentence now.";

  let narration = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { maxTokens: 120, temperature: 0.5 },
  );
  narration = narration.trim().replace(/^"|"$/g, "").trim();
  return json({ narration });
}));
