import type { EvidenceLabel } from "@/lib/types";

const styles: Record<string, string> = {
  Verified: "border-white/30 bg-white/10 text-white",
  Inferred: "border-white/20 bg-white/5 text-lp-muted",
  Approximate: "border-white/20 bg-white/5 text-lp-muted",
  "Needs validation": "border-white/25 bg-white/8 text-lp-muted",
  "AI may be wrong": "border-white/20 bg-white/5 text-lp-subtle",
  "Fallback analysis": "border-white/15 bg-white/5 text-lp-subtle",
  "Official source": "border-white/25 bg-white/8 text-white",
  "Community signal": "border-white/20 bg-white/5 text-lp-muted",
  "Framework-based": "border-white/20 bg-white/5 text-lp-muted",
  Running: "border-white bg-white text-black",
  Complete: "border-white/30 bg-white/10 text-white",
};

export function Badge({ label }: { label: EvidenceLabel | string }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${styles[label] || styles.Inferred}`}
    >
      {label}
    </span>
  );
}
