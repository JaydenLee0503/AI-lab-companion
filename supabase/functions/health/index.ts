import { handle, json } from "../_shared/http.ts";

Deno.serve(handle(() => Promise.resolve(json({ status: "ok" }))));
