import type { ProjectAgentOutputs, StrengthWeaknessCategory } from "./types";

const CATEGORY_IMPROVEMENTS: Record<string, string> = {
  "Market opportunity": "Validate demand with 5–10 interviews in your target segment.",
  "Technical feasibility": "Scope a thin MVP and list the hardest technical unknowns first.",
  "Team capability": "Map skill gaps and decide what to learn vs. outsource this month.",
  "Execution speed": "Pick one bottleneck and ship a validation sprint in the next 7 days.",
  "Competitive moat": "Interview users on what they use today and what feels missing.",
  "Customer validation": "Collect proof of pain — interviews, waitlist signups, or usage data.",
};

export function parseCompetitorsFromFinding(finding: string): string[] {
  const match = finding.match(/alternatives found:\s*(.+?)\.?$/i);
  if (!match?.[1]) return [];

  return match[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function deriveConfidenceImprovements(
  strengthsWeaknesses: StrengthWeaknessCategory[],
  agentOutputs: ProjectAgentOutputs,
  confidenceScore: number
): string[] {
  const tips: string[] = [];

  const weakest = [...strengthsWeaknesses].sort((a, b) => a.score - b.score).slice(0, 3);
  for (const category of weakest) {
    if (category.score >= 0) continue;
    const tip = CATEGORY_IMPROVEMENTS[category.category];
    if (tip && !tips.includes(tip)) tips.push(tip);
  }

  if (confidenceScore < 50) {
    tips.push("Run structured user interviews before building more product.");
  } else if (confidenceScore < 70) {
    tips.push("Add concrete validation evidence to raise your confidence score.");
  }

  const agentPlans = [
    ...(agentOutputs.painPoint.plan ?? []),
    ...(agentOutputs.skillGap.plan ?? []),
    ...(agentOutputs.competitor.plan ?? []),
    ...(agentOutputs.leadResearch.plan ?? []),
  ];

  for (const plan of agentPlans) {
    if (tips.length >= 5) break;
    if (!tips.includes(plan)) tips.push(plan);
  }

  if (tips.length === 0) {
    tips.push("Continue the interview and re-publish after more founder context.");
  }

  return tips.slice(0, 5);
}
