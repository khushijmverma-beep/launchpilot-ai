import { generateLaunchBrief } from "@/lib/agents";
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

function suggestDescription(brief: ReturnType<typeof generateLaunchBrief>): string {
  return brief.refinedIdea.length > 120 ? `${brief.refinedIdea.slice(0, 117)}…` : brief.refinedIdea;
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
  const confidence = evidenceScore?.score ?? brief.founderScore.overall;
  const strengthsWeaknesses = deriveStrengthsWeaknesses(brief, brief.agents, confidence);
  const agentOutputs = buildAgentOutputs(brief.agents);

  return {
    name: resolveName(fields, transcript, existing, resolvedName),
    description: suggestDescription(brief),
    blueprint: buildBlueprint(brief),
    stats: {
      sourcesAnalyzed: brief.sources.length,
      confidenceScore: confidence,
      competitorsFound: brief.competitors.length,
      marketSizeEstimate: estimateTam(confidence),
      competitors: brief.competitors,
      confidenceImprovements: deriveConfidenceImprovements(strengthsWeaknesses, agentOutputs, confidence),
    },
    strengthsWeaknesses,
    agentOutputs,
    transcript,
    collectedFields: fields,
  };
}

export function buildProjectFromInterview(
  input: PublishProjectInput,
  existing?: Project | null
): Omit<Project, "id" | "createdAt" | "updatedAt"> {
  const mergedFields = mergeCollectedFields(existing?.collectedFields ?? {}, input.collectedFields);
  const mergedTranscript = mergeTranscripts(existing?.transcript ?? [], input.transcript);

  if (!hasEnoughDataForFullPipeline(mergedFields, mergedTranscript)) {
    return buildDraftProject(mergedFields, mergedTranscript, existing, input.resolvedName);
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
