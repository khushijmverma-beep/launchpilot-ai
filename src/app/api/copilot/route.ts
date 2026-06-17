import { copilotReply, generateLaunchBrief } from "@/lib/agents";
import { demoProfile } from "@/lib/seed";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const brief = body.brief || generateLaunchBrief(demoProfile);
  return NextResponse.json({ answer: copilotReply(body.question || "", brief) });
}
