// Shared HTTP helpers for the AI Lab Companion edge functions.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

/** An error that carries an HTTP status code through to the response. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export function json(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

/**
 * Wraps a handler with CORS preflight handling and consistent error mapping.
 * HttpError -> its own status; anything else -> 500. The body is always
 * `{ detail: "..." }` so the frontend's jsonOrThrow can surface it.
 */
export function handle(
  fn: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    try {
      return await fn(req);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      const detail = err instanceof Error ? err.message : String(err);
      return json({ detail }, status);
    }
  };
}
