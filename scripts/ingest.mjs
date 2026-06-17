import fs from "node:fs";
import path from "node:path";

const registry = {
  updatedAt: new Date().toISOString(),
  note: "LaunchPilot ships with a deterministic seed registry. Live data connectors can refresh these records when API access is configured.",
  sources: [
    { id: "esco", name: "ESCO skills taxonomy", type: "framework", label: "Official source", url: "https://esco.ec.europa.eu/" },
    { id: "gem", name: "Global Entrepreneurship Monitor", type: "research", label: "Verified", url: "https://www.gemconsortium.org/" },
    { id: "world-bank", name: "World Bank entrepreneurship data", type: "macro", label: "Approximate", url: "https://data.worldbank.org/" },
    { id: "startup-india", name: "Startup India / DPIIT / MAARG", type: "opportunity", label: "Official source", url: "https://www.startupindia.gov.in/" },
    { id: "lean-startup", name: "Lean Startup validation principles", type: "framework", label: "Framework-based" }
  ]
};

const outDir = path.join(process.cwd(), "data");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "source-registry.json"), JSON.stringify(registry, null, 2));
console.log("Wrote data/source-registry.json");
