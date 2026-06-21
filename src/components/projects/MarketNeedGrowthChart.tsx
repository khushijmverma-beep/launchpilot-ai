"use client";

import {
  buildMarketGrowthSeries,
  formatMarketUsd,
  formatMarketUsdExact,
  getCompetitorLineColors,
} from "@/lib/projects/marketGrowth";
import type { ProjectAgentOutputs, ProjectStats } from "@/lib/projects/types";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type MarketNeedGrowthChartProps = {
  stats: ProjectStats | null;
  projectId: string;
  projectName?: string;
  collectedFields?: Record<string, string | null>;
  agentOutputs?: ProjectAgentOutputs;
};

export function MarketNeedGrowthChart({
  stats,
  projectId,
  projectName,
  collectedFields,
  agentOutputs,
}: MarketNeedGrowthChartProps) {
  const series = buildMarketGrowthSeries(
    stats,
    `${projectId}-${projectName ?? "project"}`,
    collectedFields,
    agentOutputs?.competitor?.finding
  );

  if (!series) {
    return (
      <div className="terminal-card p-6">
        <p className="mono-label mb-2">Profit forecast</p>
        <p className="font-mono text-sm text-lp-muted">
          Publish with live research to see a 24-month profit projection for your project.
        </p>
      </div>
    );
  }

  const lineColor =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue("--chart-strength").trim() || "#e8e8e6"
      : "#e8e8e6";

  const competitorColors = getCompetitorLineColors();
  const projectLabel = projectName ?? "Your project";

  const datasets = [
    {
      label: projectLabel,
      data: series.points.map((point) => point.valueUsd),
      borderColor: lineColor,
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: "#ffffff",
      pointHoverBorderColor: lineColor,
      tension: 0,
      fill: false,
    },
    ...series.competitors.map((competitor, index) => ({
      label: competitor.name,
      data: competitor.points.map((point) => point.valueUsd),
      borderColor: competitorColors[index % competitorColors.length],
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: competitorColors[index % competitorColors.length],
      pointHoverBorderColor: "#ffffff",
      tension: 0,
      fill: false,
    })),
  ];

  const monthlyByDataset: Array<Array<{ monthlyNetUsd: number } | undefined>> = [
    series.points,
    ...series.competitors.map((competitor) => competitor.points),
  ];

  return (
    <div className="terminal-card p-6">
      <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono-label mb-2">Profit forecast</p>
          <h3 className="text-lg font-semibold text-white">{projectName ?? "Your project"}</h3>
        </div>
        <p className="font-mono text-xs text-lp-subtle">
          24-mo cumulative net profit · target {formatMarketUsd(series.targetMonthlyProfitUsd)}/mo
        </p>
      </div>

      <div className="mt-4 h-[360px] w-full">
        <Line
          data={{
            labels: series.points.map((point) => point.label),
            datasets,
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false,
            },
            plugins: {
              legend: {
                display: series.competitors.length > 0,
                position: "bottom",
                labels: {
                  color: "#d4d4d4",
                  font: { size: 10, family: "monospace" },
                  boxWidth: 14,
                  boxHeight: 2,
                  padding: 12,
                },
              },
              tooltip: {
                backgroundColor: "rgba(0,0,0,0.92)",
                borderColor: "rgba(255,255,255,0.15)",
                borderWidth: 1,
                titleColor: "#ffffff",
                bodyColor: "#d4d4d4",
                padding: 10,
                callbacks: {
                  title: (items) => {
                    const index = items[0]?.dataIndex ?? 0;
                    return series.points[index]?.label || items[0]?.label || "";
                  },
                  label: (context) => {
                    const datasetIndex = context.datasetIndex;
                    const pointIndex = context.dataIndex;
                    const cumulative = context.parsed.y ?? 0;
                    const monthly = monthlyByDataset[datasetIndex]?.[pointIndex]?.monthlyNetUsd;
                    const lines = [`${context.dataset.label}: ${formatMarketUsdExact(cumulative)}`];
                    if (monthly !== undefined) {
                      lines.push(`This month: ${formatMarketUsdExact(monthly)}`);
                    }
                    return lines;
                  },
                },
              },
            },
            scales: {
              x: {
                grid: {
                  color: "rgba(255,255,255,0.08)",
                  tickColor: "rgba(255,255,255,0.08)",
                },
                ticks: {
                  color: "#a3a3a3",
                  font: { size: 10 },
                  maxRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: 12,
                },
                border: { display: false },
              },
              y: {
                grid: { display: false },
                ticks: {
                  color: "#e5e5e5",
                  font: { size: 11 },
                  callback: (value) => formatMarketUsd(Number(value)),
                },
                border: { display: false },
              },
            },
          }}
        />
      </div>

      <p className="mt-3 font-mono text-[10px] leading-5 text-lp-subtle">{series.footnote}</p>

      {series.citations.length > 0 && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-lp-subtle">Sources</p>
          <ul className="mt-2 space-y-1">
            {series.citations.map((citation) => (
              <li key={`${citation.url}-${citation.title}`} className="text-[10px] leading-5 text-lp-muted">
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/85 underline decoration-white/20 underline-offset-2 hover:text-white"
                >
                  {citation.title}
                </a>
                {citation.host && <span className="text-lp-subtle"> · {citation.host}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
