// Shared UI primitives in the landing page's cinematic "mission deck" style:
// black canvas, white text, uppercase bold type, hard-edged bordered panels,
// cyan/amber accents, and border-2 invert buttons. Reused across every screen
// so the whole app matches the landing page.

export function TopBar({ onBack, backLabel = "Back", right }) {
  return (
    <nav className="sticky top-0 z-10 border-b border-white/10 bg-black/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-7">
        <div className="flex items-center gap-4">
          <span className="grid h-9 w-9 place-items-center border-2 border-white text-xs font-black">
            AI
          </span>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-bold uppercase tracking-wide text-white/70 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            >
              ← {backLabel}
            </button>
          ) : (
            <span className="font-black">Lab Companion</span>
          )}
        </div>
        <div className="flex items-center gap-3">{right}</div>
      </div>
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
    <main className="min-h-screen bg-black text-white">
      <TopBar onBack={onBack} backLabel={backLabel} right={right} />
      <section className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-7">
        <header className="max-w-3xl">
          {kicker && (
            <p className="text-sm font-semibold uppercase text-cyan-200">
              {kicker}
            </p>
          )}
          <h1 className="mt-3 text-4xl font-black leading-[0.95] sm:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
              {subtitle}
            </p>
          )}
        </header>
        <div className="mt-10 space-y-6">{children}</div>
      </section>
    </main>
  );
}

export function Panel({ className = "", children, ...rest }) {
  return (
    <div
      className={"border border-white/10 bg-neutral-950 p-6 " + className}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children, accent = "cyan" }) {
  const color = accent === "amber" ? "text-amber-200" : "text-cyan-200";
  return (
    <p className={`text-sm font-bold uppercase ${color}`}>{children}</p>
  );
}

export function PrimaryButton({ className = "", ...rest }) {
  return (
    <button
      className={
        "inline-flex min-h-11 items-center justify-center border-2 border-white bg-white px-6 text-sm font-bold uppercase text-black transition hover:bg-transparent hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black " +
        className
      }
      {...rest}
    />
  );
}

export function SecondaryButton({ className = "", ...rest }) {
  return (
    <button
      className={
        "inline-flex min-h-11 items-center justify-center border-2 border-white px-6 text-sm font-bold uppercase text-white transition hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white " +
        className
      }
      {...rest}
    />
  );
}

export function StatusBadge({ state, error }) {
  const base =
    "hidden border px-3 py-1 text-xs font-bold uppercase sm:inline-flex";
  if (state === "ok") {
    return (
      <span className={`${base} border-emerald-300/60 text-emerald-200`}>
        backend online
      </span>
    );
  }
  if (state === "error") {
    return (
      <span
        className={`${base} border-red-300/60 text-red-200`}
        title={error}
      >
        backend offline
      </span>
    );
  }
  return (
    <span className={`${base} border-white/30 text-white/70`}>
      backend checking
    </span>
  );
}

export function ErrorCard({ title, detail }) {
  return (
    <div
      role="alert"
      className="border border-red-400/40 bg-red-500/10 p-4 text-red-200"
    >
      <div className="font-bold uppercase tracking-wide">{title}</div>
      <div className="mt-1 break-words text-sm text-red-200/90">{detail}</div>
    </div>
  );
}
