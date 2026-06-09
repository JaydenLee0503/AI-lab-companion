// Speech-to-text proxy. Accepts the raw recorded audio bytes (sent with the
// recording's own Content-Type) and returns { text } transcribed by ElevenLabs
// Scribe. The ElevenLabs key stays server-side.

import { handle, HttpError, json } from "../_shared/http.ts";
import { transcribe } from "../_shared/elevenlabs.ts";

Deno.serve(handle(async (req) => {
  const contentType = req.headers.get("content-type") ?? "audio/webm";
  const audio = await req.arrayBuffer();
  if (!audio || audio.byteLength === 0) {
    throw new HttpError(400, "no audio received");
  }
  const text = await transcribe(audio, contentType);
  return json({ text });
}));
