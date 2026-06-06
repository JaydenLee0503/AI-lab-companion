// ElevenLabs text-to-speech. Returns MP3 bytes. The API key is read from the
// function environment and never reaches the browser.

import { HttpError } from "./http.ts";

const VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID") ?? "21m00Tcm4TlvDq8ikWAM";
const MODEL = Deno.env.get("ELEVENLABS_MODEL") ?? "eleven_turbo_v2_5";

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
