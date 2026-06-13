// Public Focus Guard config. These are browser-safe values — the SAME ones the
// web app ships to every visitor (the anon key is gated by row-level security).
// No secret keys here, ever. Fill in your project's values before building the
// zip; until then, AI nudges silently fall back to the built-in local message.
//
// Loaded by background.js via importScripts("config.js").
self.FOCUS_GUARD = {
  SUPABASE_URL: "https://bekctltzlhrfaqneyjeg.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJla2N0bHR6bGhyZmFxbmV5amVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NTM5MDUsImV4cCI6MjA5NjQyOTkwNX0.yjjuTFQ79vlu71e2OERph_CnJrfuK_xduZenWpVLCvQ",
};
