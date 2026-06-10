import { useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { getTutorVoiceSession } from "./api";
import { ErrorCard, PrimaryButton, SecondaryButton } from "./ui";

// One ElevenLabs agent session handles both modes: the student can talk (the
// agent transcribes speech) OR type (sendUserMessage). Either way the agent's
// reply arrives as text (onMessage, for the transcript) and as audio (played
// automatically — that's the read-aloud). No separate STT/TTS/LLM needed.

// Builds a per-step context string. We send this to the agent as a
// `contextual_update` (NOT a prompt override): the deployed agent does not have
// prompt/first_message overrides enabled, so sending an override makes the
// server close the socket with code 1008. A contextual update is always allowed
// and steers the conversation to this step's experiment.
function buildContext(exp, step) {
  const sim = step.simulation;
  const observation =
    sim?.observation ?? "(no simulated observation for this step)";
  const prompts = sim
    ? sim.tutor_prompts.map((p) => `- ${p}`).join("\n")
    : "";
  return (
    `Tutoring context: the student is doing the experiment "${exp.title}", ` +
    `on step "${step.id}": ${step.instruction}. ` +
    `What they would observe here: ${observation}. ` +
    (prompts ? `Socratic prompts you may draw from:\n${prompts}\n` : "") +
    `Act as a Socratic tutor on this step: short guiding questions, never the ` +
    `answer outright, 1-3 sentences.`
  );
}

// Generic live-voice tutor over the ElevenLabs agent. Two ways to drive it:
//   • Simulation Lab passes { exp, step } and the per-step context is built here.
//   • The standalone Socratic Tutor passes an explicit { contextHint } string
//     for a free-choice math/science conversation.
// Either way the agent is steered with a contextual update once connected.
// `useConversation` (v1.x) must run inside a <ConversationProvider>; without it
// the hook throws on mount and blanks the page. Wrap the inner tutor here.
export default function VoiceTutor(props) {
  return (
    <ConversationProvider>
      <VoiceTutorInner {...props} />
    </ConversationProvider>
  );
}

function VoiceTutorInner({
  exp,
  step,
  contextHint,
  firstMessage,
  idleHint = "Real-time voice, powered by ElevenLabs.",
  startLabel = "Start live voice tutor",
}) {
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const [transcript, setTranscript] = useState([]); // {source, text}
  const [text, setText] = useState("");
  const transcriptEndRef = useRef(null);

  // The agent has client overrides enabled, so we send the Socratic context as
  // the system-prompt override plus a tailored first message.
  const sessionContext = contextHint ?? buildContext(exp, step);
  const sessionFirstMessage =
    firstMessage ??
    (step
      ? `Let's think through this step: ${step.instruction} What do you expect to happen, and why?`
      : "Hi! What would you like to work on together?");

  // Append a transcript line, skipping a consecutive exact duplicate. This lets
  // us optimistically show the student's typed message without double-rendering
  // it if the agent also echoes it back as a user transcript.
  function pushLine(source, lineText) {
    if (!lineText) return;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.source === source && last.text === lineText) return prev;
      return [...prev, { source, text: lineText }];
    });
  }

  const conversation = useConversation({
    onConnect: () => setError(null),
    onMessage: (m) => {
      if (!m || !m.message) return;
      pushLine(m.source, m.message);
    },
    onError: (e) =>
      setError(typeof e === "string" ? e : e?.message || "Voice session error."),
    // If an override is rejected the server connects, then closes the socket
    // (e.g. 1008 "Override for field 'first_message' is not allowed"). Surface a
    // clear hint instead of a silent dead session.
    onDisconnect: (d) => {
      const reason = d?.closeReason || d?.message || d?.context?.reason || "";
      if (/override/i.test(String(reason))) {
        setError(
          `The agent rejected a config override (${reason}). In the ElevenLabs ` +
            `agent's Security settings, enable overrides for System prompt, ` +
            `First message, and Language.`
        );
      }
    },
  });

  const status = conversation.status; // 'disconnected' | 'connecting' | 'connected'
  const connected = status === "connected";

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // End the session if the user navigates away. endSession() returns void in
  // this SDK version (not a Promise), so don't chain .catch on it.
  useEffect(() => {
    return () => {
      try {
        conversation.endSession();
      } catch {
        /* nothing to clean up */
      }
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
      // Overrides are enabled on the agent, so send the Socratic system prompt
      // and a tailored first message. (If overrides ever get disabled, the
      // socket closes with 1008 — onDisconnect above explains how to fix it.)
      await conversation.startSession({
        signedUrl: signed_url,
        overrides: {
          agent: {
            prompt: { prompt: sessionContext },
            firstMessage: sessionFirstMessage,
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

  function stop() {
    try {
      conversation.endSession();
    } catch {
      /* already closed */
    }
  }

  // Send a typed message into the live session. The agent replies with text
  // (shown in the transcript) and speaks it aloud, same as a spoken turn.
  function sendText(e) {
    e?.preventDefault?.();
    const value = text.trim();
    if (!value || !connected) return;
    pushLine("user", value);
    try {
      conversation.sendUserMessage(value);
    } catch (err) {
      setError(String(err?.message || err));
      return;
    }
    setText("");
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {connected ? (
          <SecondaryButton onClick={stop}>End voice session</SecondaryButton>
        ) : (
          <PrimaryButton onClick={start} disabled={starting}>
            {starting ? "Connecting…" : startLabel}
          </PrimaryButton>
        )}
        <span style={{ fontSize: 13, color: "var(--silver)" }}>
          {connected
            ? conversation.isSpeaking
              ? "Tutor is speaking…"
              : "Listening — talk, or type below."
            : idleHint}
        </span>
      </div>

      {connected && (
        <form
          onSubmit={sendText}
          style={{ display: "flex", gap: 10, marginTop: 14 }}
        >
          <label htmlFor="voice-tutor-text" className="sr-only">
            Type a message
          </label>
          <input
            id="voice-tutor-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              try {
                conversation.sendUserActivity();
              } catch {
                /* not connected yet */
              }
            }}
            placeholder="…or type your message and press Enter"
            className="field"
          />
          <PrimaryButton type="submit" disabled={!text.trim()}>
            Send
          </PrimaryButton>
        </form>
      )}

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
