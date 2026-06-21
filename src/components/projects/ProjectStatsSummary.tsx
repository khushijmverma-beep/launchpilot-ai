"use client";

import { ChevronDown } from "lucide-react";
import { deriveConfidenceImprovements, parseCompetitorsFromFinding } from "@/lib/projects/improvements";
import { buildMarketSizeExplanation, resolveProjectSources } from "@/lib/projects/statsDetails";
import type { ProjectAgentOutputs, ProjectStats, StrengthWeaknessCategory } from "@/lib/projects/types";
import { useState } from "react";

type ProjectStatsSummaryProps = {
  stats: ProjectStats | null;
  agentOutputs?: ProjectAgentOutputs;
  strengthsWeaknesses?: StrengthWeaknessCategory[];
};

type StatDetail =
  | string
  | {
      title: string;
      url?: string;
      meta?: string;
    };

type StatItem = {
  label: string;
  value: string;
  details?: StatDetail[];
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
            {item.details?.map((detail) => {
              if (typeof detail === "string") {
                return (
                  <li key={detail} className="font-mono text-xs leading-5 text-lp-muted">
                    · {detail}
                  </li>
                );
              }

              const key = `${detail.title}-${detail.url ?? ""}`;
              return (
                <li key={key} className="text-xs leading-5 text-lp-muted">
                  {detail.url ? (
                    <a
                      href={detail.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-white/90 underline decoration-white/20 underline-offset-2 hover:text-white"
                    >
                      {detail.title}
                    </a>
                  ) : (
                    <span className="font-mono">{detail.title}</span>
                  )}
                  {detail.meta && <span className="mt-0.5 block font-mono text-[10px] text-lp-subtle">{detail.meta}</span>}
                </li>
              );
            })}
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

  const sourceDetails: StatDetail[] = resolveProjectSources(stats).map((source) => ({
    title: source.title,
    url: source.url,
    meta: `${source.type ?? "Source"} · ${source.label}`,
  }));

  const items: StatItem[] = [
    {
      label: "Sources analyzed",
      value: String(stats.sourcesAnalyzed),
      detailsLabel: "Sources used",
      details: sourceDetails,
    },
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
    {
      label: "Market size estimate",
      value: stats.marketSizeEstimate,
      detailsLabel: "What this means",
      details: [buildMarketSizeExplanation(stats.confidenceScore, stats.marketSizeEstimate)],
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <ExpandableStatCard key={item.label} item={item} />
      ))}
    </div>
  );
}
