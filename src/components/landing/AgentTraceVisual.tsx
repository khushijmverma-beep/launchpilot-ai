const AGENTS = [
  "Lead Research",
  "Competitor",
  "Pain Point",
  "Opportunity",
  "Skill Gap",
  "Source Quality",
];

export function AgentTraceVisual() {
  return (
    <div className="terminal-card p-5">
      <p className="mono-label mb-4">Multi-agent trace</p>
      <ol className="space-y-2">
        {AGENTS.map((agent, index) => (
          <li key={agent} className="flex items-center gap-3 font-mono text-xs text-lp-muted">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-white/15 text-[10px] text-lp-subtle">
              {index + 1}
            </span>
            <span className="text-white">{agent}</span>
            <span className="ml-auto text-lp-subtle">complete</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
