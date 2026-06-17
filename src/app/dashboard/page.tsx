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
      <section className="mx-auto max-w-7xl px-5 pb-10">
        {brief ? (
          <LaunchBriefView brief={brief} />
        ) : (
          <div className="glass rounded-[28px] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Launch Brief Workspace</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">Preparing your founder workspace...</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Loading saved context, agent outputs, sources, roadmap, and responsible AI notes.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
