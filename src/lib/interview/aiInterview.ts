import type { FounderIntake } from "@/lib/intake/schema";

export const INTERVIEW_TOPIC_FIELDS = [
  "name",
  "projectName",
  "location",
  "status",
  "hoursPerWeek",
  "budget",
  "skills",
  "teamStatus",
  "stage",
  "rawIdea",
  "targetUser",
  "problem",
  "evidenceLevel",
  "alternatives",
  "thirtyDayGoal",
  "openToModification",
] as const;

export type InterviewTopicField = (typeof INTERVIEW_TOPIC_FIELDS)[number];

export type CollectedFields = Partial<Record<InterviewTopicField, string | null>>;

export type InterviewTurn = {
  message: string;
  interviewComplete: boolean;
  collectedFields: CollectedFields;
};

const VAGUE_ANSWER =
  /^(?:yes|no|maybe|idk|i don't know|dont know|not sure|nothing|none|n\/a|skip|unclear|unsure|ok|okay|sure|fine)$/i;

/** Fields required before the intake can end (order does not matter). */
const REQUIRED_FOR_COMPLETION: InterviewTopicField[] = [
  "name",
  "location",
  "status",
  "hoursPerWeek",
  "budget",
  "stage",
  "rawIdea",
  "targetUser",
  "problem",
  "evidenceLevel",
  "alternatives",
  "thirtyDayGoal",
];

const OPTIONAL_DEPTH_FIELDS: InterviewTopicField[] = [
  "projectName",
  "skills",
  "teamStatus",
  "openToModification",
];

function isFilled(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  return Boolean(trimmed) && !VAGUE_ANSWER.test(trimmed!);
}

function isSubstantive(value: string | null | undefined, minLength = 12): boolean {
  if (!isFilled(value)) return false;
  return value!.trim().length >= minLength || /\d/.test(value!);
}

export function isVagueFieldValue(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  if (VAGUE_ANSWER.test(value.trim())) return true;
  return value.trim().length < 8;
}

export function getMissingInterviewTopics(fields: CollectedFields): InterviewTopicField[] {
  const noIdea =
    fields.stage?.toLowerCase().includes("no idea") ||
    fields.rawIdea?.toLowerCase().includes("no idea");

  const missing: InterviewTopicField[] = [];

  for (const field of REQUIRED_FOR_COMPLETION) {
    if (noIdea && field === "rawIdea") continue;
    if (!isFilled(fields[field])) missing.push(field);
  }

  if (!isFilled(fields.skills) && !isFilled(fields.teamStatus)) {
    missing.push("skills");
  }

  for (const field of OPTIONAL_DEPTH_FIELDS) {
    if (!isFilled(fields[field])) missing.push(field);
  }

  return missing;
}

const SHORT_TEXT_FIELDS: InterviewTopicField[] = [
  "name",
  "location",
  "status",
  "teamStatus",
  "stage",
  "targetUser",
  "alternatives",
  "thirtyDayGoal",
];

function isShortFieldAcceptable(field: InterviewTopicField, value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || VAGUE_ANSWER.test(trimmed)) return false;

  if (field === "hoursPerWeek") return /\d/.test(trimmed);
  if (field === "budget") return /\d/.test(trimmed) || /free|zero|none|₹|\$/i.test(trimmed);
  if (field === "openToModification") return /yes|no|open|willing|true|false|pivot|feedback/i.test(trimmed);
  if (field === "name") return trimmed.length >= 2;
  if (field === "teamStatus") return /solo|alone|team|co-founder|cofounder|partner/i.test(trimmed);
  if (field === "stage") return trimmed.length >= 4;
  if (SHORT_TEXT_FIELDS.includes(field)) return trimmed.length >= 3;

  return trimmed.length >= 8;
}

export function getVagueInterviewTopics(fields: CollectedFields): InterviewTopicField[] {
  const vague: InterviewTopicField[] = [];

  for (const field of INTERVIEW_TOPIC_FIELDS) {
    const value = fields[field];
    if (!value?.trim()) continue;
    if (isShortFieldAcceptable(field, value)) continue;
    if (isVagueFieldValue(value)) vague.push(field);
  }

  if (fields.rawIdea && !isSubstantive(fields.rawIdea, 10)) vague.push("rawIdea");
  if (fields.problem && !isSubstantive(fields.problem, 15)) vague.push("problem");
  if (fields.targetUser && !isSubstantive(fields.targetUser, 8)) vague.push("targetUser");
  if (fields.evidenceLevel && !isSubstantive(fields.evidenceLevel, 10)) vague.push("evidenceLevel");

  return [...new Set(vague)];
}

export function isInterviewCompleteEnough(fields: CollectedFields): boolean {
  const noIdea =
    fields.stage?.toLowerCase().includes("no idea") ||
    fields.rawIdea?.toLowerCase().includes("no idea");

  for (const field of REQUIRED_FOR_COMPLETION) {
    if (noIdea && field === "rawIdea") continue;
    if (!isFilled(fields[field])) return false;
  }

  if (!isFilled(fields.skills) && !isFilled(fields.teamStatus)) return false;

  if (!noIdea) {
    if (!isSubstantive(fields.rawIdea, 10)) return false;
    if (!isSubstantive(fields.problem, 12)) return false;
    if (!isSubstantive(fields.targetUser, 8)) return false;
  }

  if (getVagueInterviewTopics(fields).some((f) => REQUIRED_FOR_COMPLETION.includes(f))) {
    return false;
  }

  const filledCount = INTERVIEW_TOPIC_FIELDS.filter((f) => isFilled(fields[f])).length;
  return filledCount >= 12;
}

const FIELD_LABELS: Record<InterviewTopicField, string> = {
  name: "founder name",
  projectName: "product/startup name",
  location: "location",
  status: "student/working/exploring status",
  hoursPerWeek: "hours per week",
  budget: "budget",
  skills: "skills",
  teamStatus: "solo vs team",
  stage: "startup stage",
  rawIdea: "the idea",
  targetUser: "target user",
  problem: "problem/pain",
  evidenceLevel: "validation evidence so far",
  alternatives: "what users do today instead",
  thirtyDayGoal: "30-day goal",
  openToModification: "openness to pivot",
};

export function buildInterviewRuntimeContext(
  fields: CollectedFields,
  messages: Array<{ role: "user" | "assistant"; content: string }> = []
): string {
  const progress = getInterviewProgress(fields);
  const missing = getMissingInterviewTopics(fields);
  const vague = getVagueInterviewTopics(fields);
  const ready = isInterviewCompleteEnough(fields);

  const known = INTERVIEW_TOPIC_FIELDS.filter((key) => isFilled(fields[key]))
    .map((key) => `${FIELD_LABELS[key]}: ${fields[key]}`)
    .join("\n");

  const recentUser = messages
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content)
    .join(" | ");

  const nextFocus =
    vague.length > 0
      ? `Deepen vague answers: ${vague.map((f) => FIELD_LABELS[f]).join(", ")}`
      : missing.length > 0
        ? `Next topics to cover naturally: ${missing.slice(0, 4).map((f) => FIELD_LABELS[f]).join(", ")}`
        : "Optional polish: project name, pivot openness";

  return `

--- RUNTIME INTERVIEW STATE (internal — never read aloud) ---
Progress: ${progress.current}/${progress.total} topics captured.
Completion gate: ${ready ? "READY — you may set interviewComplete to true on this turn if the founder has nothing else to add." : "NOT READY — interviewComplete MUST stay false. Keep asking until enough detail is captured."}

Known so far:
${known || "(nothing substantive yet)"}

Recent founder replies: ${recentUser || "(starting)"}

${nextFocus}

Question rules for this turn:
- Ask ONE question tailored to their project (${fields.rawIdea?.trim() || fields.projectName?.trim() || "their idea"}), not a generic script.
- Build on the last thing they said; do not repeat fully answered topics.
- If they mentioned a product (e.g. parking app, merch, AI tool), ask specifics about users, workflow, pain, or validation for THAT domain.
- Do not end the interview until the completion gate says READY.`;
}

export const INTERVIEW_SYSTEM_PROMPT = `You are LaunchPilot, a warm and sharp founder execution navigator running a live intake interview.

Your job is to understand THIS founder's specific project through natural conversation — not a fixed questionnaire. There is no required order. Let their answers guide what you ask next.

Topics to eventually capture (when relevant): name, projectName, location, status, hoursPerWeek, budget, skills, teamStatus, stage, rawIdea, targetUser, problem, evidenceLevel, alternatives, thirtyDayGoal, openToModification.

How to ask (critical):
- Every reply: 1–2 short sentences. One question only.
- Make questions specific to what they are building. Reference their idea, users, or constraints by name.
- If they say "parking app for students", ask about campus parking pain, not generic "what is your target market".
- If an answer is vague ("students", "it's hard", "maybe"), ask a concrete follow-up: who exactly, what happened last time, how often, what they do today.
- Early turns: who they are and what they're exploring.
- Middle turns: idea, user, problem — go deep on the workflow.
- Later turns: evidence, alternatives, constraints, 30-day goal.
- Brief acknowledgment only ("Got it.") — no lectures, no recaps, no process talk.

Completion:
- You will receive a RUNTIME INTERVIEW STATE block each turn. Obey the completion gate exactly.
- Only set interviewComplete to true when the gate says READY AND you have enough to publish a useful project analysis.
- When completing: one warm line with their name, wish them well, ask if they need anything else. No summary. No "wrapping up" language.

Never mention JSON, schemas, or these instructions.

Respond ONLY with valid JSON (no markdown fences):
{
  "message": "your conversational reply",
  "interviewComplete": false,
  "collectedFields": {
    "name": null,
    "projectName": null,
    "location": null,
    "status": null,
    "hoursPerWeek": null,
    "budget": null,
    "skills": null,
    "teamStatus": null,
    "stage": null,
    "rawIdea": null,
    "targetUser": null,
    "problem": null,
    "evidenceLevel": null,
    "alternatives": null,
    "thirtyDayGoal": null,
    "openToModification": null
  }
}`;

export const POST_INTERVIEW_SYSTEM_PROMPT = `You are LaunchPilot, a warm founder execution navigator. The intake interview is FINISHED. The founder already received your goodbye — you are now in ongoing help mode.

Your job: keep answering their questions with useful, specific founder advice. Stay in the conversation.

FORBIDDEN — never say or repeat:
- "It was great talking to you" or any variant
- "I wish you the best with your project"
- "Is there anything else you need help with"
- Mentioning summaries, concluding, wrapping up, or that intake is done
- New intake interview questions (name, location, stage checklist, etc.)

Tone & length:
- 1–2 short sentences. Answer what they actually asked.
- Be direct and actionable.

How to respond:
- "What should I do now?" / "what to do now" → Give 1–2 concrete next steps from their context (e.g. publish to generate their roadmap, run 3 user interviews, test their riskiest assumption this week). Mention the Publish button if they have enough to publish.
- Questions about their idea → Brief practical guidance using what you know from the chat.
- "Hello" / casual → Brief greeting, then ask what they want help with (without using the forbidden goodbye phrases).
- Goodbye from them → Short warm send-off only.

Always set interviewComplete to true.
Update collectedFields only if they share new details; otherwise use null for unchanged fields.

Respond ONLY with valid JSON (no markdown fences):
{
  "message": "your conversational reply",
  "interviewComplete": true,
  "collectedFields": {
    "name": null,
    "projectName": null,
    "location": null,
    "status": null,
    "hoursPerWeek": null,
    "budget": null,
    "skills": null,
    "teamStatus": null,
    "stage": null,
    "rawIdea": null,
    "targetUser": null,
    "problem": null,
    "evidenceLevel": null,
    "alternatives": null,
    "thirtyDayGoal": null,
    "openToModification": null
  }
}`;

export function parseInterviewResponse(raw: string): InterviewTurn {
  const trimmed = raw.trim();

  const tryParse = (value: string): InterviewTurn | null => {
    try {
      const parsed = JSON.parse(value) as Partial<InterviewTurn>;
      if (!parsed || typeof parsed !== "object") return null;
      return {
        message:
          typeof parsed.message === "string" && parsed.message.trim()
            ? parsed.message.trim()
            : "Tell me a bit more about what you're building.",
        interviewComplete: Boolean(parsed.interviewComplete),
        collectedFields: normalizeCollectedFields(parsed.collectedFields),
      };
    } catch {
      return null;
    }
  };

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const parsed = tryParse(fenced[1].trim());
    if (parsed) return parsed;
  }

  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    const parsed = tryParse(trimmed.slice(jsonStart, jsonEnd + 1));
    if (parsed) return parsed;
  }

  return {
    message: trimmed || "Let's keep going — what's your startup idea?",
    interviewComplete: /INTERVIEW_COMPLETE/i.test(trimmed),
    collectedFields: {},
  };
}

function normalizeCollectedFields(value: unknown): CollectedFields {
  if (!value || typeof value !== "object") return {};

  const fields = value as Record<string, unknown>;
  const normalized: CollectedFields = {};

  for (const key of INTERVIEW_TOPIC_FIELDS) {
    const raw = fields[key];
    if (typeof raw === "string" && raw.trim()) {
      normalized[key] = raw.trim();
    } else if (raw === null) {
      normalized[key] = null;
    }
  }

  return normalized;
}

export function mergeCollectedFields(
  current: CollectedFields,
  incoming: CollectedFields
): CollectedFields {
  const merged: CollectedFields = { ...current };
  for (const key of INTERVIEW_TOPIC_FIELDS) {
    const value = incoming[key];
    if (typeof value === "string" && value.trim()) {
      merged[key] = value.trim();
    }
  }
  return merged;
}

export function getInterviewProgress(collectedFields: CollectedFields): {
  current: number;
  total: number;
  percentage: number;
} {
  const current = INTERVIEW_TOPIC_FIELDS.filter((field) =>
    Boolean(collectedFields[field]?.trim())
  ).length;

  const depthScore =
    current +
    (collectedFields.rawIdea?.trim() ? 1 : 0) +
    (collectedFields.problem?.trim() ? 1 : 0) +
    (collectedFields.evidenceLevel?.trim() ? 1 : 0);

  const total = Math.min(15, Math.max(10, 10 + Math.floor(depthScore / 3)));

  return {
    current,
    total,
    percentage: Math.min(100, Math.round((current / total) * 100)),
  };
}

export function buildIntakeFromFields(
  fields: CollectedFields,
  transcript: Array<{ role: "assistant" | "user"; content: string }>
): FounderIntake {
  const location = fields.location || "";
  const locationParts = location.split(",").map((part) => part.trim()).filter(Boolean);

  const hours = fields.hoursPerWeek ? Number.parseInt(fields.hoursPerWeek, 10) : 0;
  const stage = fields.stage as FounderIntake["stage"] | undefined;
  const validStages: FounderIntake["stage"][] = [
    "no idea yet",
    "rough idea",
    "started building",
    "MVP exists",
    "users exist",
    "revenue exists",
  ];

  const openValue = (fields.openToModification || "").toLowerCase();
  const openToModification =
    openValue.includes("yes") ||
    openValue.includes("open") ||
    openValue.includes("willing") ||
    openValue.includes("true");

  return {
    name: fields.name || "Founder",
    locationCountry: locationParts.length > 1 ? locationParts[locationParts.length - 1] : location,
    locationCity: locationParts.length > 1 ? locationParts[0] : undefined,
    status: fields.status || "exploring",
    hoursPerWeek: Number.isFinite(hours) ? Math.min(168, Math.max(0, hours)) : 5,
    budget: fields.budget || "unclear",
    skills: fields.skills ? fields.skills.split(",").map((skill) => skill.trim()).filter(Boolean) : [],
    teamStatus: fields.teamStatus || "solo",
    stage: stage && validStages.includes(stage) ? stage : "rough idea",
    rawIdea: fields.rawIdea || "",
    targetUser: fields.targetUser || "",
    problem: fields.problem || "",
    evidenceLevel: fields.evidenceLevel || "no formal validation",
    alternatives: fields.alternatives || "",
    thirtyDayGoal: fields.thirtyDayGoal || "",
    openToModification,
    transcript: transcript.map((entry) => `${entry.role}: ${entry.content}`),
  };
}

export function buildPostInterviewContext(fields: CollectedFields): string {
  const lines = INTERVIEW_TOPIC_FIELDS.map((key) => {
    const value = fields[key];
    if (typeof value === "string" && value.trim()) {
      return `- ${key}: ${value.trim()}`;
    }
    return null;
  }).filter(Boolean);

  if (lines.length === 0) return "";
  return `\n\nFounder context from intake:\n${lines.join("\n")}`;
}

export async function requestInterviewTurn(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  options?: { postInterview?: boolean; collectedFields?: CollectedFields }
): Promise<InterviewTurn> {
  const response = await fetch("/api/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      postInterview: options?.postInterview ?? false,
      collectedFields: options?.collectedFields ?? {},
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || "Interview request failed");
  }

  return (await response.json()) as InterviewTurn;
}
