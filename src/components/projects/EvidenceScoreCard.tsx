"use client";

import { Badge } from "@/components/Badge";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import type { EvidenceScore } from "@/lib/intake/schema";

type EvidenceScoreCardProps = {
  evidenceScore: EvidenceScore;
};

export function EvidenceScoreCard({ evidenceScore }: EvidenceScoreCardProps) {
  const getVerdictIcon = () => {
    if (evidenceScore.verdict === "strong") return <CheckCircle2 className="h-5 w-5" />;
    if (evidenceScore.verdict === "promising_needs_modification") return <TrendingUp className="h-5 w-5" />;
    if (evidenceScore.verdict === "weak") return <AlertTriangle className="h-5 w-5" />;
    return <XCircle className="h-5 w-5" />;
  };

  const getVerdictLabel = () => {
    if (evidenceScore.verdict === "strong") return "Strong enough to proceed";
    if (evidenceScore.verdict === "promising_needs_modification") return "Promising but needs modification";
    if (evidenceScore.verdict === "weak") return "Weak in current form";
    return "Do not build this version yet";
  };

  return (
    <div className="terminal-card p-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 text-white">
            {getVerdictIcon()}
            <div>
              <h2 className="text-xl font-semibold">Evidence Score</h2>
              <p className="mt-1 font-mono text-xs text-lp-subtle">Problem clarity · demand signals · feasibility</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex h-20 w-20 items-center justify-center border border-white font-mono text-3xl font-bold text-white">
            {evidenceScore.score}
          </div>
          <p className="font-mono text-[10px] text-lp-subtle">/ 100</p>
        </div>
      </div>

      <div className="mt-6 border border-white/15 p-4">
        <Badge label={getVerdictLabel()} />
        <p className="mt-3 text-sm leading-6 text-lp-muted">{evidenceScore.reasoning}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="border border-white/10 p-4">
          <h3 className="mono-label">Strongest signal</h3>
          <p className="mt-2 text-sm leading-6 text-lp-muted">{evidenceScore.strongestSignal}</p>
        </div>
        <div className="border border-white/10 p-4">
          <h3 className="mono-label">Weakest signal</h3>
          <p className="mt-2 text-sm leading-6 text-lp-muted">{evidenceScore.weakestSignal}</p>
        </div>
      </div>

      <div className="mt-4 border border-white/10 p-4">
        <h3 className="mono-label">What could be wrong</h3>
        <p className="mt-2 text-sm leading-6 text-lp-muted">{evidenceScore.whatCouldBeWrong}</p>
      </div>

      <div className="mt-4 border border-white/15 p-4">
        <h3 className="mono-label">Next validation step</h3>
        <p className="mt-2 text-sm leading-6 text-white">{evidenceScore.nextValidationStep}</p>
      </div>

      {evidenceScore.sources.length > 0 && (
        <div className="mt-6">
          <h3 className="mono-label">Sources</h3>
          <div className="mt-3 space-y-2">
            {evidenceScore.sources.map((source, index) => (
              <div key={index} className="border border-white/10 p-3 font-mono text-xs">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-white">{source.title}</p>
                  <Badge label={source.sourceType} />
                </div>
                <p className="mt-2 leading-5 text-lp-muted">{source.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 font-mono text-[10px] leading-5 text-lp-subtle">
        Not a prediction of startup success. Evidence-based readiness signal for your first validation step.
      </p>
    </div>
  );
}
