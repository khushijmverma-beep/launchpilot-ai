import { buildProjectCopilotContext, projectCopilotFallback } from "@/lib/projects/copilotContext";
import type { Project } from "@/lib/projects/types";
import { chatCompletion } from "@/lib/llm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are Context Copilot for LaunchPilot AI — a founder execution advisor.

Answer ONLY from the project context provided (interview transcript, collected fields, stats, competitors, agent findings, roadmap). Be direct, practical, and specific to this founder's situation.

Rules:
- 2–4 short sentences unless the question needs a brief list.
- Push back when the plan skips validation or scope is too broad.
- Never invent competitors, metrics, or interview quotes not in the context.
- Do not predict funding, YC acceptance, or recommend dropping out of school.
- If context is thin, say what is missing and give the best next step anyway.`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const project = body.project as Project | undefined;

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  if (!project) {
    return NextResponse.json({ error: "Project context is required" }, { status: 400 });
  }

  const context = buildProjectCopilotContext(project);

  try {
    const answer = await chatCompletion(
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Project context:\n\n${context}\n\nFounder question: ${question}`,
        },
      ],
      { temperature: 0.35 }
    );

    return NextResponse.json({ answer: answer || projectCopilotFallback(question, project) });
  } catch (error) {
    console.warn("Project copilot LLM unavailable, using fallback:", error);
    return NextResponse.json({ answer: projectCopilotFallback(question, project) });
  }
}
