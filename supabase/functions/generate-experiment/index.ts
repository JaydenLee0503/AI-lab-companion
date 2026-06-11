// Custom Lab generator: turns a user's topic (+ optional written instructions)
// into a complete, household-safe experiment definition matching the shared
// schema, so it can run through either the Real Lab Guide or the Simulation Lab.
// LLM knowledge only (no web search). The Featherless key stays server-side.

import { handle, HttpError, json } from "../_shared/http.ts";
import { chat, extractJson } from "../_shared/featherless.ts";

const SYSTEM = `You are a high-school science curriculum designer. Given a topic,
you design ONE safe, doable experiment and return it as STRICT JSON only — no
prose, no markdown, no code fences.

Hard safety rules (refuse if the topic cannot meet them):
- Cheap, common household materials only.
- NO open flame, NO heating to dangerous temperatures, NO hazardous or reactive
  chemicals (e.g. bleach+ammonia, strong acids/bases), NO electricity beyond a
  small battery, nothing that can injure a teenager working alone at home.
If the request is unsafe, not a science experiment, or impossible with household
items, return exactly: {"refused": true, "reason": "<one short sentence>"}

Otherwise return an object with EXACTLY this shape:
{
  "title": string,
  "summary": string,                 // one or two sentences
  "grade_level": string,             // e.g. "8-10"
  "duration_minutes": number,
  "materials": [{ "name": string, "quantity": string, "notes"?: string }],
  "safety": [string, ...],
  "steps": [                         // 3 to 6 steps
    {
      "instruction": string,         // what the student physically does
      "checkpoint": {                // used by the webcam Real Lab Guide
        "expected_state": string,    // what the scene should look like now
        "success_criteria": [string, ...],  // visually checkable, ALL must hold
        "failure_hints": [string, ...]      // gentle nudges if it's wrong
      },
      "simulation": {                // used by the simulated Socratic Tutor
        "observation": string,       // what the student would observe this step
        "tutor_prompts": [string, ...] // 2-3 Socratic questions, not answers
      }
    }
  ]
}
Every step MUST include both "checkpoint" and "simulation". Keep success_criteria
things a camera could actually confirm. Output JSON and nothing else.`;

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "lab";
}

// deno-lint-ignore no-explicit-any
function isStr(v: any): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

// deno-lint-ignore no-explicit-any
function validateAndNormalize(raw: any) {
  if (!raw || typeof raw !== "object") {
    throw new HttpError(502, "The model did not return a valid experiment.");
  }
  if (!isStr(raw.title) || !Array.isArray(raw.steps) || raw.steps.length === 0) {
    throw new HttpError(
      502,
      "The generated lab was incomplete. Try a more specific topic.",
    );
  }
  const usedIds = new Set<string>();
  // deno-lint-ignore no-explicit-any
  const steps = raw.steps.map((s: any, i: number) => {
    if (!isStr(s?.instruction)) {
      throw new HttpError(502, "A generated step was missing its instruction.");
    }
    const cp = s.checkpoint ?? {};
    const sim = s.simulation ?? {};
    let id = slug(s.id || s.instruction.split(" ").slice(0, 3).join("-"));
    while (usedIds.has(id)) id = `${id}-${i}`;
    usedIds.add(id);
    return {
      id,
      instruction: String(s.instruction).trim(),
      checkpoint: {
        expected_state: String(cp.expected_state ?? s.instruction).trim(),
        success_criteria: Array.isArray(cp.success_criteria) &&
            cp.success_criteria.length
          ? cp.success_criteria.map(String)
          : ["The setup described in the instruction is visible."],
        failure_hints: Array.isArray(cp.failure_hints)
          ? cp.failure_hints.map(String)
          : [],
      },
      simulation: {
        observation: String(sim.observation ?? s.instruction).trim(),
        tutor_prompts: Array.isArray(sim.tutor_prompts) &&
            sim.tutor_prompts.length
          ? sim.tutor_prompts.map(String)
          : ["What do you expect to happen here, and why?"],
      },
    };
  });

  const rand = Math.random().toString(36).slice(2, 6);
  return {
    id: `custom-${slug(raw.title)}-${rand}`,
    title: String(raw.title).trim(),
    summary: isStr(raw.summary) ? String(raw.summary).trim() : "",
    grade_level: isStr(raw.grade_level) ? String(raw.grade_level).trim() : "9-12",
    duration_minutes: Number(raw.duration_minutes) > 0
      ? Math.round(Number(raw.duration_minutes))
      : 20,
    materials: Array.isArray(raw.materials) ? raw.materials : [],
    safety: Array.isArray(raw.safety) ? raw.safety.map(String) : [],
    learning_goals: Array.isArray(raw.learning_goals)
      ? raw.learning_goals.map(String)
      : [],
    custom: true,
    steps,
  };
}

Deno.serve(handle(async (req) => {
  const { topic, instructions } = await req.json();
  if (!isStr(topic)) {
    throw new HttpError(400, "topic is required");
  }
  const user = `Topic: ${String(topic).trim()}` +
    (isStr(instructions)
      ? `\n\nThe student also provided these instructions/constraints — honor them where safe:\n${String(instructions).trim()}`
      : "");

  const reply = await chat(
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    { temperature: 0.6, maxTokens: 1600 },
  );

  const parsed = extractJson(reply);
  if (parsed.refused === true) {
    return json({
      refused: true,
      reason: isStr(parsed.reason)
        ? parsed.reason
        : "That topic isn't a safe household experiment.",
    });
  }
  const experiment = validateAndNormalize(parsed);
  return json({ experiment });
}));
