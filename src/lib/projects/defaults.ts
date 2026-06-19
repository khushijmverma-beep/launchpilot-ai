import type { ProjectAgentOutputs } from "./types";

export function createEmptyAgentOutputs(): ProjectAgentOutputs {
  const placeholder = (name: string) => ({
    name,
    role: "Agent",
    finding: "Not enough interview data yet.",
    whyItMatters: "Continue the interview and publish again to populate this section.",
    confidence: "Low" as const,
    label: "Pending",
    plan: [] as string[],
  });

  return {
    leadResearch: placeholder("Lead Research Agent"),
    competitor: placeholder("Competitor Subagent"),
    painPoint: placeholder("Pain Point Subagent"),
    opportunity: placeholder("Opportunity Subagent"),
    skillGap: placeholder("Skill Gap Subagent"),
    sourceQuality: placeholder("Source Quality Agent"),
  };
}

export const UNTITLED_PROJECT_NAME = "Untitled Project";

export function isUntitledName(name: string): boolean {
  return name.trim().toLowerCase() === UNTITLED_PROJECT_NAME.toLowerCase();
}
