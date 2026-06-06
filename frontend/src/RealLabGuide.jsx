import { useEffect, useRef, useState } from "react";
import {
  getExperiment,
  ttsAudioUrl,
  tutorTransition,
  verifyCheckpoint,
} from "./api";
import {
  ErrorCard,
  Panel,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
} from "./ui";

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
      <PageShell title="Real Lab Guide" onBack={onBack} backLabel="Experiments">
        <ErrorCard title="Could not load experiment" detail={loadError} />
      </PageShell>
    );
  }
  if (!exp || !step) {
    return (
      <PageShell title="Real Lab Guide" onBack={onBack} backLabel="Experiments">
        <p className="text-white/60">Loading…</p>
      </PageShell>
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
          // Ask the LLM to compose the next instruction sentence, then speak it.
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
    <PageShell
      kicker="AI Lab Supporter"
      title={exp.title}
      onBack={onBack}
      backLabel="Experiments"
      right={
        <label className="inline-flex items-center gap-2 text-xs font-bold uppercase text-white/70">
          <input
            type="checkbox"
            checked={voiceOn}
            onChange={(e) => setVoiceOn(e.target.checked)}
            className="accent-cyan-300"
          />
          Voice on
        </label>
      }
    >
      <SectionLabel>
        Step {stepIndex + 1} / {exp.steps.length} · {step.id}
      </SectionLabel>

      <Panel className="space-y-2">
        <h3 className="text-sm font-bold uppercase text-white/60">Instruction</h3>
        <p className="text-lg text-white">{step.instruction}</p>
        {!step.checkpoint && (
          <p className="text-xs uppercase text-amber-200">
            No checkpoint for this step — skip verify and continue.
          </p>
        )}
      </Panel>

      <div className="grid place-items-center overflow-hidden border border-white/10 bg-black aspect-video">
        {camState.state === "ready" ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : camState.state === "error" ? (
          <div className="p-4 text-center text-sm text-red-200">
            Camera unavailable: {camState.error}
          </div>
        ) : (
          <div className="text-sm text-white/50">Requesting camera…</div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {result && (
        <div
          role="status"
          aria-live="polite"
          className={
            "border p-5 " +
            (result.passed
              ? "border-emerald-300/50 bg-emerald-500/10 text-emerald-100"
              : "border-amber-300/50 bg-amber-500/10 text-amber-100")
          }
        >
          <div className="font-bold uppercase tracking-wide">
            {result.passed ? "Looks good." : "Not quite yet."}
          </div>
          <div className="mt-1 text-sm">{result.observations}</div>
          {!result.passed && result.hint && (
            <div className="mt-2 text-sm">Hint: {result.hint}</div>
          )}
        </div>
      )}

      {error && <ErrorCard title="Verification error" detail={error} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SecondaryButton onClick={back} disabled={stepIndex === 0}>
          ← Previous
        </SecondaryButton>
        <div className="flex flex-wrap gap-3">
          <SecondaryButton
            onClick={onVerify}
            disabled={verifying || !step.checkpoint}
          >
            {verifying ? "Verifying…" : "Verify checkpoint"}
          </SecondaryButton>
          <PrimaryButton
            onClick={advance}
            disabled={stepIndex >= exp.steps.length - 1}
            className={result?.passed ? "border-emerald-300 bg-emerald-300" : ""}
          >
            Next →
          </PrimaryButton>
        </div>
      </div>
    </PageShell>
  );
}

async function speak(text) {
  if (!text || !text.trim()) return;
  const url = await ttsAudioUrl(text);
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url));
  await audio.play();
}
