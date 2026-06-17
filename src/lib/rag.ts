import type { Source } from "./types";

export const sourceRegistry: Source[] = [
  {
    id: "esco",
    title: "ESCO skills taxonomy",
    url: "https://esco.ec.europa.eu/",
    type: "official skills framework",
    label: "Official source",
  },
  {
    id: "gem",
    title: "Global Entrepreneurship Monitor",
    url: "https://www.gemconsortium.org/",
    type: "entrepreneurship climate research",
    label: "Verified",
  },
  {
    id: "world-bank",
    title: "World Bank business formation indicators",
    url: "https://data.worldbank.org/",
    type: "macro signal",
    label: "Approximate",
  },
  {
    id: "startup-india",
    title: "Startup India, DPIIT recognition, and MAARG",
    url: "https://www.startupindia.gov.in/",
    type: "country-specific opportunity",
    label: "Official source",
  },
  {
    id: "lean-startup",
    title: "Lean Startup and Business Model Canvas validation principles",
    url: "https://theleanstartup.com/",
    type: "startup framework",
    label: "Framework-based",
  },
];

export function retrieveSources(query: string) {
  const lower = query.toLowerCase();
  const scored = sourceRegistry.map((source) => {
    const haystack = `${source.title} ${source.type}`.toLowerCase();
    const score = lower
      .split(/\W+/)
      .filter((token) => token.length > 2 && haystack.includes(token)).length;
    return { source, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.source);
}
