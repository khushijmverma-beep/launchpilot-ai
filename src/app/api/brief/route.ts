import { generateLaunchBrief } from "@/lib/agents";
import { demoProfile } from "@/lib/seed";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(generateLaunchBrief(demoProfile));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => demoProfile);
  return NextResponse.json(generateLaunchBrief({ ...demoProfile, ...body }));
}
