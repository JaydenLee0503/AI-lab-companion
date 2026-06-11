// Focus Guard coach: turns a distracting hostname into one short, kind nudge
// that pulls a student back to their lab. Called only by the Chrome extension
// when the user has opted into AI nudges. The only input is the bare hostname —
// never page content, URLs, or any personal data.

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

const SYSTEM =
  "You are Focus Guard, a warm study coach for a high-school student in the " +
  "middle of a science lab. They just opened a distracting website. Reply with " +
  "ONE short nudge (max 14 words) that names the site and kindly pulls them back " +
  "to their lab. Light, encouraging, never preachy. You may use a single emoji. " +
  "Output only the nudge text — no quotes, no preamble.";

Deno.serve(handle(async (req) => {
  const body = await req.json().catch(() => ({}));
  const host = cleanHost(body?.host);
  if (!host) {
    throw new HttpError(400, "host is required and must be a hostname");
  }

  const nudge = await chat(
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: `They opened ${host}.` },
    ],
    { temperature: 0.8, maxTokens: 40 },
  );

  // Strip any wrapping quotes/whitespace the model may add.
  const clean = nudge.replace(/^["'\s]+|["'\s]+$/g, "");
  return json({ nudge: clean });
}));
