// Featherless AI client (OpenAI-compatible): text chat + single-image vision
// verification. The API key is read from the function environment and never
// sent to the browser.

import { HttpError } from "./http.ts";

const BASE_URL = Deno.env.get("FEATHERLESS_BASE_URL") ??
  "https://api.featherless.ai/v1";
const TEXT_MODEL = Deno.env.get("FEATHERLESS_TEXT_MODEL") ??
  "google/gemma-3-27b-it";
const VISION_MODEL = Deno.env.get("FEATHERLESS_VISION_MODEL") ??
  "google/gemma-3-27b-it";

function requireKey(): string {
  const key = Deno.env.get("FEATHERLESS_API_KEY");
  if (!key) {
    throw new HttpError(
      503,
      "FEATHERLESS_API_KEY is not configured on the server.",
    );
  }
  return key;
}

// deno-lint-ignore no-explicit-any
type Message = { role: string; content: any };

export async function chat(
  messages: Message[],
  opts: { model?: string; temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const apiKey = requireKey();
  const body = {
    model: opts.model ?? TEXT_MODEL,
    messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 400,
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new HttpError(502, `Featherless network error: ${e}`);
  }
  if (res.status >= 400) {
    const text = (await res.text()).slice(0, 300);
    throw new HttpError(502, `Featherless error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new HttpError(502, "Unexpected Featherless response shape.");
  }
  return content.trim();
}

export async function visionVerify(
  imageB64: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<Record<string, unknown>> {
  const apiKey = requireKey();
  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: userPrompt },
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${imageB64}` },
        },
      ],
    },
  ];
  const body = {
    model: VISION_MODEL,
    messages,
    temperature: 0.1,
    max_tokens: 350,
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new HttpError(502, `Featherless network error: ${e}`);
  }
  if (res.status >= 400) {
    const text = (await res.text()).slice(0, 300);
    throw new HttpError(502, `Featherless error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  return extractJson(String(content));
}

/** Best-effort: find the first {...} block and parse it. */
export function extractJson(text: string): Record<string, unknown> {
  let t = text.trim().replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "");
  try {
    return JSON.parse(t);
  } catch (_) { /* fall through */ }
  const match = t.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) { /* fall through */ }
  }
  return { passed: false, observations: text.slice(0, 400) };
}
