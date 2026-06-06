import { Panel, PageShell, SectionLabel } from "./ui";

const DOWNLOAD_URL = "/focus-guard-extension.zip";

const downloadButtonClass =
  "inline-flex min-h-11 items-center justify-center border-2 border-white bg-white px-6 text-sm font-bold uppercase text-black transition hover:bg-transparent hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-200";

function DownloadButton({ children }) {
  return (
    <a
      href={DOWNLOAD_URL}
      download
      className={downloadButtonClass}
    >
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
      <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-2">
        <article className="bg-black p-6">
          <SectionLabel>What it does</SectionLabel>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-white/75">
            <li>Detects when the active tab is a distracting site.</li>
            <li>Fires a local Chrome notification to nudge you back.</li>
            <li>Fully configurable block list via the Options page.</li>
            <li>
              No page content, passwords, messages, or personal data are ever
              read or sent anywhere.
            </li>
          </ul>
        </article>
        <article className="bg-black p-6">
          <SectionLabel accent="amber">Default watched sites</SectionLabel>
          <div className="mt-4 flex flex-wrap gap-2">
            {defaultSites.map((s) => (
              <span
                key={s}
                className="border border-white/15 px-2 py-1 text-xs font-bold uppercase text-white/70"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-white/50">
            Edit, add, or remove any of these from the extension's Options page.
          </p>
        </article>
      </div>

      <Panel>
        <SectionLabel>Install (Chrome / Edge)</SectionLabel>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {steps.map((step, i) => (
            <li
              key={step}
              className="border border-white/10 bg-neutral-950 p-4"
            >
              <span className="text-sm font-black text-white/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 text-sm leading-6 text-white/80">{step}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <DownloadButton>Download Focus Guard</DownloadButton>
        </div>
        <p className="mt-3 text-xs text-white/50">
          Prefer source? The unpacked extension also lives in the repo at{" "}
          <code className="text-white/70">chrome-extension/</code>.
        </p>
      </Panel>
    </PageShell>
  );
}
