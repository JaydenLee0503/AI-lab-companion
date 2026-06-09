import { useState } from "react";
import VoiceTutor from "./VoiceTutor";
import {
  PageShell,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
} from "./ui";

// Standalone Socratic Tutor — a separate product from the Simulation Lab. The
// student picks a subject and (optionally) a specific topic, then has a live,
// hands-free voice conversation with the ElevenLabs agent. The agent asks
// guiding questions instead of handing over answers.

const SUBJECTS = [
  "Math",
  "Physics",
  "Chemistry",
  "Biology",
];

function buildPrompt(subject, topic) {
  const focus = topic
    ? `The student wants to focus on: "${topic}".`
    : `Let the student steer toward whatever they're curious or stuck on.`;
  return (
    `You are a patient, encouraging Socratic tutor for a high-school student, ` +
    `speaking out loud in a live voice conversation. Subject: ${subject}. ` +
    `${focus}\n\n` +
    `Guide the student to their own understanding with short Socratic ` +
    `questions and gentle hints. Never give the final answer outright — lead ` +
    `them to it step by step. Check their reasoning, and when they're right, ` +
    `say so and build on it. Keep replies to 1-3 sentences and conversational, ` +
    `since they are heard, not read.`
  );
}

function buildFirstMessage(subject, topic) {
  const what = topic || subject;
  return (
    `Hi! Let's explore ${what} together. ` +
    `Tell me what you're working on or curious about, and we'll reason ` +
    `through it step by step. Where would you like to start?`
  );
}

export default function SocraticTutor({ onBack }) {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic, setTopic] = useState("");
  const [session, setSession] = useState(null); // { subject, topic } once started

  function startSession(e) {
    e?.preventDefault?.();
    setSession({ subject, topic: topic.trim() });
  }

  return (
    <PageShell
      kicker="Socratic Tutor"
      title="Talk through math and science, your way."
      subtitle="Pick a subject and a topic, then have a live voice conversation with a tutor that guides you to the answer instead of handing it over."
      onBack={onBack}
      backLabel="Home"
    >
      {!session ? (
        <Panel>
          <form onSubmit={startSession}>
            <SectionLabel>Choose a subject</SectionLabel>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className={"chip" + (subject === s ? " active" : "")}
                  aria-pressed={subject === s}
                  style={{
                    cursor: "pointer",
                    borderColor:
                      subject === s ? "var(--cyan, #6fd6e6)" : undefined,
                    color: subject === s ? "#eef2f7" : undefined,
                    background: subject === s
                      ? "rgba(111,214,230,0.12)"
                      : undefined,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 28 }}>
              <SectionLabel accent="amber">
                Topic <span style={{ opacity: 0.6 }}>(optional)</span>
              </SectionLabel>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={`e.g. ${
                  subject === "Math"
                    ? "quadratic equations"
                    : subject === "Physics"
                    ? "Newton's second law"
                    : subject === "Chemistry"
                    ? "balancing equations"
                    : "cellular respiration"
                }`}
                style={{
                  marginTop: 14,
                  width: "100%",
                  maxWidth: 480,
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  borderRadius: 10,
                  color: "#eef2f7",
                  fontFamily: "var(--sans)",
                  fontSize: 15,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginTop: 28 }}>
              <PrimaryButton type="submit">Start tutoring</PrimaryButton>
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
              You'll be asked for microphone access — the conversation is
              hands-free and spoken aloud.
            </p>
          </form>
        </Panel>
      ) : (
        <Panel>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <SectionLabel>Now tutoring</SectionLabel>
              <h2
                className="serif"
                style={{
                  margin: "10px 0 0",
                  fontSize: "clamp(22px,2.4vw,30px)",
                  fontWeight: 400,
                  color: "#eef2f7",
                }}
              >
                {session.topic
                  ? `${session.subject} · ${session.topic}`
                  : session.subject}
              </h2>
            </div>
            <SecondaryButton onClick={() => setSession(null)}>
              Change topic
            </SecondaryButton>
          </div>

          <div style={{ marginTop: 20 }}>
            <VoiceTutor
              prompt={buildPrompt(session.subject, session.topic)}
              firstMessage={buildFirstMessage(session.subject, session.topic)}
              idleHint="Tap to start — then just talk. Powered by ElevenLabs."
              startLabel="Start conversation"
            />
          </div>
        </Panel>
      )}
    </PageShell>
  );
}
