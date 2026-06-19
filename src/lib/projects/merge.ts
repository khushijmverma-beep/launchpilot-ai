import type { CollectedFields } from "@/lib/interview/aiInterview";
import { isUntitledName, UNTITLED_PROJECT_NAME } from "./defaults";
import type { Project, TranscriptEntry } from "./types";

const CORE_DETAIL_FIELDS = ["rawIdea", "targetUser", "problem", "stage", "name"] as const;

export function mergeCollectedFields(
  base: Record<string, string | null | undefined>,
  incoming: Record<string, string | null | undefined>
): Record<string, string | null> {
  const merged: Record<string, string | null> = {};

  for (const key of new Set([...Object.keys(base), ...Object.keys(incoming)])) {
    const next = incoming[key];
    const prev = base[key];
    merged[key] = (next ?? prev ?? null) as string | null;
  }

  return merged;
}

export function mergeTranscripts(existing: TranscriptEntry[], incoming: TranscriptEntry[]): TranscriptEntry[] {
  if (existing.length === 0) return incoming;
  if (incoming.length === 0) return existing;

  const isContinuation =
    incoming.length >= existing.length &&
    existing.every((entry, index) => {
      const other = incoming[index];
      return other?.role === entry.role && other?.content === entry.content;
    });

  if (isContinuation) return incoming;

  const lastExisting = existing[existing.length - 1];
  const overlapIndex = incoming.findIndex(
    (entry, index) =>
      index < existing.length &&
      entry.role === existing[index]?.role &&
      entry.content === existing[index]?.content
  );

  if (overlapIndex === 0 && incoming.length > existing.length) {
    return incoming;
  }

  if (lastExisting && incoming[0]?.role === lastExisting.role && incoming[0]?.content === lastExisting.content) {
    return [...existing, ...incoming.slice(1)];
  }

  return [...existing, ...incoming];
}

export function hasEnoughDataForFullPipeline(
  fields: Record<string, string | null | undefined>,
  transcript: TranscriptEntry[]
): boolean {
  const filledCore = CORE_DETAIL_FIELDS.filter((key) => Boolean(fields[key]?.trim())).length;
  const userMessages = transcript.filter((entry) => entry.role === "user").length;

  return filledCore >= 2 || Boolean(fields.rawIdea?.trim()) || userMessages >= 4;
}

export function pickProjectName(
  fields: CollectedFields | Record<string, string | null | undefined>,
  transcript: TranscriptEntry[],
  existing?: Project | null
): string {
  if (existing && !isUntitledName(existing.name)) {
    return existing.name;
  }

  const idea = fields.rawIdea?.trim();
  if (idea) {
    const trimmed = idea.length > 48 ? `${idea.slice(0, 45).trim()}…` : idea;
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  const firstUserLine = transcript.find((entry) => entry.role === "user")?.content?.trim();
  if (firstUserLine && firstUserLine.length > 8) {
    const prefix = fields.name?.trim() || "Founder";
    return `${prefix} — ${firstUserLine.slice(0, 40).trim()}`;
  }

  return UNTITLED_PROJECT_NAME;
}

export { UNTITLED_PROJECT_NAME };
