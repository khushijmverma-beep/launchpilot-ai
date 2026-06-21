export type ProjectSourceSummary = {
  title: string;
  url: string;
  label: string;
  type?: string;
};

export type ProjectStats = {
  sourcesAnalyzed: number;
  confidenceScore: number;
  competitorsFound: number;
  marketSizeEstimate: string;
  competitors?: string[];
  confidenceImprovements?: string[];
  sources?: ProjectSourceSummary[];
};

export type StrengthWeaknessCategory = {
  category: string;
  score: number;
};

export type StoredAgentOutput = {
  name: string;
  role: string;
  finding: string;
  whyItMatters: string;
  confidence: string;
  label: string;
  plan?: string[];
};

export type ProjectAgentOutputs = {
  leadResearch: StoredAgentOutput;
  competitor: StoredAgentOutput;
  painPoint: StoredAgentOutput;
  opportunity: StoredAgentOutput;
  skillGap: StoredAgentOutput;
  sourceQuality: StoredAgentOutput;
};

export type TranscriptEntry = {
  role: "assistant" | "user";
  content: string;
};

/** Client-side project (Firestore document + id) */
export type Project = {
  id: string;
  name: string;
  description: string;
  blueprint: string[];
  stats: ProjectStats | null;
  strengthsWeaknesses: StrengthWeaknessCategory[];
  agentOutputs: ProjectAgentOutputs;
  transcript: TranscriptEntry[];
  collectedFields: Record<string, string | null>;
  conversationId?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
};

/** Lightweight row for Workspace list */
export type ProjectListItem = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

export type PublishProjectInput = {
  collectedFields: Record<string, string | null | undefined>;
  transcript: TranscriptEntry[];
  evidenceScore?: { score: number };
  conversationId?: string;
  projectId?: string;
  resolvedName?: string;
};
