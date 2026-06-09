import { useEffect, useState } from "react";
import { listExperiments } from "./api";
import { CHROME_STORE_URL } from "./extensionConfig";
import {
  ErrorCard,
  Panel,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
} from "./ui";

export default function HomePage({ onOpen, onBack, onOpenExtension, onOpenTutor }) {
  const [experiments, setExperiments] = useState({ state: "loading" });

  useEffect(() => {
    listExperiments()
      .then((data) => setExperiments({ state: "ok", data }))
      .catch((err) =>
        setExperiments({ state: "error", error: String(err.message || err) })
      );
  }, []);

  return (
    <PageShell
      kicker="Mission control"
      title="Three ways in. One shared core."
      subtitle="Run a guided real or simulated experiment, talk through any topic with the Socratic Tutor, or stay focused with Focus Guard."
      onBack={onBack}
      backLabel="Home"
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

      <section aria-labelledby="tutor-heading">
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
            <SectionLabel>Socratic Tutor</SectionLabel>
            <h2
              id="tutor-heading"
              className="serif"
              style={{
                margin: "14px 0 0",
                fontSize: "clamp(24px,2.6vw,32px)",
                fontWeight: 400,
                color: "#eef2f7",
              }}
            >
              Talk through math and science, your way.
            </h2>
            <p
              style={{
                marginTop: 12,
                color: "var(--silver)",
                fontWeight: 300,
                fontSize: 15,
              }}
            >
              Pick any subject and topic, then have a live, hands-free voice
              conversation with a tutor that guides you to the answer instead of
              handing it over. No experiment required.
            </p>
          </div>
          <PrimaryButton onClick={onOpenTutor}>
            Open Socratic Tutor
          </PrimaryButton>
        </Panel>
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
          {CHROME_STORE_URL ? (
            <a
              className="btn"
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get the extension
            </a>
          ) : (
            <SecondaryButton onClick={onOpenExtension}>
              Get the extension
            </SecondaryButton>
          )}
        </Panel>
      </section>
    </PageShell>
  );
}
