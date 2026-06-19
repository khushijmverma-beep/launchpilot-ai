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
    leadResearch: toStored(findAgent(agents, "Lead Research"), "Lead Research Agent"),
    competitor: toStored(findAgent(agents, "Competitor"), "Competitor Subagent"),
    painPoint: toStored(findAgent(agents, "Pain Point"), "Pain Point Subagent"),
    opportunity: toStored(findAgent(agents, "Opportunity"), "Opportunity Subagent"),
    skillGap: toStored(findAgent(agents, "Skill Gap"), "Skill Gap Subagent"),
    sourceQuality: toStored(findAgent(agents, "Source Quality"), "Source Quality Agent"),
  };
}

export function deriveStrengthsWeaknesses(
  brief: LaunchBrief,
  agents: AgentOutput[],
  confidenceScore: number
): StrengthWeaknessCategory[] {
  const fs = brief.founderScore;
  const lead = findAgent(agents, "Lead Research");
  const competitor = findAgent(agents, "Competitor");
  const pain = findAgent(agents, "Pain Point");
  const opportunity = findAgent(agents, "Opportunity");
  const skill = findAgent(agents, "Skill Gap");

  const competitorPressure = Math.min(8, brief.competitors.length * 2);

  return [
    {
      category: "Market opportunity",
      score: clampScore((scaleFounderMetric(fs.marketOpportunity) + confidenceDelta(opportunity?.confidence ?? "Medium")) / 2),
    },
    {
      category: "Technical feasibility",
      score: clampScore(scaleFounderMetric(fs.feasibility)),
    },
    {
      category: "Team capability",
      score: clampScore((scaleFounderMetric(fs.founderFit) + confidenceDelta(skill?.confidence ?? "Medium")) / 2),
    },
    {
      category: "Execution speed",
      score: clampScore(
        (scaleFounderMetric(100 - fs.executionDifficulty) + confidenceDelta(lead?.confidence ?? "Medium")) / 2
      ),
    },
    {
      category: "Competitive moat",
      score: clampScore(6 - competitorPressure + confidenceDelta(competitor?.confidence ?? "Medium") / 2),
    },
    {
      category: "Customer validation",
      score: clampScore((scaleFounderMetric(confidenceScore) + confidenceDelta(pain?.confidence ?? "Medium")) / 2),
    },
  ];
}
