import type { AgentOutput, LaunchBrief } from "@/lib/types";
import type { ProjectAgentOutputs, StoredAgentOutput, StrengthWeaknessCategory } from "./types";

function clampScore(value: number): number {
  return Math.max(-10, Math.min(10, Math.round(value)));
}

function scaleFounderMetric(value: number): number {
  return (value / 100) * 20 - 10;
}

function confidenceDelta(confidence: AgentOutput["confidence"]): number {
  if (confidence === "High") return 4;
  if (confidence === "Medium") return 1;
  return -3;
}

function findAgent(agents: AgentOutput[], needle: string): AgentOutput | undefined {
  return agents.find((agent) => agent.name.toLowerCase().includes(needle.toLowerCase()));
}

function toStored(agent: AgentOutput | undefined, fallbackName: string): StoredAgentOutput {
  if (!agent) {
    return {
      name: fallbackName,
      role: "Agent",
      finding: "No findings recorded for this agent run.",
      whyItMatters: "Re-run publish after a fuller interview to populate this section.",
      confidence: "Low",
      label: "Needs validation",
      plan: [],
    };
  }

  return {
    name: agent.name,
    role: agent.role,
    finding: agent.finding,
    whyItMatters: agent.whyItMatters,
    confidence: agent.confidence,
    label: agent.label,
    plan: agent.plan?.slice(0, 4),
  };
}

export function buildAgentOutputs(agents: AgentOutput[]): ProjectAgentOutputs {
  return {
    leadResearch: toStored(findAgent(agents, "Market Reality"), "Market Reality Agent"),
    competitor: toStored(findAgent(agents, "Assumption & Risk"), "Assumption & Risk Agent"),
    painPoint: toStored(findAgent(agents, "MVP Scope"), "MVP Scope Agent"),
    opportunity: toStored(findAgent(agents, "Opportunity"), "Opportunity Agent"),
    skillGap: toStored(findAgent(agents, "Roadmap"), "Roadmap Agent"),
    sourceQuality: toStored(findAgent(agents, "Pitch"), "Pitch & Communication Agent"),
  };
}

export function deriveStrengthsWeaknesses(
  brief: LaunchBrief,
  agents: AgentOutput[],
  confidenceScore: number
): StrengthWeaknessCategory[] {
  const fs = brief.founderScore;
  const market = findAgent(agents, "Market Reality");
  const risk = findAgent(agents, "Assumption & Risk");
  const mvp = findAgent(agents, "MVP Scope");
  const opportunity = findAgent(agents, "Opportunity");
  const roadmap = findAgent(agents, "Roadmap");

  const competitorPressure = Math.min(8, brief.competitors.length * 2);
  const evidenceBreakdown = brief.evidenceScore?.breakdown;

  return [
    {
      category: "Market opportunity",
      score: clampScore(
        evidenceBreakdown
          ? (evidenceBreakdown.demandEvidence + evidenceBreakdown.competitorGap) / 3.5 - 5
          : (scaleFounderMetric(fs.marketOpportunity) + confidenceDelta(opportunity?.confidence ?? "Medium")) / 2
      ),
    },
    {
      category: "Technical feasibility",
      score: clampScore(
        evidenceBreakdown
          ? evidenceBreakdown.feasibility / 1.5 - 5
          : scaleFounderMetric(fs.feasibility)
      ),
    },
    {
      category: "Team capability",
      score: clampScore(
        evidenceBreakdown
          ? evidenceBreakdown.founderMarketFit / 1 - 5
          : scaleFounderMetric(fs.founderFit)
      ),
    },
    {
      category: "Execution speed",
      score: clampScore(
        (scaleFounderMetric(100 - fs.executionDifficulty) + confidenceDelta(roadmap?.confidence ?? "Medium")) / 2
      ),
    },
    {
      category: "Competitive moat",
      score: clampScore(6 - competitorPressure + confidenceDelta(market?.confidence ?? "Medium") / 2),
    },
    {
      category: "Customer validation",
      score: clampScore(
        evidenceBreakdown
          ? evidenceBreakdown.demandEvidence / 2 - 5
          : (scaleFounderMetric(confidenceScore) + confidenceDelta(risk?.confidence ?? "Medium")) / 2
      ),
    },
  ];
}
