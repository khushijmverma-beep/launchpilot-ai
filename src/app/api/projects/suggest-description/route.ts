import { suggestProjectDescriptions } from "@/lib/projects/suggestDescription";
import type { TranscriptEntry } from "@/lib/projects/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const collectedFields =
      body.collectedFields && typeof body.collectedFields === "object" ? body.collectedFields : {};
    const transcript = Array.isArray(body.transcript) ? (body.transcript as TranscriptEntry[]) : [];
    const name = typeof body.name === "string" ? body.name : null;
    const count = typeof body.count === "number" ? body.count : 4;
    const exclude = Array.isArray(body.exclude)
      ? body.exclude.filter((item: unknown): item is string => typeof item === "string")
      : [];

    const descriptions = await suggestProjectDescriptions({
      fields: collectedFields,
      transcript,
      name,
      count,
      exclude,
    });

    return NextResponse.json({ descriptions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to suggest descriptions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
