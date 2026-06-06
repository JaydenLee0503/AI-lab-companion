import { useEffect, useState } from "react";
import { getHealth, listExperiments } from "./api";
import {
  ErrorCard,
  Panel,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
  StatusBadge,
} from "./ui";

export default function HomePage({ onOpen, onBack, onOpenExtension }) {
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
    <PageShell
      kicker="Mission control"
      title="Choose an experiment, then a mode."
      subtitle="A hands-free lab assistant for students. Every experiment runs as a guided real lab or a Socratic simulation from the same definition."
      onBack={onBack}
      backLabel="Home"
      right={<StatusBadge state={health.state} error={health.error} />}
    >
      <section aria-labelledby="experiments-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionLabel>Experiment library</SectionLabel>
          <h2 id="experiments-heading" className="sr-only">
            Experiments
          </h2>
        </div>

        {experiments.state === "loading" && (
          <p className="text-white/60">Loading…</p>
        )}
        {experiments.state === "error" && (
          <ErrorCard
            title="Could not load experiments"
            detail={experiments.error}
          />
        )}
        {experiments.state === "ok" && experiments.data.length === 0 && (
          <p className="text-white/60">No experiments found.</p>
        )}
        {experiments.state === "ok" && experiments.data.length > 0 && (
          <ul className="grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-2">
            {experiments.data.map((e) => (
              <li key={e.id} className="flex flex-col bg-black p-6">
                <p className="text-xs font-bold uppercase text-white/50">
                  Grades {e.grade_level} · ~{e.duration_minutes} min
                </p>
                <h3 className="mt-3 text-2xl font-black leading-tight">
                  {e.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-white/70">
                  {e.summary}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <PrimaryButton onClick={() => onOpen(e.id, "real-lab")}>
                    Real Lab Guide
                  </PrimaryButton>
                  <SecondaryButton onClick={() => onOpen(e.id, "simulation")}>
                    Simulation Lab
                  </SecondaryButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="focus-heading">
        <Panel className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <SectionLabel accent="amber">Stay on mission</SectionLabel>
            <h2 id="focus-heading" className="mt-3 text-2xl font-black leading-tight">
              Focus Guard — a Chrome extension for distraction-free labs.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Get a local alert the moment a distracting site steals the active
              tab. Everything runs on your machine — no page content or personal
              data ever leaves the browser.
            </p>
          </div>
          <SecondaryButton
            onClick={onOpenExtension}
            className="shrink-0"
          >
            Get the extension
          </SecondaryButton>
        </Panel>
      </section>
    </PageShell>
  );
}
