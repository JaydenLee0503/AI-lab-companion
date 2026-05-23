import { useEffect, useRef, useState } from "react";
import {
  getExperiment,
  ttsAudioUrl,
  tutorTransition,
  verifyCheckpoint,
} from "./api";

export default function RealLabGuide({ experimentId, onBack }) {
  const [exp, setExp] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [camState, setCamState] = useState({ state: "idle" });
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null); // {passed, observations, hint}
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    getExperiment(experimentId)
      .then(setExp)
      .catch((e) => setLoadError(String(e.message || e)));
  }, [experimentId]);

  // Start camera once on mount; stop on unmount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCamState({ state: "requesting" });
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCamState({ state: "ready" });
      } catch (e) {
        setCamState({ state: "error", error: String(e.message || e) });
      }
    })();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // When entering a new step, reset verification and speak the instruction.
  const step = exp?.steps[stepIndex];
  useEffect(() => {
    setResult(null);
    setError(null);
    if (voiceOn && step) {
      speak(step.instruction).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, exp?.id]);

  if (loadError) {
    return (
      <Shell title="Real Lab Guide" onBack={onBack}>
        <ErrorCard title="Could not load experiment" detail={loadError} />
      </Shell>
    );
  }
  if (!exp || !step) {
    return (
      <Shell title="Real Lab Guide" onBack={onBack}>
        <p className="text-slate-500">Loading…</p>
      </Shell>
    );
  }

  function captureFrameB64() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    // toDataURL returns "data:image/jpeg;base64,XXXX"
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    return dataUrl.split(",", 2)[1];
  }

  async function onVerify() {
    if (verifying) return;
    if (!step.checkpoint) {
      setError("This step has no checkpoint — just continue when ready.");
      return;
    }
    if (camState.state !== "ready") {
      setError("Camera is not ready yet.");
      return;
    }
    const b64 = captureFrameB64();
    if (!b64) {
      setError("Could not capture a frame.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const res = await verifyCheckpoint(exp.id, step.id, b64);
      setResult(res);
      if (voiceOn) {
        if (res.passed) {
          // M5: ask the LLM to compose the next instruction sentence, then speak it.
          const nextIdx = stepIndex + 1;
          if (nextIdx < exp.steps.length) {
            try {
              const { narration } = await tutorTransition(
                exp.id,
                step.id,
                exp.steps[nextIdx].id,
                res.observations
              );
              await speak(narration);
            } catch (e) {
              await speak("Great work. Ready for the next step.");
            }
          } else {
            await speak("Great work — that was the final step.");
          }
        } else if (res.hint) {
          await speak(res.hint);
        }
      }
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setVerifying(false);
    }
  }

  function advance() {
    setStepIndex((i) => Math.min(exp.steps.length - 1, i + 1));
  }
  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  return (
    <Shell title={`Real Lab Guide — ${exp.title}`} onBack={onBack}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          Step {stepIndex + 1} of {exp.steps.length}: <strong>{step.id}</strong>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={voiceOn}
            onChange={(e) => setVoiceOn(e.target.checked)}
          />
          Voice on
        </label>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 space-y-2">
        <h3 className="font-semibold">Instruction</h3>
        <p className="text-slate-800">{step.instruction}</p>
        {!step.checkpoint && (
          <p className="text-xs text-amber-700">
            (No checkpoint defined for this step — skip verify and continue.)
          </p>
        )}
      </div>

      <div className="bg-black rounded-2xl overflow-hidden aspect-video grid place-items-center">
        {camState.state === "ready" ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : camState.state === "error" ? (
          <div className="text-red-200 text-sm p-4 text-center">
            Camera unavailable: {camState.error}
          </div>
        ) : (
          <div className="text-slate-300 text-sm">Requesting camera…</div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {result && (
        <div
          role="status"
          aria-live="polite"
          className={
            "rounded-2xl p-5 border " +
            (result.passed
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-amber-50 border-amber-200 text-amber-900")
          }
        >
          <div className="font-semibold mb-1">
            {result.passed ? "Looks good." : "Not quite yet."}
          </div>
          <div className="text-sm">{result.observations}</div>
          {!result.passed && result.hint && (
            <div className="text-sm mt-2">Hint: {result.hint}</div>
          )}
        </div>
      )}

      {error && <ErrorCard title="Verification error" detail={error} />}

      <div className="flex flex-wrap gap-2 justify-between">
        <button
          type="button"
          onClick={back}
          disabled={stepIndex === 0}
          className="px-4 py-2 rounded-lg border border-slate-300 disabled:opacity-50"
        >
          ← Previous
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onVerify}
            disabled={verifying || !step.checkpoint}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50 hover:bg-indigo-700"
          >
            {verifying ? "Verifying…" : "Verify checkpoint"}
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={stepIndex >= exp.steps.length - 1}
            className={
              "px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 " +
              (result?.passed
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-slate-600 hover:bg-slate-700")
            }
          >
            Next →
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ title, onBack, children }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-5">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-indigo-700 hover:underline"
        >
          ← All experiments
        </button>
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

async function speak(text) {
  if (!text || !text.trim()) return;
  const url = await ttsAudioUrl(text);
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url));
  await audio.play();
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
