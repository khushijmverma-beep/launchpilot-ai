import type { FounderIntake } from "@/lib/intake/schema";
import type { FounderProfile, IdeaStage } from "@/lib/types";

const STAGE_MAP: Record<FounderIntake["stage"], IdeaStage> = {
  "no idea yet": "no idea yet",
  "rough idea": "rough idea",
  "started building": "rough idea",
  "MVP exists": "MVP already exists",
  "users exist": "MVP already exists",
  "revenue exists": "MVP already exists",
};

export function intakeToProfile(intake: FounderIntake): FounderProfile {
  const location = [intake.locationCity, intake.locationCountry].filter(Boolean).join(", ") || intake.locationCountry;

  return {
    name: intake.name,
    location,
    status: intake.status,
    hoursPerWeek: intake.hoursPerWeek,
    budget: intake.budget,
    skills: intake.skills,
    teamStatus: intake.teamStatus,
    ideaStage: STAGE_MAP[intake.stage] ?? "rough idea",
    rawIdea: intake.rawIdea || "Exploring problem spaces",
    targetUser: intake.targetUser || "Early adopters",
    whyItMatters: intake.problem || "Needs validation with real users",
    currentAlternatives: intake.alternatives || undefined,
    evidence: [intake.evidenceLevel],
    traction: intake.stage,
    willingnessToLearn: intake.openToModification ? "High" : "Moderate",
    riskTolerance: "Moderate",
    success30Days: intake.thirtyDayGoal || "Validate core assumptions",
  };
}
