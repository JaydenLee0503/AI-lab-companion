// Focus Guard page summarizer: takes the visible text of ONE web page the
// student is currently looking at and returns a short, plain-language summary.
//
// Called only by the Chrome extension, and only when the student has both
// opted into AI features AND clicked "Summarize this page" — i.e. an explicit,
// per-page action. Unlike the rest of Focus Guard (hostname only), this path
// does receive page text; it is never stored here, only forwarded to the model
// to produce the summary returned in the response.

import { handle, HttpError, json } from "../_shared/http.ts";
import { chat } from "../_shared/featherless.ts";

const MAX_INPUT = 8000; // chars; the extension already truncates, double-guard.

function cleanText(raw: unknown): string {
  if (typeof raw !== "string") return "";
  let out = "";
  for (const ch of raw) {
    const code = ch.codePointAt(0) ?? 0;
    // Keep tab/newline (handled by collapse below) but drop other control bytes.
    out += code < 0x20 && ch !== "\n" && ch !== "\t" ? " " : ch;
  }
  return out.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim()
    .slice(0, MAX_INPUT);
}

function cleanTitle(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, 200);
}

const SYSTEM =
  "You help a high-school student who got distracted during a science lab " +
  "quickly understand the web page in front of them so they can decide if it " +
  "matters now or can wait. Given the page's visible text, write 2–3 short " +
  "bullet points (each starting with '• ') capturing what the page is about. " +
  "Keep the whole thing under 50 words, plain and neutral. Output only the " +
  "bullets — no preamble, no closing remark.";

Deno.serve(handle(async (req) => {
  const body = await req.json().catch(() => ({}));
  const text = cleanText(body?.text);
  const title = cleanTitle(body?.title);
  if (text.length < 40) {
    throw new HttpError(400, "Not enough readable text on this page to summarize.");
  }

  const summary = await chat(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: title ? `Page title: ${title}\n\nPage text:\n${text}` : text,
      },
    ],
    { temperature: 0.3, maxTokens: 160 },
  );

  return json({ summary: summary.trim() });
}));
