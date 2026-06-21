import { generateLaunchBrief } from "@/lib/agents";
import type { LaunchBrief } from "@/lib/types";
import { buildIntakeFromFields, type CollectedFields } from "@/lib/interview/aiInterview";
import { createEmptyAgentOutputs, isUntitledName, UNTITLED_PROJECT_NAME } from "./defaults";
import { intakeToProfile } from "./intakeToProfile";
import { buildAgentOutputs, deriveStrengthsWeaknesses } from "./deriveScores";
import { deriveConfidenceImprovements } from "./improvements";
import {
  hasEnoughDataForFullPipeline,
  mergeCollectedFields,
  mergeTranscripts,
} from "./merge";
import type { Project, PublishProjectInput, TranscriptEntry } from "./types";
import { buildProjectDescription } from "./description";

function resolveName(
  fields: Record<string, string | null>,
  transcript: TranscriptEntry[],
  existing: Project | null | undefined,
  resolvedName?: string
): string {
  if (resolvedName?.trim()) return resolvedName.trim();
  if (existing?.name.trim() && !isUntitledName(existing.name)) {
    return existing.name;
  }
  const stated = fields.projectName?.trim();
  if (stated) return stated;
  return existing?.name ?? UNTITLED_PROJECT_NAME;
}

const DRAFT_PLACEHOLDER = "Draft project — continue the interview to fill in details.";

function suggestDescription(
  fields: Record<string, string | null>,
  transcript: TranscriptEntry[]
): string {
  return buildProjectDescription(fields, transcript);
}

function resolveDescription(
  fields: Record<string, string | null>,
  transcript: TranscriptEntry[],
  existing?: Project | null
): string {
  const auto = suggestDescription(fields, transcript);
  const stored = existing?.description?.trim();

  if (stored && stored !== DRAFT_PLACEHOLDER && !stored.endsWith("…")) {
    const autoFromExisting = suggestDescription(existing!.collectedFields, existing!.transcript);
    if (stored !== autoFromExisting) {
      return stored;
    }
  }

  return auto;
}

function buildBlueprint(brief: ReturnType<typeof generateLaunchBrief>): string[] {
  const steps: string[] = [];
  for (const horizon of brief.roadmap) {
    for (const action of horizon.actions) {
      steps.push(`${horizon.horizon}: ${action}`);
    }
  }
  return steps;
}

function estimateTam(confidence: number): string {
  if (confidence >= 75) return "$18M TAM";
  if (confidence >= 60) return "$12M TAM";
  if (confidence >= 45) return "$8M TAM";
  return "$5M TAM";
}

function draftDescription(transcript: TranscriptEntry[]): string {
  const firstUserLine = transcript.find((entry) => entry.role === "user")?.content?.trim();
  if (firstUserLine) {
    return firstUserLine.length > 120 ? `${firstUserLine.slice(0, 117)}…` : firstUserLine;
  }
  return "Draft project — continue the interview to fill in details.";
}

function buildDraftProject(
  fields: Record<string, string | null>,
  transcript: TranscriptEntry[],
  existing?: Project | null,
  resolvedName?: string
): Omit<Project, "id" | "createdAt" | "updatedAt"> {
  const nextDescription = draftDescription(transcript);

  return {
    name: resolveName(fields, transcript, existing, resolvedName),
    description:
      existing?.description && existing.description !== draftDescription(existing.transcript)
        ? existing.description
        : nextDescription,
    blueprint: existing?.blueprint?.length ? existing.blueprint : [],
    stats: existing?.stats ?? null,
    strengthsWeaknesses: existing?.strengthsWeaknesses?.length ? existing.strengthsWeaknesses : [],
    agentOutputs: existing?.agentOutputs ?? createEmptyAgentOutputs(),
    transcript,
    collectedFields: fields,
  };
}

function buildFullProjectFromBrief(
  fields: Record<string, string | null>,
  transcript: TranscriptEntry[],
  brief: LaunchBrief,
  evidenceScore: { score: number } | undefined,
  existing?: Project | null,
  resolvedName?: string
): Omit<Project, "id" | "createdAt" | "updatedAt"> {
  const resolvedEvidence = brief.evidenceScore ?? (evidenceScore ? { score: evidenceScore.score } : undefined);
  const confidence = resolvedEvidence?.score ?? brief.founderScore.overall;
  const strengthsWeaknesses = deriveStrengthsWeaknesses(brief, brief.agents, confidence);
  const agentOutputs = buildAgentOutputs(brief.agents);

  const storedEvidence = brief.evidenceScore
    ? {
        score: brief.evidenceScore.score,
        verdict: brief.evidenceScore.verdict,
        reasoning: brief.evidenceScore.reasoning,
        strongestSignal: brief.evidenceScore.strongestSignal,
        weakestSignal: brief.evidenceScore.weakestSignal,
        whatCouldBeWrong: brief.evidenceScore.whatCouldBeWrong,
        nextValidationStep: brief.evidenceScore.nextValidationStep,
        breakdown: brief.evidenceScore.breakdown,
        researchMode: brief.evidenceScore.researchMode,
        scoreCapReason: brief.evidenceScore.scoreCapReason,
        sources: brief.evidenceScore.sources.slice(0, 8),
      }
    : undefined;

  return {
    name: resolveName(fields, transcript, existing, resolvedName),
    description: resolveDescription(fields, transcript, existing),
    blueprint: buildBlueprint(brief),
    stats: {
      sourcesAnalyzed: brief.sources.length,
      confidenceScore: confidence,
      competitorsFound: brief.competitors.length,
      marketSizeEstimate: estimateTam(confidence),
      competitors: brief.competitors,
      confidenceImprovements: deriveConfidenceImprovements(strengthsWeaknesses, agentOutputs, confidence),
      sources: brief.sources.map((source) => ({
        title: source.title,
        url: source.url,
        label: source.label,
        type: source.type,
      })),
      evidenceScore: storedEvidence,
    },
    strengthsWeaknesses,
    agentOutputs,
    transcript,
    collectedFields: fields,
  };
}

function buildFullProject(
  fields: Record<string, string | null>,
  transcript: TranscriptEntry[],
  evidenceScore: { score: number } | undefined,
  existing?: Project | null,
  resolvedName?: string
): Omit<Project, "id" | "createdAt" | "updatedAt"> {
  const intake = buildIntakeFromFields(fields as CollectedFields, transcript);
  const profile = intakeToProfile(intake);
  const brief = generateLaunchBrief(profile);
  return buildFullProjectFromBrief(fields, transcript, brief, evidenceScore, existing, resolvedName);
}

export function buildProjectFromInterview(
  input: PublishProjectInput,
  existing?: Project | null,
  brief?: LaunchBrief
): Omit<Project, "id" | "createdAt" | "updatedAt"> {
  const mergedFields = mergeCollectedFields(existing?.collectedFields ?? {}, input.collectedFields);
  const mergedTranscript = mergeTranscripts(existing?.transcript ?? [], input.transcript);

  if (!hasEnoughDataForFullPipeline(mergedFields, mergedTranscript)) {
    return buildDraftProject(mergedFields, mergedTranscript, existing, input.resolvedName);
  }

  if (brief) {
    return buildFullProjectFromBrief(
      mergedFields,
      mergedTranscript,
      brief,
      input.evidenceScore,
      existing,
      input.resolvedName
    );
  }

  return buildFullProject(mergedFields, mergedTranscript, input.evidenceScore, existing, input.resolvedName);
}

export function shouldRunResearchEvaluation(
  fields: Record<string, string | null | undefined>,
  transcript: TranscriptEntry[],
  existing?: Project | null
): boolean {
  const mergedFields = mergeCollectedFields(existing?.collectedFields ?? {}, fields);
  const mergedTranscript = mergeTranscripts(existing?.transcript ?? [], transcript);
  return hasEnoughDataForFullPipeline(mergedFields, mergedTranscript);
}

export { UNTITLED_PROJECT_NAME };
