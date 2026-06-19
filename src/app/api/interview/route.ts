import { chatCompletion } from "@/lib/llm";
import {
  INTERVIEW_SYSTEM_PROMPT,
  POST_INTERVIEW_SYSTEM_PROMPT,
  buildPostInterviewContext,
  parseInterviewResponse,
  type CollectedFields,
} from "@/lib/interview/aiInterview";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const postInterview = Boolean(body.postInterview);
    const collectedFields = (body.collectedFields ?? {}) as CollectedFields;

    const chatMessages = messages
      .filter(
        (message: { role?: string; content?: string }) =>
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.trim()
      )
      .map((message: { role: "user" | "assistant"; content: string }) => ({
        role: message.role,
        content: message.content.trim(),
      }));

    const userMessages =
      chatMessages.length > 0
        ? chatMessages
        : [{ role: "user" as const, content: "I'm ready to start the founder interview." }];

    const systemPrompt = postInterview
      ? POST_INTERVIEW_SYSTEM_PROMPT + buildPostInterviewContext(collectedFields)
      : INTERVIEW_SYSTEM_PROMPT;

    const raw = await chatCompletion(
      [{ role: "system", content: systemPrompt }, ...userMessages],
      { temperature: postInterview ? 0.6 : 0.5 }
    );

    const turn = parseInterviewResponse(raw);
    if (postInterview) {
      turn.interviewComplete = true;
    }

    return NextResponse.json(turn);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Interview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
