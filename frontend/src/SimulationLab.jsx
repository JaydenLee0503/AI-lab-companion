import { useEffect, useState } from "react";
import { getExperiment, ttsAudioUrl, tutorChat } from "./api";
import {
  ErrorCard,
  Panel,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
} from "./ui";

const READY_TAG = "[READY_FOR_NEXT_STEP]";

export default function SimulationLab({ experimentId, onBack }) {
  const [exp, setExp] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState([]); // {role, content}
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);
  const [voiceOn, setVoiceOn] = useState(false);

  useEffect(() => {
    setHistory([]);
    setStepIndex(0);
    getExperiment(experimentId)
      .then(setExp)
      .catch((e) => setLoadError(String(e.message || e)));
  }, [experimentId]);

  const step = exp?.steps[stepIndex];

  // When step changes, kick off an opening tutor turn automatically.
  useEffect(() => {
    if (!exp || !step) return;
    setHistory([]);
    setError(null);
    let cancelled = false;
    (async () => {
      setThinking(true);
      try {
        const { reply } = await tutorChat(exp.id, step.id, []);
        if (cancelled) return;
        const visible = stripReadyTag(reply);
        setHistory([{ role: "assistant", content: visible }]);
        if (voiceOn) speak(visible).catch(() => {});
      } catch (e) {
        if (!cancelled) setError(String(e.message || e));
      } finally {
        if (!cancelled) setThinking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exp?.id, step?.id]);

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

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    setError(null);
    const next = [...history, { role: "user", content: text }];
    setHistory(next);
    setThinking(true);
    try {
      const { reply } = await tutorChat(exp.id, step.id, next);
      const ready = reply.includes(READY_TAG);
      const visible = stripReadyTag(reply);
      setHistory((h) => [...h, { role: "assistant", content: visible, ready }]);
      if (voiceOn) speak(visible).catch(() => {});
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setThinking(false);
    }
  }

  const canAdvance = stepIndex < exp.steps.length - 1;
  const tutorSaysReady = history.some((m) => m.role === "assistant" && m.ready);

  return (
    <PageShell
      kicker="Socratic Tutor"
      title={exp.title}
      onBack={onBack}
      backLabel="Experiments"
      right={<VoiceToggle on={voiceOn} setOn={setVoiceOn} />}
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
        <div
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
          aria-live="polite"
        >
          {history.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} ready={m.ready} />
          ))}
          {thinking && <Bubble role="assistant" content="…" />}
        </div>
        {error && (
          <div style={{ marginTop: 16 }}>
            <ErrorCard title="Tutor error" detail={error} />
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <label htmlFor="tutor-input" className="sr-only">
            Your reply
          </label>
          <input
            id="tutor-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Ask a question or share what you think…"
            className="field"
          />
          <PrimaryButton onClick={send} disabled={thinking || !input.trim()}>
            Send
          </PrimaryButton>
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
          className={tutorSaysReady ? "go" : ""}
        >
          Next step →
        </PrimaryButton>
      </div>
    </PageShell>
  );
}

function Bubble({ role, content, ready }) {
  const mine = role === "user";
  return (
    <div className={"msg " + (mine ? "me" : "bot")}>
      <div className="body">
        <span style={{ whiteSpace: "pre-wrap" }}>{content}</span>
        {ready && <span className="ready-tag">ready to advance</span>}
      </div>
    </div>
  );
}

function VoiceToggle({ on, setOn }) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
      />
      Speak replies
    </label>
  );
}

async function speak(text) {
  if (!text || !text.trim()) return;
  const url = await ttsAudioUrl(text);
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url));
  await audio.play();
}

function stripReadyTag(s) {
  return s.replaceAll(READY_TAG, "").trim();
}
