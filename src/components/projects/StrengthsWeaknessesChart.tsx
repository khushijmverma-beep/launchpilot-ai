"use client";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { StrengthWeaknessCategory } from "@/lib/projects/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type StrengthsWeaknessesChartProps = {
  categories: StrengthWeaknessCategory[];
};

export function StrengthsWeaknessesChart({ categories }: StrengthsWeaknessesChartProps) {
  const labels = categories.map((item) => item.category);
  const values = categories.map((item) => item.score);
  const strengthFill =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue("--chart-strength").trim() || "#e8e8e6"
      : "#e8e8e6";
  const weaknessFill =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue("--chart-weakness").trim() || "#5f5e5a"
      : "#5f5e5a";

  if (categories.length === 0) {
    return (
      <div className="terminal-card p-6">
        <p className="mono-label mb-2">Strengths vs. weaknesses</p>
        <p className="font-mono text-sm text-lp-muted">
          Category scores will appear after a fuller interview and publish.
        </p>
      </div>
    );
  }

  return (
    <div className="terminal-card p-6">
      <p className="mono-label mb-6">Strengths vs. weaknesses</p>
      <div className="h-[320px] w-full">
        <Bar
          data={{
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: values.map((value) => (value >= 0 ? strengthFill : weaknessFill)),
                borderColor: values.map((value) => (value >= 0 ? "#ffffff" : "#737373")),
                borderWidth: 1,
                borderSkipped: false,
              },
            ],
          }}
          options={{
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.parsed.x ?? 0;
                    return value >= 0 ? `Strength +${value}` : `Weakness ${value}`;
                  },
                },
              },
            },
            scales: {
              x: {
                min: -10,
                max: 10,
                grid: { color: "rgba(255,255,255,0.08)" },
                ticks: { color: "#a3a3a3", stepSize: 2 },
              },
              y: {
                grid: { display: false },
                ticks: { color: "#e5e5e5", font: { size: 11 } },
              },
            },
          }}
        />
      </div>
      <div className="mt-4 flex items-center gap-6 font-mono text-xs text-lp-muted">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 border border-white/20 bg-[var(--chart-strength)]" />
          Strength
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 border border-white/20 bg-[var(--chart-weakness)]" />
          Weakness
        </span>
      </div>
    </div>
  );
}
