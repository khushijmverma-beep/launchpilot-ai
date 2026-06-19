import { AgentTraceVisual } from "@/components/landing/AgentTraceVisual";

const STEPS = [
  {
    step: "01",
    title: "Interview",
    body: "Voice or chat intake captures your idea, constraints, and goals in a natural conversation.",
  },
  {
    step: "02",
    title: "Multi-agent research",
    body: "Six specialized agents analyze competitors, pain points, opportunities, skill gaps, and source quality.",
  },
  {
    step: "03",
    title: "Evidence-backed roadmap",
    body: "You get a step-by-step blueprint, confidence scores, and labeled findings — not generic advice.",
  },
  {
    step: "04",
    title: "Approve & build",
    body: "Review, publish your project, and iterate. You decide what to ship and when.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-28 mx-auto max-w-5xl px-5 py-24">
      <p className="mono-label">How it works</p>
      <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
        From conversation to build plan in four steps
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-lp-muted">
        Each stage produces structured output you can review, edit, and publish to your workspace.
      </p>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((item) => (
            <div key={item.step} className="terminal-card p-5">
              <p className="font-mono text-xs text-lp-subtle">{item.step}</p>
              <h3 className="mt-3 font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-lp-muted">{item.body}</p>
            </div>
          ))}
        </div>
        <AgentTraceVisual />
      </div>
    </section>
  );
}
