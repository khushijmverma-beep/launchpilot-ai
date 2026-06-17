import type { EvidenceLabel } from "@/lib/types";

const styles: Record<string, string> = {
  Verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Inferred: "border-sky-200 bg-sky-50 text-sky-700",
  Approximate: "border-amber-200 bg-amber-50 text-amber-700",
  "Needs validation": "border-orange-200 bg-orange-50 text-orange-700",
  "AI may be wrong": "border-rose-200 bg-rose-50 text-rose-700",
  "Fallback analysis": "border-slate-200 bg-slate-50 text-slate-600",
  "Official source": "border-blue-200 bg-blue-50 text-blue-700",
  "Community signal": "border-violet-200 bg-violet-50 text-violet-700",
  "Framework-based": "border-indigo-200 bg-indigo-50 text-indigo-700",
};

export function Badge({ label }: { label: EvidenceLabel | string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles[label] || styles.Inferred}`}>
      {label}
    </span>
  );
}
