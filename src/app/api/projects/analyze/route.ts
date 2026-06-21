import { buildIntakeFromFields, type CollectedFields } from "@/lib/interview/aiInterview";
import { intakeToProfile } from "@/lib/projects/intakeToProfile";
import { generateResearchedBrief } from "@/lib/research";
import type { TranscriptEntry } from "@/lib/projects/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const collectedFields = (body.collectedFields ?? {}) as CollectedFields;
    const transcript = (body.transcript ?? []) as TranscriptEntry[];

    const intake = buildIntakeFromFields(collectedFields, transcript);
    const profile = intakeToProfile(intake);
    const brief = await generateResearchedBrief(profile, intake);

    return NextResponse.json({ brief, evidenceScore: brief.evidenceScore });
  } catch (error) {
    console.error("Project analyze failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
