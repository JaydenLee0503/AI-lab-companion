// Socratic Tutor (Simulation Lab): one tutor turn for a given experiment step.

import { handle, HttpError, json } from "../_shared/http.ts";
import { chat } from "../_shared/featherless.ts";
import { Experiment, getStep, resolveExperiment, Step } from "../_shared/experiments.ts";

function systemPrompt(exp: Experiment, step: Step): string {
  const sim = step.simulation;
  const observation = sim?.observation ??
    "(no simulated observation defined for this step)";
  const prompts = sim
    ? sim.tutor_prompts.map((p) => `- ${p}`).join("\n")
    : "(no tutor prompts defined for this step)";
  return (
    `You are a patient high-school science tutor running a virtual Simulation Lab. ` +
    `The student is doing the experiment: "${exp.title}". ` +
    `They are on step "${step.id}": ${step.instruction}\n\n` +
    `What the student would observe at this step: ${observation}\n\n` +
    `Useful Socratic prompts you may draw from (do not list them verbatim):\n` +
    `${prompts}\n\n` +
    `Guide the student with short Socratic questions. Never give the answer outright. ` +
    `Keep replies to 1-3 sentences. When the student shows understanding, end your ` +
    `reply with the exact tag [READY_FOR_NEXT_STEP] on its own line.`
  );
}

Deno.serve(handle(async (req) => {
  const { experiment_id, experiment, step_id, messages } = await req.json();
  if (!step_id) {
    throw new HttpError(400, "step_id is required");
  }
  const exp = await resolveExperiment(experiment, experiment_id);
  const step = getStep(exp, step_id);

  const chatMessages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt(exp, step) },
  ];
  const history = Array.isArray(messages) ? messages : [];
  if (history.length === 0) {
    const opener = step.simulation?.observation ?? step.instruction;
    chatMessages.push({
      role: "user",
      content: `I'm starting this step. ${opener}`,
    });
  } else {
    for (const m of history) {
      chatMessages.push({ role: m.role, content: m.content });
    }
  }

  const reply = await chat(chatMessages);
  return json({ reply });
}));
