import type { ProjectSourceSummary, ProjectStats } from "./types";

const FALLBACK_SOURCES: ProjectSourceSummary[] = [
  {
    title: "Hacker News (Algolia)",
    url: "https://hn.algolia.com/",
    label: "Community signal",
    type: "Discussion",
  },
  {
    title: "GitHub public search",
    url: "https://github.com/search",
    label: "Inferred",
    type: "Repository",
  },
  {
    title: "World Bank open data",
    url: "https://data.worldbank.org/",
    label: "Approximate",
    type: "Macro data",
  },
  {
    title: "LaunchPilot source registry",
    url: "https://www.startupindia.gov.in/",
    label: "Fallback analysis",
    type: "Registry",
  },
];

export function resolveProjectSources(stats: ProjectStats): ProjectSourceSummary[] {
  if (stats.sources?.length) return stats.sources;
  return FALLBACK_SOURCES.slice(0, Math.max(1, stats.sourcesAnalyzed));
}

export function buildMarketSizeExplanation(confidence: number, estimate: string): string {
  return `This ${estimate} is a coaching-level Total Addressable Market (TAM) estimate — not verified financial research. LaunchPilot scales it with your evidence confidence (${confidence}/100): stronger validation suggests a clearer wedge in a larger reachable market. Use it for framing and scope checks only. Confirm with user interviews, pricing tests, and comparable companies before fundraising.`;
}
