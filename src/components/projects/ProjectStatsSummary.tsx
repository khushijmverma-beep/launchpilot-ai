"use client";

import { ChevronDown } from "lucide-react";
import { deriveConfidenceImprovements, parseCompetitorsFromFinding } from "@/lib/projects/improvements";
import type { ProjectAgentOutputs, ProjectStats, StrengthWeaknessCategory } from "@/lib/projects/types";
import { useState } from "react";

type ProjectStatsSummaryProps = {
  stats: ProjectStats | null;
  agentOutputs?: ProjectAgentOutputs;
  strengthsWeaknesses?: StrengthWeaknessCategory[];
};

type StatItem = {
  label: string;
  value: string;
  details?: string[];
  detailsLabel?: string;
};

function ExpandableStatCard({ item }: { item: StatItem }) {
  const [open, setOpen] = useState(false);
  const expandable = Boolean(item.details?.length);

  return (
    <div className="terminal-card overflow-hidden">
      {expandable ? (
        <button
          type="button"
          className="stat-card-toggle"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
        >
          <div className="text-left">
            <p className="font-mono text-2xl font-semibold text-white">{item.value}</p>
            <p className="mono-label mt-2">{item.label}</p>
          </div>
          <ChevronDown className={`stat-card-chevron ${open ? "stat-card-chevron--open" : ""}`} aria-hidden />
        </button>
      ) : (
        <div className="p-4">
          <p className="font-mono text-2xl font-semibold text-white">{item.value}</p>
          <p className="mono-label mt-2">{item.label}</p>
        </div>
      )}

      {expandable && open && (
        <div className="stat-card-details">
          {item.detailsLabel && <p className="stat-card-details-label">{item.detailsLabel}</p>}
          <ul className="space-y-2">
            {item.details?.map((detail) => (
              <li key={detail} className="font-mono text-xs leading-5 text-lp-muted">
                · {detail}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ProjectStatsSummary({ stats, agentOutputs, strengthsWeaknesses }: ProjectStatsSummaryProps) {
  if (!stats) {
    return (
      <div className="terminal-card p-6">
        <p className="font-mono text-sm text-lp-muted">
          Stats will appear after you add more interview context and publish again.
        </p>
      </div>
    );
  }

  const competitors =
    stats.competitors?.length
      ? stats.competitors
      : agentOutputs
        ? parseCompetitorsFromFinding(agentOutputs.competitor.finding)
        : [];

  const confidenceImprovements =
    stats.confidenceImprovements?.length
      ? stats.confidenceImprovements
      : agentOutputs && strengthsWeaknesses?.length
        ? deriveConfidenceImprovements(strengthsWeaknesses, agentOutputs, stats.confidenceScore)
        : [];

  const items: StatItem[] = [
    { label: "Sources analyzed", value: String(stats.sourcesAnalyzed) },
    {
      label: "Confidence score",
      value: `${stats.confidenceScore}/100`,
      detailsLabel: "What to improve",
      details: confidenceImprovements,
    },
    {
      label: "Competitors found",
      value: String(stats.competitorsFound),
      detailsLabel: "Alternatives identified",
      details: competitors,
    },
    { label: "Market size estimate", value: stats.marketSizeEstimate },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <ExpandableStatCard key={item.label} item={item} />
      ))}
    </div>
  );
}
