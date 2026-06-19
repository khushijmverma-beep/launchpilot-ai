"use client";

import { CountUp } from "@/components/animations/CountUp";

type StatItem = {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
};

type StatsRowProps = {
  stats: StatItem[];
  className?: string;
};

export function StatsRow({ stats, className = "" }: StatsRowProps) {
  return (
    <div className={`grid gap-6 sm:grid-cols-3 ${className}`}>
      {stats.map((stat) => (
        <div key={stat.label} className="terminal-card rounded-sm p-5">
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-white">
            <CountUp
              end={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
              decimals={stat.decimals}
            />
          </p>
          <p className="mono-label mt-2">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
