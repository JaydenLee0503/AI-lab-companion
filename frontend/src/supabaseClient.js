import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Treat the .env.example placeholders (or missing values) as "not configured",
// so the app shows a clear setup message instead of a confusing network error.
const isPlaceholder =
  !rawUrl ||
  !rawKey ||
  rawUrl.includes("YOUR-PROJECT") ||
  rawKey === "your-anon-public-key";

/** True when real Supabase credentials are present. */
export const IS_CONFIGURED = !isPlaceholder;

export const SUPABASE_URL = IS_CONFIGURED ? rawUrl.replace(/\/$/, "") : undefined;
export const SUPABASE_ANON_KEY = IS_CONFIGURED ? rawKey : undefined;

/** The supabase-js client, or null when credentials are missing. */
export const supabase = IS_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
