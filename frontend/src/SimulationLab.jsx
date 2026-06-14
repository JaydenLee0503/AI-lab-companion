import { useEffect, useState } from "react";
import { getExperiment } from "./api";
import {
  ErrorCard,
  Panel,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
} from "./ui";
import VoiceTutor from "./VoiceTutor";

// Simulation Lab — the in-lab Socratic tutor. It runs on the SAME ElevenLabs
// Conversational AI agent as the standalone tutor (one realtime session does
// speech-in, reasoning, and read-aloud). VoiceTutor takes { exp, step }: it
// builds the per-step Socratic context, and when the student changes step it
// re-steers the live session with a contextual update — no STT/TTS/LLM pipeline.
export default function SimulationLab({ experimentId, experiment, onBack }) {
  const [exp, setExp] = useState(experiment ?? null);
  const [loadError, setLoadError] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  // The tutor flags readiness for the current step via its client tool; that
  // glows the Next-step button (reset whenever the step changes).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStepIndex(0);
    if (experiment) {
      setExp(experiment);
      return;
    }
    getExperiment(experimentId)
      .then(setExp)
      .catch((e) => setLoadError(String(e.message || e)));
  }, [experimentId, experiment]);

  useEffect(() => {
    setReady(false);
  }, [stepIndex]);

  const step = exp?.steps[stepIndex];

  if (loadError) {
    return (
      <PageShell title="Simulation Lab" onBack={onBack} backLabel="Experiments">
        <ErrorCard title="Could not load experiment" detail={loadError} />
      </PageShell>
    );
  }
  if (!exp || !step) {
    return (
      <PageShell title="Simulation Lab" onBack={onBack} backLabel="Experiments">
        <p className="text-white/60">Loading…</p>
      </PageShell>
    );
  }

  const canAdvance = stepIndex < exp.steps.length - 1;

  return (
    <PageShell
      kicker="Socratic Tutor"
      title={exp.title}
      onBack={onBack}
      backLabel="Experiments"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel>
          Step {stepIndex + 1} / {exp.steps.length} · {step.id}
        </SectionLabel>
      </div>

      <Panel>
        <h3 className="deck-label">Instruction</h3>
        <p style={{ marginTop: 12, fontSize: 18, color: "var(--text)" }}>
          {step.instruction}
        </p>
        {step.simulation && (
          <p
            style={{
              marginTop: 10,
              fontStyle: "italic",
              color: "var(--silver)",
              fontSize: 14,
            }}
          >
            You observe: {step.simulation.observation}
          </p>
        )}
      </Panel>

      <Panel aria-label="Tutor conversation">
        <h3 className="deck-label">Live tutor</h3>
        <p style={{ marginTop: 8, color: "var(--silver)", fontSize: 14 }}>
          Start the session, then talk or type — the tutor guides you with
          questions and reads each reply aloud. It follows along as you move
          through the steps.
        </p>
        <div style={{ marginTop: 14 }}>
          {/* Keyed by experiment so a different experiment starts a fresh
              session; NOT keyed by step, so one session spans all steps and the
              step change is sent as a contextual update inside VoiceTutor. */}
          <VoiceTutor
            key={exp.id}
            exp={exp}
            step={step}
            onReady={() => setReady(true)}
            idleHint="Tap start, then talk or type. Powered by ElevenLabs."
            startLabel="Start live tutor"
          />
        </div>
      </Panel>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <SecondaryButton
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
        >
          ← Previous step
        </SecondaryButton>
        <PrimaryButton
          onClick={() => setStepIndex((i) => Math.min(exp.steps.length - 1, i + 1))}
          disabled={!canAdvance}
          className={ready && canAdvance ? "go" : ""}
        >
          Next step →
        </PrimaryButton>
      </div>
    </PageShell>
  );
}
