// Shared UI primitives in the landing page's cinematic "mission deck" style:
// near-black canvas over a fixed starfield, high-contrast display serif,
// low-chroma cyan/amber accents, hard-edged translucent "deck" panels, and
// pill buttons. Reused across every screen so the whole app matches the
// landing page. The styling lives in index.css (.app-*, .deck, .btn, etc.).

const BrandMark = ({ size = 22 }) => (
  <span className="mark" style={{ width: size, height: size, flex: "none" }}>
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

export function TopBar({ onBack, backLabel = "Back", right }) {
  return (
    <nav className="app-topbar">
      <div className="left">
        <span className="brand" style={{ cursor: "default" }}>
          <BrandMark size={20} />
          {!onBack && "NovaMind AI"}
        </span>
        {onBack && (
          <button type="button" onClick={onBack} className="back-link">
            ← {backLabel}
          </button>
        )}
      </div>
      <div className="right">{right}</div>
    </nav>
  );
}

export function PageShell({
  kicker,
  title,
  subtitle,
  onBack,
  backLabel,
  right,
  children,
}) {
  return (
    <main className="app-main">
      <TopBar onBack={onBack} backLabel={backLabel} right={right} />
      <section className="app-section">
        <header className="app-head">
          {kicker && <div className="eyebrow">{kicker}</div>}
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </header>
        <div className="app-stack">{children}</div>
      </section>
    </main>
  );
}

export function Panel({ className = "", children, ...rest }) {
  return (
    <div className={"deck " + className} {...rest}>
      {children}
    </div>
  );
}

export function SectionLabel({ children, accent = "cyan" }) {
  return (
    <p className={"deck-label" + (accent === "amber" ? " amber" : "")}>
      {children}
    </p>
  );
}

export function PrimaryButton({ className = "", ...rest }) {
  return <button className={"btn solid " + className} {...rest} />;
}

export function SecondaryButton({ className = "", ...rest }) {
  return <button className={"btn " + className} {...rest} />;
}

export function OrbitLoader({ label = "Designing your lab…" }) {
  return (
    <div className="orbit-loader" role="status" aria-live="polite">
      <div className="orbit" aria-hidden="true">
        <span className="ring r1" />
        <span className="ring r2" />
        <span className="ring r3" />
      </div>
      {label && <p className="orbit-label">{label}</p>}
    </div>
  );
}

export function ErrorCard({ title, detail }) {
  return (
    <div role="alert" className="notice err">
      <div className="n-title">{title}</div>
      <div className="n-body">{detail}</div>
    </div>
  );
}
