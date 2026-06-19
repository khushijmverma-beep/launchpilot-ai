import type { FounderIntake, EvidenceScore } from "../intake/schema";

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
  {
    id: "evaluate",
    label: "Evaluating your startup idea",
    status: "pending",
  },
  {
    id: "user",
    label: "Understanding the target user",
    status: "pending",
  },
  {
    id: "competitors",
    label: "Searching for competitors and alternatives",
    status: "pending",
  },
  {
    id: "demand",
    label: "Looking for demand signals",
    status: "pending",
  },
  {
    id: "market",
    label: "Checking market size proxies",
    status: "pending",
  },
  {
    id: "feasibility",
    label: "Checking feasibility and execution risk",
    status: "pending",
  },
  {
    id: "fit",
    label: "Reviewing founder fit",
    status: "pending",
  },
  {
    id: "verdict",
    label: "Producing an evidence-based verdict",
    status: "pending",
  },
];

/**
 * Create initial research progress
 */
export function createInitialProgress(): ResearchProgress {
  return {
    steps: RESEARCH_STEPS.map((s) => ({ ...s })),
    currentStep: 0,
    isComplete: false,
  };
}

/**
 * Run the complete research evaluation
 */
export async function runResearchEvaluation(intake: FounderIntake): Promise<EvidenceScore> {
  // This is a deterministic fallback implementation
  // In production, this would call live search APIs, competitor databases, etc.

  // 1. Problem clarity score
  const problemScore = evaluateProblemClarity(intake);

  // 2. Target user sharpness
  const userScore = evaluateTargetUser(intake);

  // 3. Demand evidence
  const demandScore = evaluateDemandEvidence(intake);

  // 4. Competitor gap
  const competitorScore = evaluateCompetitorGap(intake);

  // 5. Feasibility
  const feasibilityScore = evaluateFeasibility(intake);

  // 6. Founder-market fit
  const founderFitScore = evaluateFounderFit(intake);

  // 7. Risk level
  const riskScore = evaluateRisk(intake);

  // Calculate weighted score
  const totalScore =
    problemScore * 0.2 +
    userScore * 0.15 +
    demandScore * 0.2 +
    competitorScore * 0.15 +
    feasibilityScore * 0.15 +
    founderFitScore * 0.1 +
    riskScore * 0.05;

  // Determine verdict
  let verdict: "strong" | "promising_needs_modification" | "weak" | "reject";
  if (totalScore >= 80) verdict = "strong";
  else if (totalScore >= 60) verdict = "promising_needs_modification";
  else if (totalScore >= 40) verdict = "weak";
  else verdict = "reject";

  // Build evidence score
  const evidenceScore: EvidenceScore = {
    score: Math.round(totalScore),
    verdict,
    reasoning: generateReasoning(intake, totalScore, verdict),
    strongestSignal: identifyStrongestSignal(intake, {
      problemScore,
      userScore,
      demandScore,
      competitorScore,
      feasibilityScore,
      founderFitScore,
    }),
    weakestSignal: identifyWeakestSignal(intake, {
      problemScore,
      userScore,
      demandScore,
      competitorScore,
      feasibilityScore,
      founderFitScore,
    }),
    whatCouldBeWrong: generateWhatCouldBeWrong(intake, verdict),
    nextValidationStep: generateNextValidationStep(intake, verdict),
    sources: generateSources(intake),
  };

  return evidenceScore;
}

function evaluateProblemClarity(intake: FounderIntake): number {
  const problem = intake.problem?.toLowerCase() || "";

  if (problem.length < 10) return 20;

  // Check for specificity
  const hasSpecificity = /waste|expensive|time-consuming|frustrating|confusing|unreliable|slow|manual/.test(problem);
  const hasPainWords = /pain|problem|struggle|difficult|hard|annoying|frustrating/.test(problem);

  let score = 40;
  if (hasSpecificity) score += 30;
  if (hasPainWords) score += 20;
  if (problem.length > 50) score += 10;

  return Math.min(score, 100);
}

function evaluateTargetUser(intake: FounderIntake): number {
  const user = intake.targetUser?.toLowerCase() || "";

  // Too broad
  if (/(everyone|anyone|people|users|all)/.test(user)) return 20;
  if (user === "students" || user === "businesses") return 30;

  // Good qualifiers
  const hasQualifier = /(first.year|college|tier|small|early.stage|local|freelance|working|professional)/.test(user);

  let score = 50;
  if (hasQualifier) score += 30;
  if (user.length > 15) score += 10;
  if (user.includes("specific") || user.includes("niche")) score += 10;

  return Math.min(score, 100);
}

function evaluateDemandEvidence(intake: FounderIntake): number {
  const evidence = intake.evidenceLevel?.toLowerCase() || "";

  if (!evidence || evidence === "none" || evidence.includes("only my own belief")) return 20;
  if (evidence.includes("personal experience")) return 40;
  if (evidence.includes("friends") || evidence.includes("classmates")) return 50;
  if (evidence.includes("community") || evidence.includes("reddit") || evidence.includes("posts")) return 60;
  if (evidence.includes("competitors exist")) return 65;
  if (evidence.includes("survey") || evidence.includes("interview")) return 75;
  if (evidence.includes("users") || evidence.includes("customers")) return 85;
  if (evidence.includes("revenue") || evidence.includes("paying")) return 95;

  return 40;
}

function evaluateCompetitorGap(intake: FounderIntake): number {
  const alternatives = intake.alternatives?.toLowerCase() || "";

  if (!alternatives || alternatives === "nothing" || alternatives === "none") {
    // No alternatives could mean no market OR untapped space
    // Check if problem is validated
    const evidenceScore = evaluateDemandEvidence(intake);
    return evidenceScore > 50 ? 70 : 30; // If evidence is strong, no alternatives is good
  }

  // Has alternatives - check for gaps
  const hasManual = /(manual|spreadsheet|excel|paper|word of mouth)/.test(alternatives);
  const hasCompetitor = /(competitor|app|tool|service|platform)/.test(alternatives);

  if (hasManual) return 75; // Manual alternatives = good opportunity
  if (hasCompetitor) return 50; // Has competitors but might have differentiation

  return 60;
}

function evaluateFeasibility(intake: FounderIntake): number {
  let score = 50;

  // Hours available
  if (intake.hoursPerWeek >= 15) score += 20;
  else if (intake.hoursPerWeek >= 10) score += 15;
  else if (intake.hoursPerWeek >= 5) score += 10;
  else score -= 10;

  // Skills
  if (intake.skills.length >= 3) score += 15;
  else if (intake.skills.length >= 1) score += 10;

  // Budget
  if (intake.budget.includes("25,000+")) score += 10;
  else if (intake.budget.includes("5,000")) score += 5;

  // Team
  if (intake.teamStatus.includes("team") || intake.teamStatus.includes("co-founder")) score += 10;

  return Math.min(score, 100);
}

function evaluateFounderFit(intake: FounderIntake): number {
  const evidence = intake.evidenceLevel?.toLowerCase() || "";

  // Personal experience = strong founder fit
  if (evidence.includes("personal experience")) return 80;

  // Domain signal from problem description
  const problem = intake.problem?.toLowerCase() || "";
  const user = intake.targetUser?.toLowerCase() || "";
  const status = intake.status?.toLowerCase() || "";

  // Student building for students = good fit
  if (status.includes("student") && user.includes("student")) return 75;

  // Professional building for professionals = good fit
  if (status.includes("professional") && user.includes("professional")) return 75;

  return 50;
}

function evaluateRisk(intake: FounderIntake): number {
  // Lower risk = higher score
  let score = 70;

  // Technical complexity risk
  const idea = intake.rawIdea?.toLowerCase() || "";
  if (/(ai|ml|blockchain|crypto)/.test(idea)) score -= 15;
  if (/(marketplace|two.sided|platform)/.test(idea)) score -= 10;

  // Execution risk
  if (intake.hoursPerWeek < 5) score -= 15;
  if (intake.budget.includes("₹0")) score -= 10;

  return Math.max(score, 0);
}

function identifyStrongestSignal(
  intake: FounderIntake,
  scores: Record<string, number>
): string {
  const maxScore = Math.max(...Object.values(scores));
  const maxKey = Object.keys(scores).find((key) => scores[key] === maxScore);

  switch (maxKey) {
    case "problemScore":
      return "Problem is clearly defined and painful";
    case "userScore":
      return "Target user is specific and reachable";
    case "demandScore":
      return "Strong evidence that this problem exists";
    case "feasibilityScore":
      return "You have the time and skills to execute";
    case "founderFitScore":
      return "Strong founder-market fit";
    default:
      return "Competitor gap presents opportunity";
  }
}

function identifyWeakestSignal(
  intake: FounderIntake,
  scores: Record<string, number>
): string {
  const minScore = Math.min(...Object.values(scores));
  const minKey = Object.keys(scores).find((key) => scores[key] === minScore);

  switch (minKey) {
    case "problemScore":
      return "Problem definition is too vague";
    case "userScore":
      return "Target user is too broad";
    case "demandScore":
      return "No clear evidence of demand";
    case "feasibilityScore":
      return "Time or skill constraints";
    case "founderFitScore":
      return "Limited founder-market fit";
    default:
      return "Competitive landscape unclear";
  }
}

function generateReasoning(intake: FounderIntake, score: number, verdict: string): string {
  if (verdict === "strong") {
    return `Your idea scores ${score}/100. The problem is clear, target user is specific, and you have reasonable evidence. You're ready to start validation.`;
  }

  if (verdict === "promising_needs_modification") {
    return `Your idea scores ${score}/100. It has potential but needs narrowing. The target user or problem definition is too broad for a first step.`;
  }

  if (verdict === "weak") {
    return `Your idea scores ${score}/100. The current version shows weak demand signals or unclear differentiation. I recommend narrowing the scope significantly.`;
  }

  return `Your idea scores ${score}/100. The evidence is too weak to proceed. Let's brainstorm a stronger direction based on your constraints and market signals.`;
}

function generateWhatCouldBeWrong(intake: FounderIntake, verdict: string): string {
  if (verdict === "reject") {
    return "The problem may not be painful enough, the target user too broad, or the evidence insufficient for this stage.";
  }

  if (verdict === "weak") {
    return "You might be solving a low-priority problem, or the market might already have good-enough solutions.";
  }

  return "Assumptions about user behavior, willingness to pay, or competition intensity may be incorrect.";
}

function generateNextValidationStep(intake: FounderIntake, verdict: string): string {
  const evidence = intake.evidenceLevel?.toLowerCase() || "";

  if (evidence.includes("personal experience") || evidence.includes("only my own belief")) {
    return "Interview 5-10 target users to validate the problem is real for them too.";
  }

  if (verdict === "strong") {
    return "Build a simple landing page and test if 10 users sign up for early access.";
  }

  return "Spend 1 week researching competitors and interviewing 3 target users before building anything.";
}

function generateSources(intake: FounderIntake): EvidenceScore["sources"] {
  // Fallback sources - clearly labeled
  return [
    {
      title: "Fallback Analysis - Problem Validation Framework",
      url: "#",
      snippet:
        "LaunchPilot uses deterministic analysis based on Lean Startup and validated learning principles. Live research requires API configuration.",
      sourceType: "fallback",
      supports: "Problem clarity and evidence scoring",
      limitation: "Not based on live market data",
      confidence: "medium",
    },
    {
      title: "Founder Reality Check - Execution Feasibility",
      url: "#",
      snippet:
        "Feasibility scored based on time available, skill match, and budget constraints. Based on common startup execution patterns.",
      sourceType: "framework-based",
      supports: "Feasibility assessment",
      confidence: "medium",
    },
  ];
}

/**
 * Generate improved idea suggestion
 */
export function generateImprovedIdea(intake: FounderIntake, weakness: string): {
  improvedIdea: string;
  targetUser: string;
  problem: string;
  whyStronger: string;
  whatChanged: string;
  remainingRisk: string;
} {
  // This would use AI in production
  // For now, provide rule-based narrowing

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
