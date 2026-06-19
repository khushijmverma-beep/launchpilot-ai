"use client";

import { Nav } from "@/components/Nav";
import { EvidenceScoreCard } from "@/components/EvidenceScoreCard";
import type { EvidenceScore } from "@/lib/intake/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";

const demoScore: EvidenceScore = {
  score: 72,
  verdict: "promising_needs_modification",
  reasoning:
    "The problem is real for student founders, but differentiation against existing planning tools is not yet proven. Narrow the wedge before building features.",
  strongestSignal: "Clear target user with recurring weekly pain",
  weakestSignal: "No direct customer conversations logged yet",
  whatCouldBeWrong: "Students may prefer free generic AI over a specialized workflow",
  nextValidationStep: "Run 10 interviews with first-year engineering students this week",
  sources: [
    {
      title: "HN Algolia — student productivity threads",
      url: "https://hn.algolia.com",
      snippet: "Repeated complaints about fragmented study planning tools",
      sourceType: "Community signal",
      supports: "Problem frequency among student founders",
      limitation: "Self-reported, not a demand survey",
      confidence: "medium",
    },
  ],
};

export default function ScoringPage() {
  const router = useRouter();
  const [decision, setDecision] = useState<"pending" | "approved" | "iterate">("pending");

  return (
    <main className="shell-bg min-h-screen">
      <Nav />
      <section className="mx-auto flex min-h-[calc(100vh-88px)] max-w-lg flex-col items-center justify-center px-5 pb-10">
        {/* No animation — decision moment */}
        <div className="w-full">
          <p className="mono-label text-center">Idea scoring</p>
          <h1 className="mt-2 text-center text-2xl font-semibold text-white">Review evidence before you build</h1>

          <div className="mt-8">
            <EvidenceScoreCard evidenceScore={demoScore} />
          </div>

          {decision === "pending" && (
            <div className="mt-6 flex gap-3">
              <button className="btn-primary flex-1" onClick={() => setDecision("approved")}>
                Approve &amp; continue
              </button>
              <button className="btn-secondary flex-1" onClick={() => setDecision("iterate")}>
                Iterate idea
              </button>
            </div>
          )}

          {decision === "approved" && (
            <div className="mt-6 text-center">
              <p className="font-mono text-sm text-lp-muted">Approved. Opening workspace...</p>
              <button className="btn-primary mt-4" onClick={() => router.push("/dashboard")}>
                Open workspace
              </button>
            </div>
          )}

          {decision === "iterate" && (
            <div className="mt-6 text-center">
              <p className="font-mono text-sm text-lp-muted">Return to intake with a refined angle.</p>
              <button className="btn-secondary mt-4" onClick={() => router.push("/start")}>
                Back to intake
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
