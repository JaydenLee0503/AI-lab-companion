// Live voice tutor: returns a short-lived signed URL the browser uses to open a
// realtime session with the ElevenLabs Conversational AI agent. The ElevenLabs
// API key and agent id stay server-side.

import { handle, json } from "../_shared/http.ts";
import { agentSignedUrl } from "../_shared/elevenlabs.ts";

Deno.serve(handle(async () => {
  const signed_url = await agentSignedUrl();
  return json({ signed_url });
}));
