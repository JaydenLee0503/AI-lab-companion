import { useEffect, useRef, useState } from "react";
import { useReveal } from "./cinematic/useReveal";
import { useGravityGrid } from "./cinematic/useGravityGrid";

// NovaMind AI landing page — the cinematic "aerospace serif" concept:
// a gravity-grid hero card, a mission statement, a floating-cards manifesto,
// the AI Lab Supporter panels, a live Socratic-tutor transcript, the Focus
// extension preview, and a closing call to action.

const BrandMark = ({ size = 22 }) => (
  <span className="mark">
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9.2" stroke="#eef2f7" strokeWidth="1" />
      <circle cx="11" cy="11" r="2.4" fill="#eef2f7" />
      <ellipse
        cx="11"
        cy="11"
        rx="9.2"
        ry="3.6"
        stroke="oklch(0.82 0.07 215)"
        strokeWidth="0.8"
        transform="rotate(28 11 11)"
      />
    </svg>
  </span>
);

const TUTOR_SCRIPT = [
  { who: "you", text: "Why is my model overfitting?" },
  {
    who: "tutor",
    text: "Good question. What happens to your training loss compared to your validation loss over the last few epochs?",
  },
  { who: "you", text: "Training keeps dropping, but validation flattened out." },
  {
    who: "tutor",
    text: "So the model keeps learning the training set specifically. What is one change that would make memorising it harder?",
  },
  { who: "you", text: "Add regularisation? Maybe dropout." },
  {
    who: "tutor",
    text: "Exactly. Start there, then watch whether the two curves move back toward each other.",
  },
];

export default function LandingPage({ onStart }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const gravityRef = useRef(null);
  const tutorRef = useRef(null);

  useReveal([]);
  useGravityGrid(gravityRef);
  useStreamingTutor(tutorRef);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="layer">
      <header className={"site-header" + (scrolled ? " scrolled" : "")}>
        <a href="#top" className="brand" onClick={closeMenu}>
          <BrandMark />
          NovaMind AI
        </a>
        <nav className="primary header-center">
          <a href="#mission">Mission</a>
          <a href="#supporter">Platform</a>
          <a href="#tutor">Tutor</a>
          <a href="#extension">Focus</a>
        </nav>
        <div className="header-right">
          <button type="button" className="login" onClick={onStart}>
            Log in
          </button>
          <button type="button" className="btn solid sm" onClick={onStart}>
            Enter the Lab
          </button>
          <button
            className="menu-toggle"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <nav className={"mobile-menu" + (menuOpen ? " open" : "")}>
        <a href="#top" onClick={closeMenu}>
          Home
        </a>
        <a href="#mission" onClick={closeMenu}>
          Mission
        </a>
        <a href="#supporter" onClick={closeMenu}>
          Platform
        </a>
        <a href="#tutor" onClick={closeMenu}>
          Tutor
        </a>
        <a href="#extension" onClick={closeMenu}>
          Focus
        </a>
        <button
          type="button"
          onClick={() => {
            closeMenu();
            onStart();
          }}
        >
          Enter the Lab
        </button>
      </nav>

      <main id="top">
        {/* ============ HERO ============ */}
        <section className="hero2">
          <div className="hero-card">
            <canvas id="gravity" ref={gravityRef} />
            <div className="hero-card-overlay" />
            <div className="hero-cats" aria-hidden="true">
              <span>Real Lab Guide</span>
              <span>Socratic Tutoring</span>
              <span>Focus Guardian</span>
              <span>Experiment Library</span>
            </div>
            <div className="hero-card-content">
              <h1 className="reveal">
                Run the experiment.
                <br />
                <span className="em">Understand it.</span>
              </h1>
              <div className="hero-card-actions reveal d1">
                <button type="button" className="btn solid" onClick={onStart}>
                  Get Started <span className="chev">›</span>
                </button>
                <a href="#supporter" className="btn outline">
                  Learn More <span className="chev">›</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ============ MISSION ============ */}
        <section className="section mission" id="mission">
          <div className="wrap">
            <div className="eyebrow center reveal">Mission</div>
            <p className="statement reveal d1">
              NovaMind&nbsp;AI is built for students and curious
              builders{" "}
              <span className="dim">
                who want to turn a hands-on experiment into real understanding.
              </span>
            </p>
          </div>
        </section>

        {/* ============ MANIFESTO ============ */}
        <section className="section manifesto" id="manifesto">
          <div className="manifesto-stage">
            <div className="float-card tile tile-a" aria-hidden="true">
              <svg
                viewBox="0 0 26 26"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3.5" y="3.5" width="19" height="19" rx="4" />
                <path d="M3.5 10h19M10 10v12.5" />
              </svg>
            </div>
            <div className="float-card tile tile-b" aria-hidden="true">
              <svg
                viewBox="0 0 26 26"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 21V11M10 21V5M16 21v-7M22 21V8" />
              </svg>
            </div>
            <div className="float-card tile tile-c" aria-hidden="true">
              <svg
                viewBox="0 0 26 26"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="13" cy="13" r="9.5" />
                <path d="M3.5 13h19M13 3.5c3 3 3 16 0 19M13 3.5c-3 3-3 16 0 19" />
              </svg>
            </div>
            <div className="float-card tile tile-d" aria-hidden="true">
              <svg
                viewBox="0 0 26 26"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M18 4h2.5A1.5 1.5 0 0 1 22 5.5V8M22 18v2.5a1.5 1.5 0 0 1-1.5 1.5H18M8 22H5.5A1.5 1.5 0 0 1 4 20.5V18" />
                <circle cx="13" cy="13" r="3" />
              </svg>
            </div>

            <div className="float-card card-researcher" aria-hidden="true">
              <div className="fc-date">Jun 2026</div>
              <div className="fc-metrics">
                <div className="m-row">
                  <span className="sq sq-blue" />
                  <span className="m-label">Experiments</span>
                  <span className="m-val">128</span>
                </div>
                <div className="m-row">
                  <span className="sq sq-violet" />
                  <span className="m-label">Checkpoints</span>
                  <span className="m-val">1.2K</span>
                </div>
                <div className="m-row">
                  <span className="sq sq-cyan" />
                  <span className="m-label">Insights</span>
                  <span className="m-val">312</span>
                </div>
              </div>
              <div className="fc-divider" />
              <div className="fc-name">Danielle Wilson</div>
              <div className="fc-email">Grade 10 · Physics</div>
              <div className="fc-divider" />
              <div className="fc-meta">
                <div className="meta-row">
                  <span>Lab time</span>
                  <span>412 hrs</span>
                </div>
                <div className="meta-row">
                  <span>Mode</span>
                  <span>Real + Sim</span>
                </div>
                <div className="meta-row">
                  <span>Member</span>
                  <span>2y 10m</span>
                </div>
              </div>
            </div>

            <div className="float-card card-funnel" aria-hidden="true">
              <div className="funnel-stages">
                <div className="stage">
                  <div className="st-top">
                    <span className="dot d-blue" />
                    Steps
                  </div>
                  <span className="st-val">7.2K</span>
                </div>
                <div className="stage">
                  <div className="st-top">
                    <span className="dot d-violet" />
                    Verified
                  </div>
                  <span className="st-val">165</span>
                </div>
                <div className="stage">
                  <div className="st-top">
                    <span className="dot d-cyan" />
                    Mastered
                  </div>
                  <span className="st-val">21</span>
                </div>
              </div>
              <div className="funnel-chart">
                <svg viewBox="0 0 326 150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="funnelGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="oklch(0.6 0.16 262)" />
                      <stop offset="0.55" stopColor="oklch(0.58 0.18 300)" />
                      <stop offset="1" stopColor="oklch(0.78 0.12 195)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,22 C 80,22 100,58 163,66 C 240,76 290,86 326,92 L 326,126 C 290,120 240,108 163,98 C 100,90 80,128 0,150 Z"
                    fill="url(#funnelGrad)"
                    opacity="0.92"
                  />
                </svg>
                <div className="funnel-pcts">
                  <span>100%</span>
                  <span>36%</span>
                  <span>1.3%</span>
                </div>
              </div>
            </div>

            <div className="manifesto-copy">
              <p className="manifesto-line reveal">
                Science isn&rsquo;t just about finishing the steps.
                <br />
                It&rsquo;s about understanding.
              </p>
              <p className="manifesto-line reveal d1">
                NovaMind&nbsp;AI unifies hands-on lab guidance&nbsp;
                <span className="gi gi-blue">
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  >
                    <path d="M2.5 9.5V6M6 9.5V2.5M9.5 9.5V5" />
                  </svg>
                </span>{" "}
                Socratic tutoring&nbsp;
                <span className="gi gi-cyan">
                  <svg viewBox="0 0 12 12" fill="#fff">
                    <path d="M6 1.4l1.1 2.6 2.8.2-2.1 1.8.7 2.7L6 7.2 3.5 8.7l.7-2.7L2.1 4.2l2.8-.2z" />
                  </svg>
                </span>{" "}
                and deep focus&nbsp;
                <span className="gi gi-violet">
                  <svg viewBox="0 0 12 12" fill="#fff">
                    <circle cx="6" cy="3" r="1.5" />
                    <circle cx="3" cy="8.5" r="1.5" />
                    <circle cx="9" cy="8.5" r="1.5" />
                  </svg>
                </span>{" "}
                — in one place.
              </p>
              <p className="manifesto-line reveal d1">
                It&rsquo;s hands-free. It&rsquo;s visual. It&rsquo;s safe. And it
                adapts to the equipment in front of you.
              </p>
              <p className="manifesto-line dim reveal d2">
                Because students deserve more than a completed worksheet. They
                deserve evidence they can explain.
              </p>
            </div>
          </div>
        </section>

        {/* ============ AI LAB SUPPORTER ============ */}
        <section className="section" id="supporter">
          <div className="wrap">
            <div className="sec-head reveal">
              <div className="eyebrow">AI Lab Supporter</div>
              <h2>A co-pilot for the whole experiment.</h2>
              <p>
                From the first instruction to the final observation — guide the
                bench by voice, verify each setup, and keep momentum through
                every checkpoint.
              </p>
            </div>
            <div className="panels reveal d1">
              {[
                [
                  "01",
                  "Guide by voice",
                  "Hands-free, step-by-step narration walks students through a physical experiment so their hands stay on the bench.",
                ],
                [
                  "02",
                  "Verify with vision",
                  "At each checkpoint a single webcam frame is checked by a vision model to confirm the setup is correct and safe.",
                ],
                [
                  "03",
                  "Simulate anything",
                  "No equipment? The same experiment runs as a Socratic simulation that reasons through predictions and observations.",
                ],
                [
                  "04",
                  "Stay on mission",
                  "Local focus alerts and a small, solid experiment library keep attention on the investigation, not the tabs.",
                ],
              ].map(([idx, title, body]) => (
                <div className="panel" key={idx}>
                  <div className="glow" />
                  <div className="idx">{idx}</div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ SOCRATIC TUTOR ============ */}
        <section className="section tutor" id="tutor">
          <div className="wrap">
            <div className="tutor-grid">
              <div className="reveal">
                <div className="eyebrow">Socratic Tutor</div>
                <h2
                  className="serif"
                  style={{
                    fontSize: "clamp(32px,4.6vw,64px)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.02em",
                    margin: "22px 0",
                  }}
                >
                  Answers you arrive at, not answers you&rsquo;re handed.
                </h2>
                <p
                  style={{
                    color: "var(--silver)",
                    fontWeight: 300,
                    fontSize: "clamp(15px,1.4vw,18px)",
                    maxWidth: 520,
                  }}
                >
                  The Tutor asks guiding questions instead of handing over
                  solutions. It moves at the pace of your understanding — calm,
                  precise, and genuinely curious — so the insight stays yours.
                </p>
              </div>
              <div className="dialogue reveal d1" ref={tutorRef}>
                <div className="bubble you">
                  <div className="who">You</div>
                  Why is my model overfitting?
                </div>
                <div className="bubble tutor-msg">
                  <div className="who">Tutor</div>
                  <em>Good question.</em> What happens to your training loss
                  compared to your validation loss over the last few epochs?
                </div>
                <div className="bubble you">
                  <div className="who">You</div>
                  Training keeps dropping, validation flattened.
                </div>
                <div className="bubble tutor-msg">
                  <div className="who">Tutor</div>
                  So the model keeps learning the training set specifically.
                  What&rsquo;s one thing you could change that would make that
                  harder to do?
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FOCUS EXTENSION ============ */}
        <section className="section" id="extension">
          <div className="wrap">
            <div className="ext-grid">
              <div className="reveal">
                <div className="eyebrow">Focus &middot; Chrome Extension</div>
                <h2
                  className="serif"
                  style={{
                    fontSize: "clamp(32px,4.6vw,64px)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.02em",
                    margin: "22px 0",
                  }}
                >
                  Guard your attention, locally.
                </h2>
                <p
                  style={{
                    color: "var(--silver)",
                    fontWeight: 300,
                    fontSize: "clamp(15px,1.4vw,18px)",
                    maxWidth: 520,
                  }}
                >
                  Focus Guard watches only the URL of your active tab and gives
                  you a quiet nudge when you drift to a distracting site —
                  YouTube, Instagram, Discord, TikTok, Reddit. Everything runs on
                  your machine.
                </p>
                <ul className="privacy-list">
                  <li>
                    <svg className="tick" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M3 9.5l4 4 8-9"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>
                      <span className="label">Reads active tab URL only</span> —
                      to detect distracting domains
                    </span>
                  </li>
                  <li>
                    <svg className="tick x" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M4.5 4.5l9 9M13.5 4.5l-9 9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>No page content, ever</span>
                  </li>
                  <li>
                    <svg className="tick x" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M4.5 4.5l9 9M13.5 4.5l-9 9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>No passwords or private messages</span>
                  </li>
                  <li>
                    <svg className="tick x" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M4.5 4.5l9 9M13.5 4.5l-9 9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>No personal data collected or sent</span>
                  </li>
                </ul>
                <button type="button" className="btn solid" onClick={onStart}>
                  Get Focus Guard <span className="arrow">↓</span>
                </button>
              </div>
              <div className="ext-visual reveal d1">
                <div className="browser-bar">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                  <span className="url">youtube.com/watch?v=…</span>
                </div>
                <div className="ext-body">
                  <div className="alert">
                    <span className="pulse" />
                    <div>
                      <div className="a-title">Distraction detected</div>
                      <div className="a-sub">
                        You&rsquo;re 14 minutes into a lab on “Density &amp;
                        buoyancy”. Return to the bench?
                      </div>
                    </div>
                  </div>
                  <div className="ext-tags">
                    <span>youtube.com</span>
                    <span>instagram.com</span>
                    <span>discord.com</span>
                    <span>tiktok.com</span>
                    <span>reddit.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="section final" id="final">
          <div className="wrap">
            <div className="eyebrow center reveal">Begin</div>
            <h2 className="big reveal d1">
              Open the experiment library
              <br />
              and choose your mode.
            </h2>
            <div
              className="reveal d2"
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button type="button" className="btn solid" onClick={onStart}>
                Enter the Lab <span className="arrow">→</span>
              </button>
              <a href="#supporter" className="btn">
                See what&rsquo;s inside
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="brand" style={{ fontSize: 13 }}>
          <BrandMark size={18} />
          NovaMind AI
        </div>
        <nav>
          <a href="#supporter">Platform</a>
          <a href="#tutor">Tutor</a>
          <a href="#extension">Focus</a>
          <button type="button" onClick={onStart}>
            Launch
          </button>
        </nav>
        <span>© 2026 — Science labs for the web classroom.</span>
      </footer>
    </div>
  );
}

// Streaming Socratic-tutor transcript — types out the scripted conversation
// once the panel scrolls into view, then loops. Falls back to the static
// markup when motion is reduced.
function useStreamingTutor(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let cancelled = false;
    let started = false;
    const timers = new Set();
    const wait = (ms) =>
      new Promise((r) => {
        const id = setTimeout(r, ms);
        timers.add(id);
      });
    const el = (tag, cls, html) => {
      const d = document.createElement(tag);
      if (cls) d.className = cls;
      if (html != null) d.innerHTML = html;
      return d;
    };

    async function typeText(node, text, cps) {
      const span = el("span", "t");
      const caret = el("span", "caret");
      node.appendChild(span);
      node.appendChild(caret);
      for (let i = 0; i < text.length && !cancelled; i++) {
        span.textContent += text[i];
        let d = 1000 / cps;
        if (text[i] === " ") d += 6;
        if (/[.,?]/.test(text[i])) d += 150;
        await wait(d);
      }
      caret.remove();
    }

    async function playTurn(turn) {
      const b = el(
        "div",
        "bubble appear " + (turn.who === "tutor" ? "tutor-msg" : "you")
      );
      b.appendChild(el("div", "who", turn.who === "tutor" ? "Tutor" : "You"));
      const body = el("span", "bubble-body");
      b.appendChild(body);
      root.appendChild(b);
      const ti = el("span", "typing", "<i></i><i></i><i></i>");
      body.appendChild(ti);
      await wait(turn.who === "tutor" ? 940 : 680);
      if (cancelled) return;
      ti.remove();
      await typeText(body, turn.text, turn.who === "tutor" ? 27 : 34);
    }

    async function run() {
      root.classList.add("live");
      while (!cancelled) {
        root.innerHTML = "";
        for (const turn of TUTOR_SCRIPT) {
          if (cancelled) return;
          await playTurn(turn);
          await wait(turn.who === "tutor" ? 850 : 520);
        }
        await wait(2800);
        root.style.transition = "opacity .55s ease";
        root.style.opacity = "0";
        await wait(620);
        if (cancelled) return;
        root.style.opacity = "1";
      }
    }

    function maybeStart() {
      if (started || cancelled) return;
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      if (r.top < vh * 0.85 && r.bottom > 0) {
        started = true;
        if (io) io.disconnect();
        run();
      }
    }

    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (es) => es.forEach((e) => e.isIntersecting && maybeStart()),
            { threshold: 0.3 }
          )
        : null;
    if (io) io.observe(root);
    window.addEventListener("scroll", maybeStart, { passive: true });
    maybeStart();

    return () => {
      cancelled = true;
      if (io) io.disconnect();
      window.removeEventListener("scroll", maybeStart);
      timers.forEach((id) => clearTimeout(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
