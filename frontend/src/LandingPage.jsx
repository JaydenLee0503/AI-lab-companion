import { useEffect, useState } from "react";
import { getHealth } from "./api";
import heroImage from "./assets/lab-mission-hero.png";

const missionStats = [
  ["2", "learning modes"],
  ["1", "shared experiment library"],
  ["0", "API keys in the browser"],
];

const claritySignals = [
  {
    label: "Checkpoint review",
    value: "Verified setup",
    body: "Students move forward only when the bench, materials, and observations are ready.",
  },
  {
    label: "Mode continuity",
    value: "One experiment",
    body: "The same lab can run as a hands-on activity or a guided simulation.",
  },
  {
    label: "Classroom focus",
    value: "Local guardrails",
    body: "Voice guidance and distraction checks keep attention on the investigation.",
  },
];

const modes = [
  {
    kicker: "Real Lab",
    title: "Guide the bench like a launch sequence.",
    body: "Voice prompts keep students hands-free while vision checkpoints confirm each setup before the next step unlocks.",
  },
  {
    kicker: "Simulation",
    title: "Run the mission when equipment is missing.",
    body: "The same experiment definition becomes a Socratic lab, helping students reason through predictions and observations.",
  },
  {
    kicker: "Classroom",
    title: "Built for safe, repeatable science.",
    body: "Household materials, backend-protected credentials, and checkpoint-only image review keep the workflow practical.",
  },
];

const sequence = [
  "Select an experiment",
  "Choose real or simulated lab mode",
  "Follow each checkpoint",
  "Capture observations",
];

export default function LandingPage({ onStart }) {
  const [health, setHealth] = useState({ state: "checking" });

  useEffect(() => {
    getHealth()
      .then((data) => setHealth({ state: "ok", data }))
      .catch((err) =>
        setHealth({ state: "error", error: String(err.message || err) })
      );
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <section
        id="top"
        className="relative isolate min-h-[82svh] overflow-hidden border-b border-white/15 md:min-h-[86svh]"
      >
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.72)_34%,rgba(0,0,0,0.2)_70%),linear-gradient(0deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0)_34%)]" />

        <Nav health={health} onStart={onStart} />

        <div className="mx-auto flex min-h-[calc(82svh-76px)] max-w-6xl items-end px-5 pb-12 pt-24 sm:px-7 md:min-h-[calc(86svh-84px)] md:pb-16">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase text-cyan-200">
              Classroom science, mission-ready
            </p>
            <h1 className="text-5xl font-black leading-[0.95] sm:text-6xl md:text-7xl">
              AI Lab Companion
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              A cinematic command deck for science experiments: voice guidance,
              simulation mode, and checkpoint review in one focused web app.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onStart}
                className="min-h-11 border-2 border-white bg-white px-6 text-sm font-bold uppercase text-black transition hover:bg-transparent hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                Browse Experiments
              </button>
              <a
                href="#mission"
                className="inline-flex min-h-11 items-center border-2 border-white px-6 text-sm font-bold uppercase text-white transition hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                See Mission
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="mission"
        className="border-b border-white/10 bg-neutral-950 px-5 py-8 sm:px-7"
      >
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">
          {missionStats.map(([value, label]) => (
            <Stat key={label} value={value} label={label} />
          ))}
        </div>
      </section>

      <section
        id="outcomes"
        className="border-b border-neutral-200 bg-white px-5 py-16 text-black sm:px-7 md:py-24"
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-neutral-600">
              Learning outcomes
            </p>
            <h2 className="mt-4 text-4xl font-black leading-[1.02] sm:text-5xl md:text-6xl">
              Science labs are not just about finishing steps.
              <span className="block">They are about understanding.</span>
            </h2>
            <div className="mt-8 max-w-2xl space-y-5 text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
              <p>
                AI Lab Companion unifies real lab guidance, simulation
                reasoning, and checkpoint review in one focused classroom
                workflow.
              </p>
              <p>
                It is hands-free. It is visual. It is repeatable. And it adapts
                to the equipment, time, and students in front of you.
              </p>
              <p className="font-bold text-black">
                Because students deserve more than a completed worksheet. They
                deserve evidence they can explain.
              </p>
            </div>
          </div>

          <div className="border border-neutral-200 bg-neutral-50 p-3">
            <div className="border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase text-neutral-500">
                    Clarity report
                  </p>
                  <h3 className="mt-1 text-2xl font-black leading-tight">
                    Lab progress, translated into evidence.
                  </h3>
                </div>
                <span className="shrink-0 border border-emerald-500 px-3 py-1 text-xs font-black uppercase text-emerald-700">
                  Live
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                {claritySignals.map((signal) => (
                  <article
                    key={signal.label}
                    className="border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-xs font-bold uppercase text-neutral-500">
                        {signal.label}
                      </p>
                      <span className="text-right text-sm font-black text-black">
                        {signal.value}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-neutral-700">
                      {signal.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="modes" className="bg-black px-5 py-16 sm:px-7 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-amber-200">
              Mission profile
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Make every experiment feel deliberate, visual, and ready to run.
            </h2>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-3">
            {modes.map((mode) => (
              <ModePanel key={mode.kicker} {...mode} />
            ))}
          </div>
        </div>
      </section>

      <section
        id="sequence"
        className="bg-white px-5 py-16 text-black sm:px-7 md:py-20"
      >
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-neutral-600">
              Lab sequence
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              From first click to final observation.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-neutral-700">
              Students move through a clear set of stages, with the app adapting
              to either a physical lab bench or a simulated investigation.
            </p>
          </div>

          <ol className="grid gap-3 sm:grid-cols-2">
            {sequence.map((step, index) => (
              <li
                key={step}
                className="min-h-28 border border-neutral-200 bg-neutral-50 p-5"
              >
                <span className="text-sm font-black text-neutral-500">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-5 text-xl font-black leading-tight">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative overflow-hidden bg-neutral-950 px-5 py-16 sm:px-7 md:py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-white/15" />
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-cyan-200">
              Ready for launch
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Open the experiment library and choose your mode.
            </h2>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="min-h-11 w-full border-2 border-white bg-white px-6 text-sm font-bold uppercase text-black transition hover:bg-transparent hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:w-auto"
          >
            Start
          </button>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black px-5 py-6 text-sm text-white/55 sm:px-7">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <span>AI Lab Companion</span>
          <span>Science labs for the web classroom.</span>
        </div>
      </footer>
    </main>
  );
}

function Nav({ health, onStart }) {
  return (
    <nav className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-7 md:h-[84px]">
      <a href="#top" className="flex items-center gap-3 font-black">
        <span className="grid h-9 w-9 place-items-center border-2 border-white text-xs">
          AI
        </span>
        <span className="hidden sm:inline">Lab Companion</span>
      </a>

      <div className="hidden items-center gap-8 text-sm font-bold uppercase text-white/85 md:flex">
        <a href="#mission" className="hover:text-white">
          Mission
        </a>
        <a href="#outcomes" className="hover:text-white">
          Outcomes
        </a>
        <a href="#modes" className="hover:text-white">
          Modes
        </a>
        <a href="#sequence" className="hover:text-white">
          Sequence
        </a>
      </div>

      <div className="flex items-center gap-3">
        <BackendBadge health={health} />
        <button
          type="button"
          onClick={onStart}
          className="hidden min-h-10 border border-white/80 px-4 text-xs font-bold uppercase text-white transition hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:inline-block"
        >
          Start
        </button>
      </div>
    </nav>
  );
}

function Stat({ value, label }) {
  return (
    <div className="border border-white/10 bg-black px-5 py-5">
      <span className="text-4xl font-black">{value}</span>
      <p className="mt-1 text-sm font-semibold uppercase text-white/65">
        {label}
      </p>
    </div>
  );
}

function ModePanel({ kicker, title, body }) {
  return (
    <article className="bg-black p-6">
      <p className="text-sm font-bold uppercase text-cyan-200">{kicker}</p>
      <h3 className="mt-4 text-2xl font-black leading-tight">{title}</h3>
      <p className="mt-4 text-sm leading-6 text-white/68">{body}</p>
    </article>
  );
}

function BackendBadge({ health }) {
  const baseClass =
    "hidden border px-3 py-1 text-xs font-bold uppercase sm:inline-flex";

  if (health.state === "checking") {
    return (
      <span className={`${baseClass} border-white/30 text-white/70`}>
        backend checking
      </span>
    );
  }

  if (health.state === "ok") {
    return (
      <span className={`${baseClass} border-emerald-300/60 text-emerald-200`}>
        backend online
      </span>
    );
  }

  return (
    <span
      className={`${baseClass} border-red-300/60 text-red-200`}
      title={health.error}
    >
      backend offline
    </span>
  );
}
