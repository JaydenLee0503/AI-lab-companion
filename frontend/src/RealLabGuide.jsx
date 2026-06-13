import { useEffect, useRef, useState } from "react";
import {
  getExperiment,
  tutorTransition,
  verifyCheckpoint,
} from "./api";
import { speak, stopSpeaking } from "./speak";
import {
  ErrorCard,
  Panel,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
} from "./ui";

export default function RealLabGuide({ experimentId, experiment, onBack }) {
  const isCustom = !!experiment;
  const [exp, setExp] = useState(experiment ?? null);
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
    if (experiment) {
      setExp(experiment);
      return;
    }
    getExperiment(experimentId)
      .then(setExp)
      .catch((e) => setLoadError(String(e.message || e)));
  }, [experimentId, experiment]);

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

  // Silence any in-progress narration when voice is switched off or the guide
  // is closed, so it never keeps talking after you leave.
  useEffect(() => {
    if (!voiceOn) stopSpeaking();
    return stopSpeaking;
  }, [voiceOn]);

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
      const res = await verifyCheckpoint(
        exp.id,
        step.id,
        b64,
        isCustom ? exp : undefined
      );
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
                res.observations,
                isCustom ? exp : undefined
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
        <label className="toggle">
          <input
            type="checkbox"
            checked={voiceOn}
            onChange={(e) => setVoiceOn(e.target.checked)}
          />
          Voice on
        </label>
      }
    >
      <SectionLabel>
        Step {stepIndex + 1} / {exp.steps.length} · {step.id}
      </SectionLabel>

      <Panel>
        <h3 className="deck-label">Instruction</h3>
        <p style={{ marginTop: 12, fontSize: 18, color: "var(--text)" }}>
          {step.instruction}
        </p>
        {!step.checkpoint && (
          <p
            style={{
              marginTop: 10,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--amber)",
            }}
          >
            No checkpoint for this step — skip verify and continue.
          </p>
        )}
      </Panel>

      <div className="cam-stage">
        {/* The video must stay mounted so videoRef exists when the stream is
            attached; overlay the requesting/error states on top of it. */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ display: camState.state === "ready" ? "block" : "none" }}
        />
        {camState.state === "error" ? (
          <div
            className="cam-hint"
            style={{ padding: 16, textAlign: "center", color: "oklch(0.78 0.16 25)" }}
          >
            Camera unavailable: {camState.error}
          </div>
        ) : camState.state !== "ready" ? (
          <div className="cam-hint">Requesting camera…</div>
        ) : null}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {result && (
        <div
          role="status"
          aria-live="polite"
          className={"notice " + (result.passed ? "pass" : "warn")}
        >
          <div className="n-title">
            {result.passed ? "Looks good." : "Not quite yet."}
          </div>
          <div className="n-body">{result.observations}</div>
          {!result.passed && result.hint && (
            <div className="n-body">Hint: {result.hint}</div>
          )}
        </div>
      )}

      {error && <ErrorCard title="Verification error" detail={error} />}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <SecondaryButton onClick={back} disabled={stepIndex === 0}>
          ← Previous
        </SecondaryButton>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <SecondaryButton
            onClick={onVerify}
            disabled={verifying || !step.checkpoint}
          >
            {verifying ? "Verifying…" : "Verify checkpoint"}
          </SecondaryButton>
          <PrimaryButton
            onClick={advance}
            disabled={stepIndex >= exp.steps.length - 1}
            className={result?.passed ? "go" : ""}
          >
            Next →
          </PrimaryButton>
        </div>
      </div>
    </PageShell>
  );
}

