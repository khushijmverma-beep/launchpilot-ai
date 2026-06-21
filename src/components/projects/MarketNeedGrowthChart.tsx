"use client";

import {
  buildMarketGrowthSeries,
  formatMarketUsd,
  formatMarketUsdExact,
} from "@/lib/projects/marketGrowth";
import type { ProjectStats } from "@/lib/projects/types";
import {
  CategoryScale,
  Chart as ChartJS,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

type MarketNeedGrowthChartProps = {
  stats: ProjectStats | null;
  projectId: string;
  projectName?: string;
  collectedFields?: Record<string, string | null>;
};

export function MarketNeedGrowthChart({
  stats,
  projectId,
  projectName,
  collectedFields,
}: MarketNeedGrowthChartProps) {
  const series = buildMarketGrowthSeries(stats, `${projectId}-${projectName ?? "project"}`, collectedFields);

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

  const pointByIndex = series.points;

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
            datasets: [
              {
                data: series.points.map((point) => point.valueUsd),
                borderColor: lineColor,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: "#ffffff",
                pointHoverBorderColor: lineColor,
                tension: 0,
                fill: false,
                stepped: false,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false,
            },
            plugins: {
              legend: { display: false },
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
                    return pointByIndex[index]?.label || items[0]?.label || "";
                  },
                  label: (context) => {
                    const index = context.dataIndex;
                    const point = pointByIndex[index];
                    const cumulative = context.parsed.y ?? 0;
                    const lines = [
                      `Cumulative profit: ${formatMarketUsdExact(cumulative)}`,
                    ];
                    if (point) {
                      lines.push(`This month: ${formatMarketUsdExact(point.monthlyNetUsd)}`);
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
