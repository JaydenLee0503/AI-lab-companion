import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

export default function App() {
  const [health, setHealth] = useState({ state: "checking" });

  useEffect(() => {
    fetch(`${BACKEND_URL}/health`)
      .then((r) => r.json())
      .then((data) => setHealth({ state: "ok", data }))
      .catch((err) => setHealth({ state: "error", error: String(err) }));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-8">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow p-8 space-y-4">
        <h1 className="text-3xl font-bold">AI Lab Companion</h1>
        <p className="text-slate-600">
          Scaffold (M0). Two modes coming: Real Lab Guide and Simulation Lab.
        </p>
        <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm">
          <div className="font-semibold mb-1">Backend /health</div>
          {health.state === "checking" && <div>checking…</div>}
          {health.state === "ok" && (
            <div className="text-emerald-700">{JSON.stringify(health.data)}</div>
          )}
          {health.state === "error" && (
            <div className="text-red-700">{health.error}</div>
          )}
        </div>
      </div>
    </main>
  );
}
