import { useEffect, useMemo, useRef, useState } from "react";
import { getExperiment, ttsAudioUrl, tutorChat } from "./api";

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
      <PageShell onBack={onBack} title="Simulation Lab">
        <ErrorCard title="Could not load experiment" detail={loadError} />
      </PageShell>
    );
  }
  if (!exp || !step) {
    return (
      <PageShell onBack={onBack} title="Simulation Lab">
        <p className="text-slate-500">Loading…</p>
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
    <PageShell onBack={onBack} title={`Simulation Lab — ${exp.title}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          Step {stepIndex + 1} of {exp.steps.length}: <strong>{step.id}</strong>
        </div>
        <VoiceToggle on={voiceOn} setOn={setVoiceOn} />
      </div>

      <div className="bg-white rounded-2xl shadow p-5 space-y-2">
        <h3 className="font-semibold">Instruction</h3>
        <p className="text-slate-800">{step.instruction}</p>
        {step.simulation && (
          <p className="text-slate-600 italic text-sm">
            You observe: {step.simulation.observation}
          </p>
        )}
      </div>

      <section
        aria-label="Tutor conversation"
        className="bg-white rounded-2xl shadow p-5 space-y-3"
      >
        <div className="space-y-3" aria-live="polite">
          {history.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} ready={m.ready} />
          ))}
          {thinking && (
            <Bubble role="assistant" content="…" />
          )}
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
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          />
          <button
            type="button"
            onClick={send}
            disabled={thinking || !input.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50 hover:bg-indigo-700"
          >
            Send
          </button>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 justify-between">
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          className="px-4 py-2 rounded-lg border border-slate-300 disabled:opacity-50"
        >
          ← Previous step
        </button>
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.min(exp.steps.length - 1, i + 1))}
          disabled={!canAdvance}
          className={
            "px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 " +
            (tutorSaysReady ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-600 hover:bg-slate-700")
          }
        >
          Next step →
        </button>
      </div>
    </PageShell>
  );
}

function PageShell({ title, onBack, children }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-indigo-700 hover:underline"
          >
            ← All experiments
          </button>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

function Bubble({ role, content, ready }) {
  const mine = role === "user";
  return (
    <div className={mine ? "text-right" : "text-left"}>
      <div
        className={
          "inline-block max-w-[85%] rounded-2xl px-4 py-2 " +
          (mine
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-900")
        }
      >
        <span className="whitespace-pre-wrap">{content}</span>
        {ready && (
          <span className="ml-2 text-xs text-emerald-700">(ready to advance)</span>
        )}
      </div>
    </div>
  );
}

function VoiceToggle({ on, setOn }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
      />
      Speak tutor replies
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
