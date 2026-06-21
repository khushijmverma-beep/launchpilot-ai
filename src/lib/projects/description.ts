import type { TranscriptEntry } from "./types";

function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ensurePeriod(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function buildProjectDescription(
  fields: Record<string, string | null | undefined>,
  transcript: TranscriptEntry[] = []
): string {
  const idea = fields.rawIdea?.trim();
  const target = fields.targetUser?.trim();
  const problem = fields.problem?.trim();
  const goal = fields.thirtyDayGoal?.trim();

  const sentences: string[] = [];

  if (idea) {
    let line = capitalizeFirst(idea);
    if (target && !idea.toLowerCase().includes(target.toLowerCase())) {
      line = `${line} for ${target}`;
    }
    sentences.push(ensurePeriod(line));
  } else if (target) {
    sentences.push(ensurePeriod(`A startup focused on ${target}`));
  }

  if (problem) {
    sentences.push(ensurePeriod(capitalizeFirst(problem)));
  }

  if (goal && sentences.length < 3) {
    sentences.push(ensurePeriod(`30-day goal: ${goal}`));
  }

  if (sentences.length > 0) {
    return sentences.join(" ");
  }

  const firstUserLine = transcript.find((entry) => entry.role === "user")?.content?.trim();
  if (firstUserLine) {
    return ensurePeriod(capitalizeFirst(firstUserLine));
  }

  return "Draft project — continue the interview to fill in details.";
}

const DRAFT_PLACEHOLDER = "Draft project — continue the interview to fill in details.";

export function getProjectDisplayDescription(project: {
  description: string;
  collectedFields: Record<string, string | null>;
  transcript: TranscriptEntry[];
}): string {
  const stored = project.description.trim();
  if (stored && stored !== DRAFT_PLACEHOLDER && !stored.endsWith("…")) {
    return stored;
  }

  return buildProjectDescription(project.collectedFields, project.transcript);
}
