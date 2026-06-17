export type EvidenceLabel =
  | "Verified"
  | "Inferred"
  | "Approximate"
  | "Needs validation"
  | "AI may be wrong"
  | "Fallback analysis"
  | "Official source"
  | "Community signal"
  | "Framework-based";

export type IdeaStage = "no idea yet" | "rough idea" | "started building" | "MVP already exists";

export type FounderProfile = {
  name: string;
  location: string;
  status: string;
  ageRange?: string;
  hoursPerWeek: number;
  budget: string;
  skills: string[];
  teamStatus: string;
  ideaStage: IdeaStage;
  rawIdea: string;
  targetUser: string;
  whyItMatters: string;
  evidence: string[];
  traction: string;
  willingnessToLearn: string;
  riskTolerance: string;
  success30Days: string;
};

export type Source = {
  id: string;
  title: string;
  url: string;
  type: string;
  label: EvidenceLabel;
};

export type ReasoningCard = {
  recommendation: string;
  why: string;
  evidenceUsed: string[];
  assumptions: string[];
  confidence: "Low" | "Medium" | "High";
  whatCouldBeWrong: string;
  howToValidate: string;
};

export type WorkspaceItem = {
  id: string;
  type:
    | "Founder Snapshot"
    | "Refined Idea"
    | "Research Notes"
    | "Competitors / Alternatives"
    | "Assumptions"
    | "Risks"
    | "MVP Plan"
    | "Current Bottleneck"
    | "Founder Reality Check"
    | "Roadmap"
    | "Pitch Assets"
    | "Opportunity Cards"
    | "Saved Decisions"
    | "Sources";
  title: string;
  content: string;
  label: EvidenceLabel;
  confidence: "Low" | "Medium" | "High";
  updatedAt: string;
};

export type AgentOutput = {
  name: string;
  role: string;
  status: "Planned" | "Running" | "Complete";
  finding: string;
  whyItMatters: string;
  label: EvidenceLabel;
  confidence: "Low" | "Medium" | "High";
  reasoning: ReasoningCard;
};

export type LaunchBrief = {
  profile: FounderProfile;
  refinedIdea: string;
  problem: string;
  targetUser: string;
  readinessLabel:
    | "Explore more"
    | "Problem-validation ready"
    | "Prototype-ready"
    | "Pilot-ready"
    | "Fundraising is premature"
    | "Funding-readiness possible later";
  currentBottleneck: string;
  strongestPoint: string;
  weakestPoint: string;
  nextValidationTask: string;
  competitors: string[];
  opportunities: string[];
  assumptions: string[];
  risks: string[];
  mvpScope: string[];
  roadmap: { horizon: string; actions: string[] }[];
  skillGaps: string[];
  pitchAssets: {
    oneLinePitch: string;
    elevatorPitch: string;
    problemStatement: string;
    interviewMessage: string;
    landingHeadline: string;
    deckOutline: string[];
  };
  responsibleAINotes: string[];
  sources: Source[];
  agents: AgentOutput[];
  workspace: WorkspaceItem[];
};
