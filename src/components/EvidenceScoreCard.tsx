"use client";

import { Badge } from "./Badge";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import type { EvidenceScore } from "@/lib/intake/schema";

type EvidenceScoreCardProps = {
  evidenceScore: EvidenceScore;
};

export function EvidenceScoreCard({ evidenceScore }: EvidenceScoreCardProps) {
  const getVerdictColor = () => {
    if (evidenceScore.verdict === "strong") return "text-emerald-600";
    if (evidenceScore.verdict === "promising_needs_modification") return "text-amber-600";
    if (evidenceScore.verdict === "weak") return "text-orange-600";
    return "text-red-600";
  };

  const getVerdictIcon = () => {
    if (evidenceScore.verdict === "strong") return <CheckCircle2 className="h-6 w-6" />;
    if (evidenceScore.verdict === "promising_needs_modification") return <TrendingUp className="h-6 w-6" />;
    if (evidenceScore.verdict === "weak") return <AlertTriangle className="h-6 w-6" />;
    return <XCircle className="h-6 w-6" />;
  };

  const getVerdictLabel = () => {
    if (evidenceScore.verdict === "strong") return "Strong enough to proceed";
    if (evidenceScore.verdict === "promising_needs_modification") return "Promising but needs modification";
    if (evidenceScore.verdict === "weak") return "Weak in current form";
    return "Do not build this version yet";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="premium-card rounded-[32px] p-8"
    >
      {/* Score display */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className={getVerdictColor()}>{getVerdictIcon()}</div>
            <div>
              <h2 className="text-2xl font-semibold text-stone-950">Evidence Score</h2>
              <p className="mt-1 text-sm text-stone-600">Based on problem clarity, demand signals, and feasibility</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-3xl font-bold text-white shadow-lg">
            {evidenceScore.score}
          </div>
          <p className="text-xs font-medium text-stone-600">out of 100</p>
        </div>
      </div>

      {/* Verdict */}
      <div className={`mt-6 rounded-2xl border-2 p-4 ${getVerdictColor().replace("text-", "border-").replace("600", "200")} bg-white`}>
        <div className="flex items-center gap-2">
          <Badge label={getVerdictLabel()} />
        </div>
        <p className="mt-3 text-sm leading-6 text-stone-700">{evidenceScore.reasoning}</p>
      </div>

      {/* Signals */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <h3 className="text-sm font-semibold text-emerald-900">Strongest Signal</h3>
          <p className="mt-2 text-sm leading-6 text-emerald-700">{evidenceScore.strongestSignal}</p>
        </div>

        <div className="rounded-2xl bg-orange-50 p-4">
          <h3 className="text-sm font-semibold text-orange-900">Weakest Signal</h3>
          <p className="mt-2 text-sm leading-6 text-orange-700">{evidenceScore.weakestSignal}</p>
        </div>
      </div>

      {/* What could be wrong */}
      <div className="mt-6 rounded-2xl bg-amber-50 p-4">
        <h3 className="text-sm font-semibold text-amber-900">What Could Be Wrong</h3>
        <p className="mt-2 text-sm leading-6 text-amber-700">{evidenceScore.whatCouldBeWrong}</p>
      </div>

      {/* Next step */}
      <div className="mt-6 rounded-2xl bg-violet-50 p-4">
        <h3 className="text-sm font-semibold text-violet-900">Next Validation Step</h3>
        <p className="mt-2 text-sm leading-6 text-violet-700">{evidenceScore.nextValidationStep}</p>
      </div>

      {/* Sources */}
      {evidenceScore.sources.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-stone-900">Sources</h3>
          <div className="mt-3 space-y-2">
            {evidenceScore.sources.map((source, index) => (
              <div key={index} className="rounded-xl bg-stone-50 p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-stone-900">{source.title}</p>
                  <Badge label={source.sourceType} />
                </div>
                <p className="mt-2 leading-5 text-stone-600">{source.snippet}</p>
                {source.limitation && (
                  <p className="mt-2 text-stone-500">
                    <span className="font-semibold">Limitation:</span> {source.limitation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 rounded-xl bg-stone-100 p-4 text-xs leading-5 text-stone-600">
        <strong>Important:</strong> This is not a prediction of startup success. It is an evidence-based readiness signal
        for your first validation step. Market conditions, execution, and user behavior can differ from research findings.
      </div>
    </motion.div>
  );
}
