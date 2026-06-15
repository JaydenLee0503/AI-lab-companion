// AI Lab Supporter (Real Lab Guide): verify one webcam frame against a step's
// checkpoint criteria with the Featherless VLM.

import { corsHeaders, handle, HttpError, json } from "../_shared/http.ts";
import { visionVerify } from "../_shared/featherless.ts";
import { getStep, resolveExperiment, Step } from "../_shared/experiments.ts";

function visionUserPrompt(step: Step): string {
  const cp = step.checkpoint;
  if (!cp) return "Describe the image briefly.";
  const criteria = cp.success_criteria.map((c) => `- ${c}`).join("\n");
  return (
    `You are encouraging a student through a lab setup at step "${step.id}".\n` +
    `Expected scene: ${cp.expected_state}\n` +
    `Things that suggest they are on the right track (these are GUIDES, not a ` +
    `strict checklist):\n` +
    `${criteria}\n\n` +
    `Default to passing. Set "passed": true if the scene plausibly matches the ` +
    `expected setup, OR if you are unsure, OR if most of the relevant elements ` +
    `are present even partially. The image may be blurry, dim, or at an awkward ` +
    `angle — give the student the benefit of the doubt. Only set ` +
    `"passed": false when the setup is clearly and obviously wrong (a totally ` +
    `different scene, a missing essential item, or a visible safety hazard).\n\n` +
    `Respond with ONLY a JSON object of the form:\n` +
    `{"passed": <true|false>, "observations": "<1-2 sentence description of what you see>"}\n` +
    `Do not include any other text.`
  );
}

Deno.serve(handle(async (req) => {
  const { experiment_id, experiment, step_id, image_b64 } = await req.json();
  if (!step_id || !image_b64) {
    throw new HttpError(400, "step_id and image_b64 are required");
  }
  const exp = await resolveExperiment(experiment, experiment_id);
  const step = getStep(exp, step_id);
  if (!step.checkpoint) {
    throw new HttpError(400, "this step has no checkpoint defined");
  }

  const system =
    "You are a warm, encouraging lab coach, not a strict grader. " +
    "You glance at a webcam image and decide whether a student can move on. " +
    "Be very lenient: pass whenever the setup is roughly right or you are " +
    "uncertain, forgiving poor lighting, blur, and odd angles. Only hold a " +
    "student back when something is clearly, obviously wrong or unsafe.";

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
