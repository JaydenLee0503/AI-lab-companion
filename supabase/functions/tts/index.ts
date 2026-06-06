// Text-to-speech proxy. Returns audio/mpeg bytes for the frontend to play.

import { corsHeaders, handle, HttpError } from "../_shared/http.ts";
import { synthesize } from "../_shared/elevenlabs.ts";

Deno.serve(handle(async (req) => {
  const { text, voice_id } = await req.json();
  if (!text || !String(text).trim()) {
    throw new HttpError(400, "text is empty");
  }
  const audio = await synthesize(String(text), voice_id ?? null);
  return new Response(audio, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
  });
}));
