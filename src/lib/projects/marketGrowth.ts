import { resolveProjectSources } from "./statsDetails";
import type { ProjectSourceSummary, ProjectStats } from "./types";

export type MarketGrowthPoint = {
  label: string;
  valueUsd: number;
  monthlyNetUsd: number;
};

export type MarketGrowthCitation = {
  title: string;
  url: string;
  host: string;
};

export type CompetitorProfitSeries = {
  name: string;
  points: MarketGrowthPoint[];
  targetMonthlyProfitUsd: number;
};

export type MarketGrowthSeries = {
  points: MarketGrowthPoint[];
  competitors: CompetitorProfitSeries[];
  targetMonthlyProfitUsd: number;
  annualGrowthRate: number;
  citations: MarketGrowthCitation[];
  footnote: string;
};

const COMPETITOR_RED = ["#ef4444", "#f87171", "#dc2626", "#fb7185", "#b91c1c"];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FORECAST_MONTHS = 24;

function parseTamUsd(estimate: string): number {
  const million = estimate.match(/\$(\d+(?:\.\d+)?)\s*M/i);
  if (million) return parseFloat(million[1]) * 1_000_000;

  const billion = estimate.match(/\$(\d+(?:\.\d+)?)\s*B/i);
  if (billion) return parseFloat(billion[1]) * 1_000_000_000;

  const thousand = estimate.match(/\$(\d+(?:\.\d+)?)\s*K/i);
  if (thousand) return parseFloat(thousand[1]) * 1_000;

  return 5_000_000;
}

function parseBudgetUsd(budget: string | null | undefined): number {
  if (!budget?.trim()) return 2_500;
  const text = budget.toLowerCase();
  if (/zero|none|₹?\s*0|\$\s*0|no budget/.test(text)) return 500;

  const match = text.match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!match) return 2_500;

  let value = parseFloat(match[1].replace(/,/g, ""));
  if (/k\b/i.test(text)) value *= 1_000;
  if (/m\b/i.test(text)) value *= 1_000_000;
  if (/₹|inr|rupee/.test(text) && !/usd|\$/.test(text)) value /= 84;

  return Math.max(250, Math.min(value, 100_000));
}

function extractCagrFromText(text: string): number | null {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*%\s*(?:CAGR|cagr)/i,
    /(?:CAGR|cagr)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*%/i,
    /(\d+(?:\.\d+)?)\s*%\s*(?:annual|year-over-year|y\/y|YoY)\s*growth/i,
    /grow(?:th|ing)?\s*(?:at|of|by)\s*(\d+(?:\.\d+)?)\s*%/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const rate = parseFloat(match[1]) / 100;
      if (rate >= 0.02 && rate <= 0.45) return rate;
    }
  }

  return null;
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function deriveAnnualGrowthRate(stats: ProjectStats, sources: ProjectSourceSummary[]): number {
  const evidenceSnippets =
    stats.evidenceScore?.sources?.map((source) => `${source.title} ${source.snippet ?? ""}`).join(" ") ?? "";
  const snippetText = [
    evidenceSnippets,
    sources.map((source) => `${source.title} ${source.type ?? ""}`).join(" "),
  ].join(" ");

  const fromSnippet = extractCagrFromText(snippetText);
  if (fromSnippet) return fromSnippet;

  const demandScore = stats.evidenceScore?.breakdown?.demandEvidence ?? 0;
  const confidence = stats.confidenceScore ?? 50;
  const hasMarketReport = sources.some(
    (source) => source.type === "market_report" || /market|research|report|data/i.test(source.title)
  );

  const base = 0.06 + (demandScore / 20) * 0.08 + (confidence / 100) * 0.06;
  return Math.min(0.22, base + (hasMarketReport ? 0.02 : 0));
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed: string, index: number): number {
  const mixed = hashSeed(`${seed}:${index}`);
  return (mixed % 10_000) / 10_000;
}

function monthLabel(date: Date, index: number, total: number): string {
  if (index === 0 || index === total - 1) {
    return `${MONTH_LABELS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
  }
  if (index % 3 === 0) {
    return MONTH_LABELS[date.getMonth()];
  }
  return "";
}

function buildShockMultipliers(seed: string, months: number, volatility: number): number[] {
  const shocks = Array.from({ length: months }, () => 1);
  const peakEvery = Math.max(3, Math.round(4 - volatility * 1.5));
  const dipEvery = Math.max(4, Math.round(5 - volatility));

  for (let index = 0; index < months; index += 1) {
    let multiplier = 1;

    if (index % peakEvery === peakEvery - 1) {
      multiplier = 1.35 + seededUnit(seed, index) * 0.95;
    } else if (index % dipEvery === dipEvery - 1) {
      multiplier = 0.45 + seededUnit(seed, index + 500) * 0.35;
    } else {
      const swing = (seededUnit(seed, index + 1000) - 0.5) * 0.7;
      multiplier = 1 + swing * volatility;
    }

    if (index > 0 && index < months - 1) {
      const prev = shocks[index - 1];
      if (multiplier > 1.2 && prev > 1.1) multiplier = 0.75 + seededUnit(seed, index + 2000) * 0.2;
      if (multiplier < 0.7 && prev < 0.8) multiplier = 1.15 + seededUnit(seed, index + 3000) * 0.45;
    }

    shocks[index] = multiplier;
  }

  return shocks;
}

function deriveMatureMonthlyProfit(
  tamUsd: number,
  confidence: number,
  demandScore: number,
  budgetUsd: number,
  annualGrowthRate: number
): number {
  const captureRate = 0.000045 + (confidence / 100) * 0.00014 + (demandScore / 20) * 0.00006;
  const marketPull = tamUsd * captureRate;
  const budgetBoost = Math.min(budgetUsd * 0.08, marketPull * 0.35);
  const growthBoost = 1 + annualGrowthRate * 0.6;

  return Math.max(900, (marketPull + budgetBoost) * growthBoost);
}

function buildProfitForecastPoints(
  stats: ProjectStats,
  seed: string,
  budgetUsd: number
): { points: MarketGrowthPoint[]; targetMonthlyProfitUsd: number; monthDates: Date[] } {
  const tamUsd = parseTamUsd(stats.marketSizeEstimate);
  const confidence = stats.confidenceScore ?? 50;
  const demandScore = stats.evidenceScore?.breakdown?.demandEvidence ?? 8;
  const sources = resolveProjectSources(stats);
  const annualGrowthRate = deriveAnnualGrowthRate(stats, sources);
  const targetMonthlyProfitUsd = deriveMatureMonthlyProfit(
    tamUsd,
    confidence,
    demandScore,
    budgetUsd,
    annualGrowthRate
  );

  const volatility = 0.55 + (1 - confidence / 100) * 0.35 + (demandScore / 20) * 0.15;
  const shocks = buildShockMultipliers(seed, FORECAST_MONTHS, volatility);
  const now = new Date();
  const points: MarketGrowthPoint[] = [];

  let cumulative = 0;
  const baseBurn = Math.max(450, budgetUsd * 0.12 + 350);
  const monthDates: Date[] = [];

  for (let index = 0; index < FORECAST_MONTHS; index += 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + index, 1);
    monthDates.push(monthDate);
    const progress = index / (FORECAST_MONTHS - 1);
    const ramp = Math.pow(progress, 1.65);
    const baseRevenue = targetMonthlyProfitUsd * ramp * (0.08 + progress * 0.92);
    const operatingCost = baseBurn * (1.15 - progress * 0.62);
    const microNoise = (seededUnit(seed, index + 4000) - 0.5) * baseRevenue * 0.55;
    const revenue = Math.max(0, (baseRevenue + microNoise) * shocks[index]);
    const monthlyNetUsd = revenue - operatingCost;

    cumulative += monthlyNetUsd;

    points.push({
      label: monthLabel(monthDate, index, FORECAST_MONTHS),
      valueUsd: Math.round(cumulative),
      monthlyNetUsd: Math.round(monthlyNetUsd),
    });
  }

  return { points, targetMonthlyProfitUsd: Math.round(targetMonthlyProfitUsd), monthDates };
}

export function sanitizeCompetitorName(raw: string): string {
  let name = raw.trim();
  if (!name) return "Competitor";

  if (/^https?:\/\//i.test(name)) {
    try {
      name = new URL(name).hostname.replace(/^www\./, "");
    } catch {
      /* keep raw */
    }
  }

  name = name.split(" | ")[0]?.split(" - ")[0]?.split(" – ")[0]?.split(":")[0]?.trim() ?? name;
  if (name.length > 30) {
    name = `${name.slice(0, 28).trim()}…`;
  }

  return name || "Competitor";
}

export function resolveCompetitorNames(
  stats: ProjectStats,
  competitorFinding?: string
): string[] {
  const fromStats = stats.competitors ?? [];
  const fromFinding = competitorFinding ? parseCompetitorsFromFinding(competitorFinding) : [];
  const merged = [...fromStats, ...fromFinding];
  const seen = new Set<string>();

  return merged
    .map(sanitizeCompetitorName)
    .filter((name) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
}

function parseCompetitorsFromFinding(finding: string): string[] {
  const marketMatch = finding.match(/alternatives (?:include|found|retained were):\s*(.+?)(?:\.|$)/i);
  if (marketMatch?.[1]) {
    return marketMatch[1]
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const legacyMatch = finding.match(/alternatives found:\s*(.+?)\.?$/i);
  if (legacyMatch?.[1]) {
    return legacyMatch[1]
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function buildCompetitorProfitForecastPoints(
  name: string,
  seed: string,
  founderTargetMonthly: number,
  index: number,
  annualGrowthRate: number,
  monthDates: Date[]
): CompetitorProfitSeries {
  const competitorSeed = `${seed}:competitor:${name}:${index}`;
  const scale = 1.75 + index * 0.72 + seededUnit(competitorSeed, 12) * 0.95;
  const targetMonthlyProfitUsd = Math.round(founderTargetMonthly * scale);
  const volatility = 0.42 + seededUnit(competitorSeed, 34) * 0.28;
  const shocks = buildShockMultipliers(competitorSeed, FORECAST_MONTHS, volatility);
  const startingCumulative = Math.round(
    targetMonthlyProfitUsd * (10 + index * 3 + seededUnit(competitorSeed, 88) * 8)
  );
  const operatingCost = targetMonthlyProfitUsd * (0.28 + index * 0.04);

  let cumulative = startingCumulative;
  const points: MarketGrowthPoint[] = [];

  for (let monthIndex = 0; monthIndex < FORECAST_MONTHS; monthIndex += 1) {
    const progress = monthIndex / (FORECAST_MONTHS - 1);
    const baseRevenue = targetMonthlyProfitUsd * (0.82 + progress * 0.28);
    const microNoise = (seededUnit(competitorSeed, monthIndex + 5000) - 0.5) * baseRevenue * 0.42;
    const revenue = Math.max(targetMonthlyProfitUsd * 0.55, (baseRevenue + microNoise) * shocks[monthIndex]);
    const monthlyNetUsd = revenue - operatingCost;

    cumulative += monthlyNetUsd;

    points.push({
      label: monthLabel(monthDates[monthIndex], monthIndex, FORECAST_MONTHS),
      valueUsd: Math.round(cumulative),
      monthlyNetUsd: Math.round(monthlyNetUsd),
    });
  }

  return {
    name,
    points,
    targetMonthlyProfitUsd,
  };
}

function buildCompetitorSeries(
  stats: ProjectStats,
  seed: string,
  founderTargetMonthly: number,
  annualGrowthRate: number,
  monthDates: Date[],
  competitorFinding?: string
): CompetitorProfitSeries[] {
  const names = resolveCompetitorNames(stats, competitorFinding);
  if (!names.length) return [];

  return names.map((name, index) =>
    buildCompetitorProfitForecastPoints(
      name,
      seed,
      founderTargetMonthly,
      index,
      annualGrowthRate,
      monthDates
    )
  );
}

export function getCompetitorLineColors(): string[] {
  return COMPETITOR_RED;
}

function pickCitations(sources: ProjectSourceSummary[], stats?: ProjectStats | null): MarketGrowthCitation[] {
  const evidenceSources =
    stats?.evidenceScore?.sources?.map((source) => ({
      title: source.title,
      url: source.url,
      label: source.verified ? "Verified" : "Needs validation",
      type: source.sourceType,
    })) ?? [];

  const merged = [...evidenceSources, ...sources];
  const seen = new Set<string>();

  const prioritized = merged.filter((source) => {
    const key = source.url || source.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return Boolean(source.url);
  });

  prioritized.sort((a, b) => {
    const score = (source: ProjectSourceSummary) => {
      let value = 0;
      if (source.type === "market_report") value += 4;
      if (source.type === "dataset") value += 3;
      if (source.type === "official") value += 2;
      if (/demand|market|growth|report|data/i.test(`${source.title} ${source.label}`)) value += 1;
      return value;
    };
    return score(b) - score(a);
  });

  return prioritized.slice(0, 4).map((source) => ({
    title: source.title,
    url: source.url,
    host: hostFromUrl(source.url),
  }));
}

export function buildMarketGrowthSeries(
  stats: ProjectStats | null,
  seed = "project",
  collectedFields?: Record<string, string | null>,
  competitorFinding?: string
): MarketGrowthSeries | null {
  if (!stats?.marketSizeEstimate) return null;

  const sources = resolveProjectSources(stats);
  const annualGrowthRate = deriveAnnualGrowthRate(stats, sources);
  const budgetUsd = parseBudgetUsd(collectedFields?.budget);
  const { points, targetMonthlyProfitUsd, monthDates } = buildProfitForecastPoints(stats, seed, budgetUsd);
  const competitors = buildCompetitorSeries(
    stats,
    seed,
    targetMonthlyProfitUsd,
    annualGrowthRate,
    monthDates,
    competitorFinding
  );
  const citations = pickCitations(sources, stats);

  const rateLabel = `${(annualGrowthRate * 100).toFixed(1)}%`;
  const competitorNote = competitors.length
    ? ` Red lines are modeled cumulative profit for ${competitors.length} researched competitor${competitors.length === 1 ? "" : "s"}.`
    : "";
  const footnote = `24-month profit forecast from ${stats.sourcesAnalyzed} research source${
    stats.sourcesAnalyzed === 1 ? "" : "s"
  } — ${stats.marketSizeEstimate} market, ${rateLabel} demand growth, $${budgetUsd.toLocaleString()} budget baseline.${competitorNote} Not audited financial advice.`;

  return {
    points,
    competitors,
    targetMonthlyProfitUsd,
    annualGrowthRate,
    citations,
    footnote,
  };
}

export function formatMarketUsd(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}$${abs.toLocaleString()}`;
}

export function formatMarketUsdExact(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
