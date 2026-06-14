import { useState } from "react";
import { generateExperiment } from "./api";
import RealLabGuide from "./RealLabGuide";
import SimulationLab from "./SimulationLab";
import {
  ErrorCard,
  OrbitLoader,
  PageShell,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
} from "./ui";

// Custom Lab — a third entry point alongside the library experiments. The
// student types a topic (and optional instructions); Featherless designs a
// complete, household-safe experiment matching the shared schema, which then
// runs through the SAME Real Lab Guide / Simulation Lab flows. The generated
// experiment lives only in this component's state for the session.
export default function CustomLab({ onBack }) {
  const [phase, setPhase] = useState("input"); // input | review | run
  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [refusal, setRefusal] = useState(null);
  const [exp, setExp] = useState(null);
  const [mode, setMode] = useState(null); // 'real-lab' | 'simulation'

  async function design(e) {
    e?.preventDefault?.();
    const t = topic.trim();
    if (!t || generating) return;
    setGenerating(true);
    setError(null);
    setRefusal(null);
    try {
      const res = await generateExperiment(t, instructions.trim() || undefined);
      if (res.refused) {
        setRefusal(res.reason || "That topic isn't a safe household experiment.");
        return;
      }
      setExp(res.experiment);
      setPhase("review");
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setGenerating(false);
    }
  }

  function run(which) {
    setMode(which);
    setPhase("run");
  }

  if (phase === "run" && exp) {
    const back = () => setPhase("review");
    return mode === "real-lab" ? (
      <RealLabGuide experiment={exp} onBack={back} />
    ) : (
      <SimulationLab experiment={exp} onBack={back} />
    );
  }

  return (
    <PageShell
      kicker="Custom Lab"
      title="Design a lab from any topic."
      subtitle="Describe an experiment you want to run. We'll turn it into a safe, step-by-step lab you can do with the webcam guide or the simulated tutor."
      onBack={onBack}
      backLabel="Home"
    >
      {phase === "input" && (
        <Panel>
          <form onSubmit={design}>
            <SectionLabel>What do you want to explore?</SectionLabel>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. why does ice float, or how does a paper towel wick water"
              className="field"
              style={{ marginTop: 14, width: "100%" }}
            />

            <div style={{ marginTop: 24 }}>
              <SectionLabel accent="amber">
                Instructions <span style={{ opacity: 0.6 }}>(optional)</span>
              </SectionLabel>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Anything specific — materials you have, a method from class, grade level, how long it should take…"
                rows={4}
                className="field"
                style={{
                  marginTop: 14,
                  width: "100%",
                  resize: "vertical",
                  fontFamily: "var(--sans)",
                }}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PrimaryButton type="submit" disabled={generating || !topic.trim()}>
                {generating ? "Designing your lab…" : "Design my lab"}
              </PrimaryButton>
            </div>
            {generating && <OrbitLoader />}
            <p style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
              Labs use cheap household materials only — no flame or hazardous
              chemicals. Unsafe topics are declined.
            </p>
          </form>

          {refusal && (
            <div style={{ marginTop: 16 }}>
              <ErrorCard title="Can't build that one" detail={refusal} />
            </div>
          )}
          {error && (
            <div style={{ marginTop: 16 }}>
              <ErrorCard title="Generation failed" detail={error} />
            </div>
          )}
        </Panel>
      )}

      {phase === "review" && exp && (
        <ReviewCard
          exp={exp}
          onRun={run}
          onRedesign={() => {
            setExp(null);
            setPhase("input");
          }}
        />
      )}
    </PageShell>
  );
}

function ReviewCard({ exp, onRun, onRedesign }) {
  return (
    <>
      <Panel>
        <SectionLabel>Your custom lab</SectionLabel>
        <h2
          className="serif"
          style={{
            margin: "10px 0 0",
            fontSize: "clamp(22px,2.4vw,30px)",
            fontWeight: 400,
            color: "#eef2f7",
          }}
        >
          {exp.title}
        </h2>
        <p style={{ marginTop: 10, color: "var(--silver)" }}>{exp.summary}</p>
        <p style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
          Grades {exp.grade_level} · ~{exp.duration_minutes} min ·{" "}
          {exp.steps.length} steps
        </p>

        {exp.materials?.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <h3 className="deck-label">Materials</h3>
            <ul style={{ marginTop: 8, color: "var(--silver)", paddingLeft: 18 }}>
              {exp.materials.map((m, i) => (
                <li key={i}>
                  {m.name}
                  {m.quantity ? ` — ${m.quantity}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {exp.safety?.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <h3 className="deck-label amber">Safety</h3>
            <ul style={{ marginTop: 8, color: "var(--silver)", paddingLeft: 18 }}>
              {exp.safety.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 24,
            alignItems: "center",
          }}
        >
          <PrimaryButton onClick={() => onRun("real-lab")}>
            Real Lab Guide
          </PrimaryButton>
          <SecondaryButton onClick={() => onRun("simulation")}>
            Simulation Lab
          </SecondaryButton>
          <button type="button" onClick={onRedesign} className="back-link">
            ← Start over
          </button>
        </div>
      </Panel>

      <Panel aria-label="Steps preview">
        <h3 className="deck-label">Steps</h3>
        <ol style={{ marginTop: 12, color: "var(--silver)", paddingLeft: 20 }}>
          {exp.steps.map((s) => (
            <li key={s.id} style={{ marginBottom: 8 }}>
              {s.instruction}
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}
