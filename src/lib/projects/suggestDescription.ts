import { chatCompletion } from "@/lib/llm";
import type { TranscriptEntry } from "./types";
import { buildProjectDescription } from "./description";

const MAX_DESCRIPTION_LENGTH = 320;

function sanitizeDescription(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ");

  if (!cleaned) return "";
  if (cleaned.length <= MAX_DESCRIPTION_LENGTH) return cleaned;
  return `${cleaned.slice(0, MAX_DESCRIPTION_LENGTH - 1).trim()}…`;
}

function formatTranscriptForPrompt(transcript: TranscriptEntry[]): string {
  return transcript
    .slice(-14)
    .map((entry) => `${entry.role}: ${entry.content}`)
    .join("\n");
}

function fallbackDescriptions(
  fields: Record<string, string | null | undefined>,
  transcript: TranscriptEntry[]
): string[] {
  const base = buildProjectDescription(fields, transcript);
  const idea = fields.rawIdea?.trim();
  const target = fields.targetUser?.trim();
  const problem = fields.problem?.trim();
  const goal = fields.thirtyDayGoal?.trim();

  const variants = new Set<string>();

  if (base) variants.add(base);

  if (idea && target) {
    variants.add(sanitizeDescription(`${idea} built for ${target}.`));
  }

  if (idea && problem) {
    variants.add(sanitizeDescription(`${idea} — solving ${problem.toLowerCase()}`));
  }

  if (target && problem) {
    variants.add(sanitizeDescription(`Helping ${target} with ${problem.toLowerCase()}`));
  }

  if (goal) {
    variants.add(sanitizeDescription(`Early-stage project focused on ${goal.toLowerCase()}.`));
  }

  return [...variants].filter(Boolean).slice(0, 4);
}

function parseDescriptionList(raw: string): string[] {
  const trimmed = raw.trim();

  const tryJson = (value: string): string[] | null => {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === "string")
          .map(sanitizeDescription)
          .filter(Boolean);
      }
    } catch {
      return null;
    }
    return null;
  };

  const direct = tryJson(trimmed);
  if (direct?.length) return direct;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const parsed = tryJson(fenced[1].trim());
    if (parsed?.length) return parsed;
  }

  const lines = trimmed
    .split(/\n+/)
    .map((line) => line.replace(/^\d+[\).\s-]+/, "").trim())
    .map(sanitizeDescription)
    .filter(Boolean);

  if (lines.length > 0) return lines;

  const single = sanitizeDescription(trimmed);
  return single ? [single] : [];
}

export type SuggestDescriptionInput = {
  fields: Record<string, string | null | undefined>;
  transcript: TranscriptEntry[];
  name?: string | null;
  count?: number;
  exclude?: string[];
};

export async function suggestProjectDescriptions(
  input: SuggestDescriptionInput
): Promise<string[]> {
  const count = Math.min(5, Math.max(2, input.count ?? 4));
  const exclude = new Set((input.exclude ?? []).map((item) => item.trim().toLowerCase()).filter(Boolean));
  const fallbacks = fallbackDescriptions(input.fields, input.transcript).filter(
    (item) => !exclude.has(item.toLowerCase())
  );

  const transcriptText = formatTranscriptForPrompt(input.transcript);
  const context = [
    input.name?.trim() && `Project name: ${input.name.trim()}`,
    input.fields.rawIdea?.trim() && `Idea: ${input.fields.rawIdea.trim()}`,
    input.fields.problem?.trim() && `Problem: ${input.fields.problem.trim()}`,
    input.fields.targetUser?.trim() && `Target user: ${input.fields.targetUser.trim()}`,
    input.fields.stage?.trim() && `Stage: ${input.fields.stage.trim()}`,
    input.fields.thirtyDayGoal?.trim() && `30-day goal: ${input.fields.thirtyDayGoal.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (!context && !transcriptText.trim()) {
    return fallbacks.length ? fallbacks : ["Draft project — continue the interview to fill in details."];
  }

  try {
    const raw = await chatCompletion(
      [
        {
          role: "system",
          content: `You write short startup project descriptions for a founder workspace (1-2 sentences each, max 280 characters).

Return ONLY a JSON array of ${count} distinct strings. Each description should:
- Be specific to THIS project (users, problem, product)
- Use a different angle (user pain, solution, outcome, or stage)
- Sound natural — not marketing fluff
- Avoid repeating the project name unless it helps clarity

No markdown, no numbering, no extra keys.`,
        },
        {
          role: "user",
          content: `${context ? `${context}\n\n` : ""}${
            transcriptText ? `Interview transcript:\n${transcriptText}` : ""
          }${exclude.size ? `\n\nDo not repeat these descriptions:\n${[...exclude].join("\n")}` : ""}`,
        },
      ],
      { temperature: 0.85 }
    );

    const parsed = parseDescriptionList(raw).filter((item) => !exclude.has(item.toLowerCase()));
    const merged = [...parsed];

    for (const item of fallbacks) {
      if (merged.length >= count) break;
      if (!merged.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
        merged.push(item);
      }
    }

    return merged.slice(0, count);
  } catch (error) {
    console.error("AI description suggestion failed:", error);
    return fallbacks.length
      ? fallbacks.slice(0, count)
      : [buildProjectDescription(input.fields, input.transcript)];
  }
}
