import { useEffect, useState } from "react";
import { getHealth, listExperiments } from "./api";

export default function HomePage({ onOpen, onBack }) {
  const [health, setHealth] = useState({ state: "checking" });
  const [experiments, setExperiments] = useState({ state: "loading" });

  useEffect(() => {
    getHealth()
      .then((data) => setHealth({ state: "ok", data }))
      .catch((err) => setHealth({ state: "error", error: String(err.message || err) }));
    listExperiments()
      .then((data) => setExperiments({ state: "ok", data }))
      .catch((err) =>
        setExperiments({ state: "error", error: String(err.message || err) })
      );
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              ← Home
            </button>
          )}
          <h1 className="text-3xl md:text-4xl font-bold">AI Lab Companion</h1>
          <p className="text-slate-600">
            A hands-free lab assistant for students. Pick an experiment, then choose a mode.
          </p>
          <BackendBadge health={health} />
        </header>

        <section aria-labelledby="experiments-heading" className="space-y-3">
          <h2 id="experiments-heading" className="text-xl font-semibold">
            Experiments
          </h2>
          {experiments.state === "loading" && (
            <p className="text-slate-500">Loading…</p>
          )}
          {experiments.state === "error" && (
            <ErrorCard
              title="Could not load experiments"
              detail={experiments.error}
            />
          )}
          {experiments.state === "ok" && experiments.data.length === 0 && (
            <p className="text-slate-500">No experiments found.</p>
          )}
          {experiments.state === "ok" && experiments.data.length > 0 && (
            <ul className="space-y-3">
              {experiments.data.map((e) => (
                <li
                  key={e.id}
                  className="bg-white rounded-2xl shadow p-5 space-y-3"
                >
                  <div>
                    <h3 className="text-lg font-semibold">{e.title}</h3>
                    <p className="text-sm text-slate-500">
                      Grades {e.grade_level} · ~{e.duration_minutes} min
                    </p>
                    <p className="mt-2 text-slate-700">{e.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onOpen(e.id, "simulation")}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      Simulation Lab
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpen(e.id, "real-lab")}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      Real Lab Guide
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function BackendBadge({ health }) {
  if (health.state === "checking") {
    return (
      <span className="inline-block text-xs px-2 py-1 rounded bg-slate-200 text-slate-700">
        backend: checking…
      </span>
    );
  }
  if (health.state === "ok") {
    return (
      <span className="inline-block text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800">
        backend: ok
      </span>
    );
  }
  return (
    <span className="inline-block text-xs px-2 py-1 rounded bg-red-100 text-red-800">
      backend: {health.error}
    </span>
  );
}

function ErrorCard({ title, detail }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
    >
      <div className="font-semibold">{title}</div>
      <div className="text-sm mt-1 break-words">{detail}</div>
    </div>
  );
}
