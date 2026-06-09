import { useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { getTutorVoiceSession } from "./api";
import { ErrorCard, PrimaryButton, SecondaryButton } from "./ui";

// Builds the per-step Socratic system prompt sent to the agent as an override,
// mirroring the tutor-chat edge function so the voice tutor behaves the same.
function buildPrompt(exp, step) {
  const sim = step.simulation;
  const observation =
    sim?.observation ?? "(no simulated observation for this step)";
  const prompts = sim
    ? sim.tutor_prompts.map((p) => `- ${p}`).join("\n")
    : "";
  return (
    `You are a patient high-school science tutor running a virtual Simulation Lab. ` +
    `The student is doing the experiment: "${exp.title}". ` +
    `They are on step "${step.id}": ${step.instruction}\n\n` +
    `What the student would observe at this step: ${observation}\n\n` +
    (prompts
      ? `Useful Socratic prompts you may draw from (do not list them verbatim):\n${prompts}\n\n`
      : "") +
    `Guide the student with short Socratic questions. Never give the answer ` +
    `outright. Keep replies to 1-3 sentences.`
  );
}

export default function VoiceTutor({ exp, step }) {
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const [transcript, setTranscript] = useState([]); // {source, text}
  const transcriptEndRef = useRef(null);

  const conversation = useConversation({
    onConnect: () => setError(null),
    onMessage: (m) => {
      if (!m || !m.message) return;
      setTranscript((prev) => [...prev, { source: m.source, text: m.message }]);
    },
    onError: (e) =>
      setError(typeof e === "string" ? e : e?.message || "Voice session error."),
  });

  const status = conversation.status; // 'disconnected' | 'connecting' | 'connected'
  const connected = status === "connected";

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // End the session if the user navigates away.
  useEffect(() => {
    return () => {
      conversation.endSession().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    if (starting || connected) return;
    setStarting(true);
    setError(null);
    setTranscript([]);
    try {
      // Prompt for the mic up front so failures surface clearly.
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { signed_url } = await getTutorVoiceSession();
      await conversation.startSession({
        signedUrl: signed_url,
        overrides: {
          agent: {
            prompt: { prompt: buildPrompt(exp, step) },
            firstMessage: `Let's think through this step: ${step.instruction} What do you expect to happen, and why?`,
            language: "en",
          },
        },
      });
    } catch (e) {
      setError(
        e?.name === "NotAllowedError"
          ? "Microphone access was denied."
          : String(e?.message || e)
      );
    } finally {
      setStarting(false);
    }
  }

  async function stop() {
    try {
      await conversation.endSession();
    } catch {
      /* already closed */
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {connected ? (
          <SecondaryButton onClick={stop}>End voice session</SecondaryButton>
        ) : (
          <PrimaryButton onClick={start} disabled={starting}>
            {starting ? "Connecting…" : "Start live voice tutor"}
          </PrimaryButton>
        )}
        <span style={{ fontSize: 13, color: "var(--silver)" }}>
          {connected
            ? conversation.isSpeaking
              ? "Tutor is speaking…"
              : "Listening — just talk."
            : "Real-time voice, powered by ElevenLabs."}
        </span>
      </div>

      {error && (
        <div style={{ marginTop: 12 }}>
          <ErrorCard title="Voice tutor error" detail={error} />
        </div>
      )}

      {transcript.length > 0 && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}
          aria-live="polite"
        >
          {transcript.map((m, i) => (
            <div key={i} className={"msg " + (m.source === "user" ? "me" : "bot")}>
              <div className="body">
                <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
              </div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      )}
    </div>
  );
}
