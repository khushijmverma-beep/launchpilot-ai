import type { Project } from "./types";

const FIELD_LABELS: Record<string, string> = {
  name: "Founder name",
  projectName: "Project name",
  location: "Location",
  status: "Status",
  hoursPerWeek: "Hours per week",
  budget: "Budget",
  skills: "Skills",
  teamStatus: "Team status",
  stage: "Startup stage",
  rawIdea: "Idea",
  targetUser: "Target user",
  problem: "Problem",
  evidenceLevel: "Validation evidence",
  alternatives: "Alternatives considered",
  thirtyDayGoal: "30-day goal",
  openToModification: "Open to pivoting",
};

export function buildProjectCopilotContext(project: Project): string {
  const sections: string[] = [];

  sections.push(`Project: ${project.name}`);
  sections.push(`Description: ${project.description}`);

  const fields = Object.entries(project.collectedFields ?? {})
    .filter(([, value]) => value?.trim())
    .map(([key, value]) => `${FIELD_LABELS[key] ?? key}: ${value}`)
    .join("\n");
  if (fields) {
    sections.push(`Interview fields:\n${fields}`);
  }

  if (project.transcript?.length) {
    const transcript = project.transcript
      .map((entry) => `${entry.role === "user" ? "Founder" : "LaunchPilot"}: ${entry.content}`)
      .join("\n");
    sections.push(`Full interview transcript:\n${transcript}`);
  }

  if (project.stats?.evidenceScore) {
    const ev = project.stats.evidenceScore;
    sections.push(
      `Evidence score: ${ev.score}/100 (${ev.verdict}). Strongest: ${ev.strongestSignal}. Weakest: ${ev.weakestSignal}. Next: ${ev.nextValidationStep}`
    );
  }

  if (project.stats) {
    sections.push(
      `Analysis stats: confidence ${project.stats.confidenceScore}/100, ${project.stats.competitorsFound} competitors, ${project.stats.sourcesAnalyzed} sources, market estimate ${project.stats.marketSizeEstimate}`
    );
    if (project.stats.competitors?.length) {
      sections.push(`Competitors / alternatives: ${project.stats.competitors.join("; ")}`);
    }
  }

  if (project.strengthsWeaknesses?.length) {
    sections.push(
      `Strengths & weaknesses:\n${project.strengthsWeaknesses
        .map((item) => `- ${item.category}: ${item.score > 0 ? "+" : ""}${item.score}`)
        .join("\n")}`
    );
  }

  if (project.blueprint?.length) {
    sections.push(`Roadmap blueprint:\n${project.blueprint.map((step, index) => `${index + 1}. ${step}`).join("\n")}`);
  }

  const agents = project.agentOutputs;
  if (agents) {
    const agentLines = Object.values(agents)
      .filter(Boolean)
      .map((agent) => `${agent.name}: ${agent.finding} (${agent.confidence} confidence)`);
    if (agentLines.length) {
      sections.push(`Agent findings:\n${agentLines.join("\n")}`);
    }
  }

  return sections.join("\n\n");
}

export function projectCopilotFallback(question: string, project: Project): string {
  const lower = question.toLowerCase();
  const competitors = project.stats?.competitors ?? [];
  const confidence = project.stats?.confidenceScore ?? 0;
  const goal = project.collectedFields?.thirtyDayGoal?.trim();
  const problem = project.collectedFields?.problem?.trim();
  const idea = project.collectedFields?.rawIdea?.trim();

  if (lower.includes("competitor") || lower.includes("alternative")) {
    if (competitors.length) {
      return `The most relevant alternatives from your analysis are: ${competitors.slice(0, 4).join(", ")}. Ask interviewees which they use today and what feels missing — that wedge matters more than the list itself.`;
    }
    return "No live competitors were saved yet. Re-publish the project after a fuller interview to run market research, or ask users what they use instead.";
  }

  if (lower.includes("risk")) {
    const riskAgent = project.agentOutputs?.leadResearch?.finding;
    return riskAgent
      ? `Your biggest execution risk right now: ${riskAgent} Focus on validating demand before expanding scope.`
      : "The main risk is building before validation. Run 5–10 problem interviews this week before adding features.";
  }

  if (lower.includes("evidence") || lower.includes("gap")) {
    return confidence >= 60
      ? `Confidence is ${confidence}/100, but gaps remain in repeat usage and willingness to pay. Your next evidence task: ${goal || "collect 10 user interviews with clear pain quotes"}.`
      : `Evidence is still weak (${confidence}/100). Priority gap: proof that ${project.collectedFields?.targetUser ?? "your target user"} urgently wants ${problem || idea || "this problem"} solved.`;
  }

  if (lower.includes("validate") || lower.includes("this week")) {
    return goal
      ? `Validate this week toward your 30-day goal: "${goal}". Run 3–5 interviews, capture exact quotes, and note who asked to try a prototype.`
      : "Validate this week by interviewing 5 people in your target segment and logging repeated pain points before building more.";
  }

  if (lower.includes("today") || lower.includes("do now") || lower.includes("next")) {
    const firstStep = project.blueprint?.[0];
    return firstStep
      ? `Start today with: ${firstStep}. Keep scope narrow — one segment, one assumption, one measurable signal.`
      : "Start today by publishing or continuing your interview, then send 3 outreach messages to potential users.";
  }

  return `Based on your interview${idea ? ` about "${idea}"` : ""}, focus on validation before expansion. ${goal ? `Your stated 30-day goal: ${goal}.` : ""} Ask a specific question about competitors, risks, or next steps for a sharper answer.`;
}
