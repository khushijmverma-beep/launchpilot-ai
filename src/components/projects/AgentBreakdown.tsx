import { Badge } from "@/components/Badge";
import type { ProjectAgentOutputs, StoredAgentOutput } from "@/lib/projects/types";

type AgentBreakdownProps = {
  agentOutputs: ProjectAgentOutputs;
};

const AGENT_ORDER: Array<{ key: keyof ProjectAgentOutputs; title: string }> = [
  { key: "leadResearch", title: "Market Reality Agent" },
  { key: "competitor", title: "Assumption & Risk Agent" },
  { key: "painPoint", title: "MVP Scope Agent" },
  { key: "skillGap", title: "Roadmap Agent" },
  { key: "opportunity", title: "Opportunity Agent" },
  { key: "sourceQuality", title: "Pitch & Communication Agent" },
];

function AgentCard({ agent }: { agent: StoredAgentOutput }) {
  return (
    <article className="terminal-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{agent.name}</h3>
          <p className="mt-1 font-mono text-xs text-lp-subtle">{agent.role}</p>
        </div>
        <Badge label={agent.confidence} />
      </div>
      <p className="mt-4 text-sm leading-6 text-lp-muted">{agent.finding}</p>
      <p className="mt-3 text-xs leading-5 text-lp-subtle">{agent.whyItMatters}</p>
      {agent.plan && agent.plan.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
          {agent.plan.map((step) => (
            <li key={step} className="font-mono text-xs leading-5 text-lp-muted">
              · {step}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function AgentBreakdown({ agentOutputs }: AgentBreakdownProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {AGENT_ORDER.map(({ key }) => (
        <AgentCard key={key} agent={agentOutputs[key]} />
      ))}
    </div>
  );
}
