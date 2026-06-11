// Loads experiment definitions from the Supabase `experiments` table so the
// edge functions can build prompts from the shared core. Uses the service-role
// key, which is injected automatically into the function runtime and never
// leaves the server.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { HttpError } from "./http.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

export interface Checkpoint {
  expected_state: string;
  success_criteria: string[];
  failure_hints: string[];
}

export interface Simulation {
  observation: string;
  tutor_prompts: string[];
}

export interface Step {
  id: string;
  instruction: string;
  checkpoint?: Checkpoint | null;
  simulation?: Simulation | null;
}

export interface Experiment {
  id: string;
  title: string;
  summary: string;
  grade_level: string;
  duration_minutes: number;
  steps: Step[];
  [key: string]: unknown;
}

export async function loadExperiment(id: string): Promise<Experiment> {
  const { data, error } = await supabase
    .from("experiments")
    .select("data")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new HttpError(502, `Database error: ${error.message}`);
  if (!data) throw new HttpError(404, "experiment not found");
  return data.data as Experiment;
}

/**
 * Resolve the experiment for a request. Custom labs are generated on the fly and
 * are NOT in the DB, so the browser sends the whole experiment inline; library
 * labs send only an id and we load it. Inline data is trusted only to drive the
 * tutor/vision prompts — it grants no DB access.
 */
export async function resolveExperiment(
  inline: unknown,
  id: unknown,
): Promise<Experiment> {
  if (inline && typeof inline === "object") {
    const exp = inline as Experiment;
    if (!Array.isArray(exp.steps) || exp.steps.length === 0) {
      throw new HttpError(400, "inline experiment is missing steps");
    }
    return exp;
  }
  if (typeof id === "string" && id) return loadExperiment(id);
  throw new HttpError(400, "experiment or experiment_id is required");
}

export function getStep(exp: Experiment, stepId: string): Step {
  const step = exp.steps.find((s) => s.id === stepId);
  if (!step) throw new HttpError(404, "step not found");
  return step;
}
