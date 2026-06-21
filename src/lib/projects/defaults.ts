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
    leadResearch: placeholder("Market Reality Agent"),
    competitor: placeholder("Assumption & Risk Agent"),
    painPoint: placeholder("MVP Scope Agent"),
    opportunity: placeholder("Opportunity Agent"),
    skillGap: placeholder("Roadmap Agent"),
    sourceQuality: placeholder("Pitch & Communication Agent"),
  };
}

export const UNTITLED_PROJECT_NAME = "Untitled Project";

export function isUntitledName(name: string): boolean {
  return name.trim().toLowerCase() === UNTITLED_PROJECT_NAME.toLowerCase();
}
