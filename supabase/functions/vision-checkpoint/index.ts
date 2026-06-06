// AI Lab Supporter (Real Lab Guide): verify one webcam frame against a step's
// checkpoint criteria with the Featherless VLM.

import { corsHeaders, handle, HttpError, json } from "../_shared/http.ts";
import { visionVerify } from "../_shared/featherless.ts";
import { getStep, loadExperiment, Step } from "../_shared/experiments.ts";

function visionUserPrompt(step: Step): string {
  const cp = step.checkpoint;
  if (!cp) return "Describe the image briefly.";
  const criteria = cp.success_criteria.map((c) => `- ${c}`).join("\n");
  return (
    `You are verifying a student's lab setup at step "${step.id}".\n` +
    `Expected scene: ${cp.expected_state}\n` +
    `Success criteria (ALL must be true to pass):\n` +
    `${criteria}\n\n` +
    `Respond with ONLY a JSON object of the form:\n` +
    `{"passed": <true|false>, "observations": "<1-2 sentence description of what you see>"}\n` +
    `Do not include any other text.`
  );
}

Deno.serve(handle(async (req) => {
  const { experiment_id, step_id, image_b64 } = await req.json();
  if (!experiment_id || !step_id || !image_b64) {
    throw new HttpError(
      400,
      "experiment_id, step_id and image_b64 are required",
    );
  }
  const exp = await loadExperiment(experiment_id);
  const step = getStep(exp, step_id);
  if (!step.checkpoint) {
    throw new HttpError(400, "this step has no checkpoint defined");
  }

  const system =
    "You are a careful but encouraging lab safety verifier. " +
    "You judge a webcam image against a list of success criteria. " +
    "Be lenient about lighting and angle, strict about the actual physical state.";

  const result = await visionVerify(image_b64, system, visionUserPrompt(step));
  const passed = Boolean(result.passed);
  const observations = String(result.observations ?? "").trim() ||
    "No description.";
  let hint: string | null = null;
  if (!passed && step.checkpoint.failure_hints.length > 0) {
    hint = step.checkpoint.failure_hints[0];
  }
  return json({ passed, observations, hint }, 200, corsHeaders);
}));
