import { chatCompletion } from "@/lib/llm";
import type { TranscriptEntry } from "./types";
import { isUntitledName, UNTITLED_PROJECT_NAME } from "./defaults";

const MAX_NAME_LENGTH = 60;

function sanitizeProjectName(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/^project name:\s*/i, "");

  if (!cleaned) return UNTITLED_PROJECT_NAME;
  if (cleaned.length <= MAX_NAME_LENGTH) return cleaned;
  return `${cleaned.slice(0, MAX_NAME_LENGTH - 1).trim()}…`;
}

function fallbackProjectName(
  fields: Record<string, string | null | undefined>,
  transcript: TranscriptEntry[]
): string {
  const idea = fields.rawIdea?.trim();
  if (idea) {
    const trimmed = idea.length > 48 ? `${idea.slice(0, 45).trim()}…` : idea;
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  const firstUserLine = transcript.find((entry) => entry.role === "user")?.content?.trim();
  if (firstUserLine && firstUserLine.length > 8) {
    return firstUserLine.length > MAX_NAME_LENGTH
      ? `${firstUserLine.slice(0, MAX_NAME_LENGTH - 1).trim()}…`
      : firstUserLine;
  }

  return UNTITLED_PROJECT_NAME;
}

function formatTranscriptForPrompt(transcript: TranscriptEntry[]): string {
  return transcript
    .slice(-12)
    .map((entry) => `${entry.role}: ${entry.content}`)
    .join("\n");
}

async function suggestNameWithAI(
  fields: Record<string, string | null | undefined>,
  transcript: TranscriptEntry[]
): Promise<string | null> {
  const transcriptText = formatTranscriptForPrompt(transcript);
  if (!transcriptText.trim()) return null;

  const context = [
    fields.rawIdea?.trim() && `Idea: ${fields.rawIdea.trim()}`,
    fields.problem?.trim() && `Problem: ${fields.problem.trim()}`,
    fields.targetUser?.trim() && `Target user: ${fields.targetUser.trim()}`,
    fields.stage?.trim() && `Stage: ${fields.stage.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await chatCompletion(
    [
      {
        role: "system",
        content: `You name early-stage startup projects. Return ONLY a short project title (2-5 words), like a product or company name — not a sentence, not a tagline, no quotes, no punctuation at the end.

If the founder clearly said what they want to call it, use that exact name.
Otherwise invent a plausible, specific name based on what they're building.`,
      },
      {
        role: "user",
        content: `${context ? `${context}\n\n` : ""}Interview transcript:\n${transcriptText}`,
      },
    ],
    { temperature: 0.6 }
  );

  const name = sanitizeProjectName(raw.split("\n")[0] ?? "");
  return name === UNTITLED_PROJECT_NAME ? null : name;
}

export type ResolveProjectNameInput = {
  fields: Record<string, string | null | undefined>;
  transcript: TranscriptEntry[];
  existingName?: string | null;
};

export async function resolveProjectName(input: ResolveProjectNameInput): Promise<string> {
  if (input.existingName && !isUntitledName(input.existingName)) {
    return input.existingName;
  }

  const stated = input.fields.projectName?.trim();
  if (stated) {
    return sanitizeProjectName(stated);
  }

  try {
    const suggested = await suggestNameWithAI(input.fields, input.transcript);
    if (suggested) return suggested;
  } catch (error) {
    console.error("AI project name suggestion failed:", error);
  }

  return fallbackProjectName(input.fields, input.transcript);
}
