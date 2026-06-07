import { Panel, PageShell, SectionLabel } from "./ui";

const DOWNLOAD_URL = "/focus-guard-extension.zip";

function DownloadButton({ children }) {
  return (
    <a href={DOWNLOAD_URL} download className="btn solid">
      {children}
    </a>
  );
}

const defaultSites = [
  "instagram.com",
  "youtube.com",
  "discord.com",
  "tiktok.com",
  "reddit.com",
  "twitter.com",
  "x.com",
  "facebook.com",
];

const steps = [
  "Download the ZIP and unzip it anywhere on your computer.",
  "Open Chrome and go to chrome://extensions.",
  "Turn on Developer mode (top-right toggle).",
  'Click "Load unpacked" and select the unzipped chrome-extension folder.',
  "Pin Focus Guard, then open its Options to edit your distracting-site list.",
];

export default function ExtensionPage({ onBack }) {
  return (
    <PageShell
      kicker="Stay on mission"
      title="Focus Guard"
      subtitle="A Manifest V3 Chrome extension that watches the active tab locally and alerts you when a distracting site takes focus during a lab. Everything stays on your machine."
      onBack={onBack}
      backLabel="Experiments"
      right={<DownloadButton>Download .zip</DownloadButton>}
    >
      <div className="exp-grid">
        <article className="exp-card">
          <SectionLabel>What it does</SectionLabel>
          <ul
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              color: "var(--silver)",
              fontWeight: 300,
              fontSize: 15,
            }}
          >
            <li>Detects when the active tab is a distracting site.</li>
            <li>Fires a local Chrome notification to nudge you back.</li>
            <li>Fully configurable block list via the Options page.</li>
            <li>
              No page content, passwords, messages, or personal data are ever
              read or sent anywhere.
            </li>
          </ul>
        </article>
        <article className="exp-card">
          <SectionLabel accent="amber">Default watched sites</SectionLabel>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {defaultSites.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
            Edit, add, or remove any of these from the extension's Options page.
          </p>
        </article>
      </div>

      <Panel>
        <SectionLabel>Install (Chrome / Edge)</SectionLabel>
        <ol className="steps" style={{ marginTop: 16 }}>
          {steps.map((step, i) => (
            <li key={step} className="step-cell">
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <p
                style={{
                  marginTop: 10,
                  fontFamily: "var(--sans)",
                  fontSize: 14,
                  fontWeight: 300,
                  color: "var(--silver)",
                  lineHeight: 1.55,
                }}
              >
                {step}
              </p>
            </li>
          ))}
        </ol>
        <div style={{ marginTop: 24 }}>
          <DownloadButton>Download Focus Guard</DownloadButton>
        </div>
        <p style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
          Prefer source? The unpacked extension also lives in the repo at{" "}
          <code style={{ color: "var(--silver)" }}>chrome-extension/</code>.
        </p>
      </Panel>
    </PageShell>
  );
}
