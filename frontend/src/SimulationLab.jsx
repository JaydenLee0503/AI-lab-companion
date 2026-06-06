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

      <Panel className="space-y-2">
        <h3 className="text-sm font-bold uppercase text-white/60">Instruction</h3>
        <p className="text-lg text-white">{step.instruction}</p>
        {step.simulation && (
          <p className="text-sm italic text-white/55">
            You observe: {step.simulation.observation}
          </p>
        )}
      </Panel>

      <Panel aria-label="Tutor conversation" className="space-y-4">
        <div className="space-y-3" aria-live="polite">
          {history.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} ready={m.ready} />
          ))}
          {thinking && <Bubble role="assistant" content="…" />}
        </div>
        {error && <ErrorCard title="Tutor error" detail={error} />}
        <div className="flex gap-2">
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
            className="flex-1 border border-white/20 bg-black px-3 py-2 text-white placeholder-white/40 focus:border-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          />
          <PrimaryButton
            onClick={send}
            disabled={thinking || !input.trim()}
            className="px-5"
          >
            Send
          </PrimaryButton>
        </div>
      </Panel>

      <div className="flex flex-wrap justify-between gap-3">
        <SecondaryButton
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
        >
          ← Previous step
        </SecondaryButton>
        <PrimaryButton
          onClick={() => setStepIndex((i) => Math.min(exp.steps.length - 1, i + 1))}
          disabled={!canAdvance}
          className={tutorSaysReady ? "border-emerald-300 bg-emerald-300" : ""}
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
    <div className={mine ? "text-right" : "text-left"}>
      <div
        className={
          "inline-block max-w-[85%] px-4 py-2 text-sm leading-6 " +
          (mine
            ? "border border-white bg-white text-black"
            : "border border-white/15 bg-neutral-900 text-white")
        }
      >
        <span className="whitespace-pre-wrap">{content}</span>
        {ready && (
          <span className="ml-2 text-xs font-bold uppercase text-emerald-300">
            ready to advance
          </span>
        )}
      </div>
    </div>
  );
}

function VoiceToggle({ on, setOn }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-bold uppercase text-white/70">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
        className="accent-cyan-300"
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
