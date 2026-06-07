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
          <p style={{ color: "var(--silver)" }}>Loading…</p>
        )}
        {experiments.state === "error" && (
          <ErrorCard
            title="Could not load experiments"
            detail={experiments.error}
          />
        )}
        {experiments.state === "ok" && experiments.data.length === 0 && (
          <p style={{ color: "var(--silver)" }}>No experiments found.</p>
        )}
        {experiments.state === "ok" && experiments.data.length > 0 && (
          <ul className="exp-grid">
            {experiments.data.map((e) => (
              <li key={e.id} className="exp-card">
                <p className="exp-meta">
                  Grades {e.grade_level} · ~{e.duration_minutes} min
                </p>
                <h3>{e.title}</h3>
                <p>{e.summary}</p>
                <div className="exp-actions">
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
        <Panel
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <SectionLabel accent="amber">Stay on mission</SectionLabel>
            <h2
              id="focus-heading"
              className="serif"
              style={{
                margin: "14px 0 0",
                fontSize: "clamp(24px,2.6vw,32px)",
                fontWeight: 400,
                color: "#eef2f7",
              }}
            >
              Focus Guard — a Chrome extension for distraction-free labs.
            </h2>
            <p
              style={{
                marginTop: 12,
                color: "var(--silver)",
                fontWeight: 300,
                fontSize: 15,
              }}
            >
              Get a local alert the moment a distracting site steals the active
              tab. Everything runs on your machine — no page content or personal
              data ever leaves the browser.
            </p>
          </div>
          <SecondaryButton onClick={onOpenExtension}>
            Get the extension
          </SecondaryButton>
        </Panel>
      </section>
    </PageShell>
  );
}
