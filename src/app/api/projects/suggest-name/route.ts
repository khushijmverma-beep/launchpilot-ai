import { resolveProjectName } from "@/lib/projects/suggestName";
import type { TranscriptEntry } from "@/lib/projects/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const collectedFields =
      body.collectedFields && typeof body.collectedFields === "object" ? body.collectedFields : {};
    const transcript = Array.isArray(body.transcript) ? (body.transcript as TranscriptEntry[]) : [];
    const existingName = typeof body.existingName === "string" ? body.existingName : null;

    const name = await resolveProjectName({
      fields: collectedFields,
      transcript,
      existingName,
    });

    return NextResponse.json({ name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to suggest project name";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
