import { keyPoolStatus } from "@/lib/keyPool";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    geminiLive: keyPoolStatus(),
    webSpeechFallback: true,
    textFallback: true,
    rawAudioStored: false,
  });
}
