// ElevenLabs text-to-speech. Returns MP3 bytes. The API key is read from the
// function environment and never reaches the browser.

import { HttpError } from "./http.ts";

const VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID") ?? "21m00Tcm4TlvDq8ikWAM";
const MODEL = Deno.env.get("ELEVENLABS_MODEL") ?? "eleven_turbo_v2_5";
const STT_MODEL = Deno.env.get("ELEVENLABS_STT_MODEL") ?? "scribe_v1";
const AGENT_ID = Deno.env.get("ELEVENLABS_AGENT_ID");

function requireKey(): string {
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) {
    throw new HttpError(
      503,
      "ELEVENLABS_API_KEY is not configured on the server.",
    );
  }
  return key;
}

export async function synthesize(
  text: string,
  voiceId?: string | null,
): Promise<ArrayBuffer> {
  const apiKey = requireKey();
  const voice = voiceId || VOICE_ID;
  const body = {
    text,
    model_id: MODEL,
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
  };

  let res: Response;
  try {
    res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
  } catch (e) {
    throw new HttpError(502, `ElevenLabs network error: ${e}`);
  }
  if (res.status >= 400) {
    const t = (await res.text()).slice(0, 300);
    throw new HttpError(502, `ElevenLabs error ${res.status}: ${t}`);
  }
  return await res.arrayBuffer();
}

/**
 * Speech-to-text via ElevenLabs Scribe. Takes the raw recorded audio bytes plus
 * their MIME type and returns the transcript. The API key never leaves the
 * server.
 */
export async function transcribe(
  audio: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const apiKey = requireKey();
  const form = new FormData();
  form.append("file", new Blob([audio], { type: contentType || "audio/webm" }), "audio");
  form.append("model_id", STT_MODEL);

  let res: Response;
  try {
    res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: form,
    });
  } catch (e) {
    throw new HttpError(502, `ElevenLabs network error: ${e}`);
  }
  if (res.status >= 400) {
    const t = (await res.text()).slice(0, 300);
    throw new HttpError(502, `ElevenLabs STT error ${res.status}: ${t}`);
  }
  const data = await res.json();
  const text = data?.text;
  if (typeof text !== "string") {
    throw new HttpError(502, "Unexpected ElevenLabs STT response shape.");
  }
  return text.trim();
}

/**
 * Mints a short-lived signed WebSocket URL for a private ElevenLabs
 * Conversational AI agent. The browser connects with this URL, so the API key
 * and agent id never reach the client.
 */
export async function agentSignedUrl(): Promise<string> {
  const apiKey = requireKey();
  if (!AGENT_ID) {
    throw new HttpError(
      503,
      "ELEVENLABS_AGENT_ID is not configured on the server.",
    );
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
      { headers: { "xi-api-key": apiKey } },
    );
  } catch (e) {
    throw new HttpError(502, `ElevenLabs network error: ${e}`);
  }
  if (res.status >= 400) {
    const t = (await res.text()).slice(0, 300);
    throw new HttpError(502, `ElevenLabs agent error ${res.status}: ${t}`);
  }
  const data = await res.json();
  const url = data?.signed_url;
  if (typeof url !== "string") {
    throw new HttpError(502, "Unexpected ElevenLabs signed-url response shape.");
  }
  return url;
}
