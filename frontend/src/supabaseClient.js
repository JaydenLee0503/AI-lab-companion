import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when the app is configured to use the Supabase backend. */
export const USE_SUPABASE = Boolean(url && anonKey);

export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = anonKey;

/**
 * The supabase-js client, or null when env vars are missing. Callers must
 * handle null and surface a friendly "not configured" message rather than
 * crashing — see api.js.
 */
export const supabase = USE_SUPABASE ? createClient(url, anonKey) : null;
