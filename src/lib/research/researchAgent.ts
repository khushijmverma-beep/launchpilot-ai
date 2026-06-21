import type { FounderIntake, EvidenceScore, ResearchSource } from "../intake/schema";
import { calculateEvidenceScore } from "./scoring";

export type ResearchStep = {
  id: string;
  label: string;
  status: "pending" | "running" | "complete";
  finding?: string;
};

export type ResearchProgress = {
  steps: ResearchStep[];
  currentStep: number;
  isComplete: boolean;
};

export const RESEARCH_STEPS: ResearchStep[] = [
  { id: "evaluate", label: "Evaluating your startup idea", status: "pending" },
  { id: "user", label: "Understanding the target user", status: "pending" },
  { id: "competitors", label: "Searching for competitors and alternatives", status: "pending" },
  { id: "demand", label: "Looking for demand signals", status: "pending" },
  { id: "market", label: "Checking market size proxies", status: "pending" },
  { id: "feasibility", label: "Checking feasibility and execution risk", status: "pending" },
  { id: "fit", label: "Reviewing founder fit", status: "pending" },
  { id: "verdict", label: "Producing an evidence-based verdict", status: "pending" },
];

const FALLBACK_SOURCES: ResearchSource[] = [
  {
    title: "Fallback Analysis - Problem Validation Framework",
    url: "",
    snippet:
      "LaunchPilot uses deterministic analysis based on Lean Startup and validated learning principles. Live research requires API configuration.",
    sourceType: "fallback",
    supports: "Problem clarity and evidence scoring",
    limitation: "Not based on live market data",
    confidence: "medium",
    provider: "offline",
    verified: false,
    relevanceScore: 0.1,
    qualityScore: 0.1,
  },
  {
    title: "Founder Reality Check - Execution Feasibility",
    url: "",
    snippet:
      "Feasibility scored based on time available, skill match, and budget constraints.",
    sourceType: "fallback",
    supports: "Feasibility assessment",
    limitation: "Framework-based estimate only",
    confidence: "medium",
    provider: "offline",
    verified: false,
    relevanceScore: 0.1,
    qualityScore: 0.1,
  },
];

export function createInitialProgress(): ResearchProgress {
  return {
    steps: RESEARCH_STEPS.map((s) => ({ ...s })),
    currentStep: 0,
    isComplete: false,
  };
}

export async function runResearchEvaluation(intake: FounderIntake): Promise<EvidenceScore> {
  return calculateEvidenceScore(intake, FALLBACK_SOURCES, "fallback", []);
}

export function generateImprovedIdea(intake: FounderIntake, weakness: string): {
  improvedIdea: string;
  targetUser: string;
  problem: string;
  whyStronger: string;
  whatChanged: string;
  remainingRisk: string;
} {
  const originalUser = intake.targetUser || "users";
  const originalProblem = intake.problem || "problem";

  let improvedUser = originalUser;
  let improvedProblem = originalProblem;
  let whatChanged = "";

  if (weakness.includes("too broad")) {
    improvedUser = `First-time ${originalUser.toLowerCase()} in tier-2 cities`;
    whatChanged = "Narrowed target user to a specific, reachable segment";
  }

  if (weakness.includes("vague")) {
    improvedProblem = `${originalProblem} - specifically the time wasted and money lost`;
    whatChanged = whatChanged
      ? `${whatChanged}; Made problem more specific and measurable`
      : "Made problem more specific and measurable";
  }

  return {
    improvedIdea: `${intake.rawIdea} - focused on ${improvedUser}`,
    targetUser: improvedUser,
    problem: improvedProblem,
    whyStronger:
      "This version is more specific, making it easier to find and validate with real users. A narrow start gives you clear next steps.",
    whatChanged: whatChanged || "Clarified the core value proposition",
    remainingRisk: "You still need to validate users actually feel this pain strongly enough to change behavior.",
  };
}
