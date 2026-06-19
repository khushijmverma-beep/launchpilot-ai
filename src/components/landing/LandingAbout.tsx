export function LandingAbout() {
  return (
    <section id="about" className="scroll-mt-28 mx-auto max-w-5xl px-5 py-24">
      <p className="mono-label">About</p>
      <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
        A founder execution navigator — not another idea generator
      </h2>
      <div className="mt-8 max-w-3xl space-y-5 text-base leading-7 text-lp-muted">
        <p>
          LaunchPilot AI helps you move from a rough concept to a concrete plan. It runs a structured intake
          interview, then applies multi-agent research to ground your idea in evidence before suggesting what to
          build next.
        </p>
        <p>
          Built for student founders and early-stage builders who need clarity fast — without pretending AI can
          replace judgment, customer conversations, or hard validation work.
        </p>
        <p>
          The core loop is simple: <span className="text-white">interview → grounded research → MVP roadmap</span>.
          You stay in control at every step.
        </p>
      </div>
    </section>
  );
}
