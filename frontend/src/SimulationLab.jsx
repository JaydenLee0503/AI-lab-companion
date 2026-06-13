import { useEffect, useRef, useState } from "react";
import { getExperiment, transcribeAudio, tutorChat } from "./api";
import {
  ErrorCard,
  Panel,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
} from "./ui";
import { speak, stopSpeaking } from "./speak";

const READY_TAG = "[READY_FOR_NEXT_STEP]";

export default function SimulationLab({ experimentId, experiment, onBack }) {
  const isCustom = !!experiment;
  const [exp, setExp] = useState(experiment ?? null);
  const [loadError, setLoadError] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState([]); // {role, content}
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);
  const [voiceOn, setVoiceOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    setHistory([]);
    setStepIndex(0);
    if (experiment) {
      setExp(experiment);
      return;
    }
    getExperiment(experimentId)
      .then(setExp)
      .catch((e) => setLoadError(String(e.message || e)));
  }, [experimentId, experiment]);

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
        const { reply } = await tutorChat(
          exp.id,
          step.id,
          [],
          isCustom ? exp : undefined
        );
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

  // Stop spoken replies when "Speak replies" is turned off or the lab closes.
  useEffect(() => {
    if (!voiceOn) stopSpeaking();
    return stopSpeaking;
  }, [voiceOn]);

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

  async function send(textArg) {
    // A click handler passes an event; fall back to the input box in that case.
    const text = (typeof textArg === "string" ? textArg : input).trim();
    if (!text || thinking) return;
    if (typeof textArg !== "string") setInput("");
    setError(null);
    const next = [...history, { role: "user", content: text }];
    setHistory(next);
    setThinking(true);
    try {
      const { reply } = await tutorChat(
        exp.id,
        step.id,
        next,
        isCustom ? exp : undefined
      );
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

  // Hold-to-talk: record from the mic, transcribe via Scribe, then auto-send so
  // the student can run the whole tutor conversation hands-free.
  async function toggleMic() {
    if (transcribing || thinking) return;
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        if (blob.size === 0) return;
        setTranscribing(true);
        try {
          const text = (await transcribeAudio(blob)).trim();
          if (text) await send(text);
        } catch (e) {
          setError(String(e.message || e));
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setError(null);
    } catch {
      setError("Microphone access was denied or is unavailable.");
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
            placeholder="Ask a question, or tap the mic to speak…"
            className="field"
          />
          <MicButton
            recording={recording}
            transcribing={transcribing}
            disabled={thinking}
            onClick={toggleMic}
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

function MicButton({ recording, transcribing, disabled, onClick }) {
  const label = transcribing
    ? "Transcribing…"
    : recording
      ? "Stop recording"
      : "Speak your reply";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || transcribing}
      className="field"
      aria-label={label}
      title={label}
      style={{
        flex: "0 0 auto",
        minWidth: 52,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled || transcribing ? "default" : "pointer",
        borderColor: recording ? "#f87171" : undefined,
        color: recording ? "#f87171" : undefined,
      }}
    >
      {transcribing ? "…" : recording ? "■" : "🎤"}
    </button>
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

function stripReadyTag(s) {
  return s.replaceAll(READY_TAG, "").trim();
}
