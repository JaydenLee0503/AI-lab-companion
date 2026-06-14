// Focus Guard coach: turns a distracting hostname into one short, kind nudge
// that pulls a student back to their lab. Called only by the Chrome extension
// when the user has opted into AI nudges. Inputs are the bare hostname plus,
// optionally, a short focus note the student typed themselves (what they're
// working on) and a tone preference — never page content, URLs, browsing
// history, or any data the student didn't type in.

import { handle, HttpError, json } from "../_shared/http.ts";
import { chat } from "../_shared/featherless.ts";

// Cheap sanity guard so the function can't be used as a general text generator.
function cleanHost(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const host = raw.trim().toLowerCase().replace(/^www\./, "");
  // hostname-ish only: letters, digits, dots, hyphens; reasonable length.
  if (!/^[a-z0-9.-]{1,253}$/.test(host) || !host.includes(".")) return "";
  return host;
}

// The student's own short note of what they're working on. Control characters
// are dropped (code-point filter, no literal control chars in source) and the
// result is capped, so it can only ever be a brief phrase — not a payload.
function cleanFocus(raw: unknown): string {
  if (typeof raw !== "string") return "";
  let out = "";
  for (const ch of raw) {
    out += (ch.codePointAt(0) ?? 0) < 0x20 ? " " : ch;
  }
  return out.replace(/\s+/g, " ").trim().slice(0, 140);
}

const TONES: Record<string, string> = {
  gentle: "Warm, gentle and encouraging.",
  strict: "Firm and no-nonsense, but still kind — like a focused coach.",
  funny: "Playful and a little funny, with light humor.",
};

function cleanTone(raw: unknown): string {
  return typeof raw === "string" && raw in TONES ? raw : "gentle";
}

const SYSTEM =
  "You are Focus Guard, a study coach for a high-school student in the middle " +
  "of a science lab. They just opened a distracting website. Reply with ONE " +
  "short nudge (max 16 words) that names the site and kindly pulls them back to " +
  "their lab. If you are told what they were working on, reference it " +
  "specifically. Never preachy. You may use a single emoji. Output only the " +
  "nudge text — no quotes, no preamble.";

Deno.serve(handle(async (req) => {
  const body = await req.json().catch(() => ({}));
  const host = cleanHost(body?.host);
  if (!host) {
    throw new HttpError(400, "host is required and must be a hostname");
  }
  const focus = cleanFocus(body?.focus);
  const tone = cleanTone(body?.tone);

  const context = focus
    ? `They opened ${host}. They were working on: "${focus}".`
    : `They opened ${host}.`;

  const nudge = await chat(
    [
      { role: "system", content: `${SYSTEM} Tone: ${TONES[tone]}` },
      { role: "user", content: context },
    ],
    { temperature: 0.8, maxTokens: 48 },
  );

  // Strip any wrapping quotes/whitespace the model may add.
  const clean = nudge.replace(/^["'\s]+|["'\s]+$/g, "");
  return json({ nudge: clean });
}));
