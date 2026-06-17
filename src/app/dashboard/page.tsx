"use client";

import { LaunchBriefView } from "@/components/LaunchBriefView";
import { Nav } from "@/components/Nav";
import { generateLaunchBrief } from "@/lib/agents";
import { demoProfile } from "@/lib/seed";
import type { LaunchBrief } from "@/lib/types";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [brief, setBrief] = useState<LaunchBrief | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const saved = localStorage.getItem("launchpilot-brief");
      if (saved) {
        setBrief(JSON.parse(saved));
        return;
      }
      const generated = generateLaunchBrief(demoProfile);
      localStorage.setItem("launchpilot-brief", JSON.stringify(generated));
      setBrief(generated);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <main className="shell-bg min-h-screen">
      <Nav />
      <section className="mx-auto max-w-7xl px-5 pb-10">{brief ? <LaunchBriefView brief={brief} /> : null}</section>
    </main>
  );
}
