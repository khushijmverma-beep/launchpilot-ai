"use client";

import { Badge } from "@/components/Badge";
import { Nav } from "@/components/Nav";
import { generateLaunchBrief } from "@/lib/agents";
import { demoProfile } from "@/lib/seed";
import type { AgentOutput, FounderProfile, LaunchBrief } from "@/lib/types";
import { Bot, CheckCircle2, ChevronDown, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const AGENT_NAMES = [
  "Lead Research",
  "Competitor",
  "Pain Point",
  "Opportunity",
  "Skill Gap",
  "Source Quality",
];

const stagedLogs = [
  "Reading founder profile and interview transcript...",
  "Fetching public founder pain signals from Hacker News Algolia...",
  "Searching GitHub for open-source alternatives and adjacent tools...",
  "Fetching World Bank entrepreneurship macro signal...",
  "Checking ESCO skill taxonomy and Startup India opportunity references...",
  "Comparing sources, labeling confidence, and building the roadmap...",
];

function AgentStatusLine({ agent, active, statusText }: { agent: AgentOutput; active: boolean; statusText: string }) {
  return (
    <details className="group border-b border-white/10 py-4" open={active}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border ${
              active ? "border-white bg-white text-black" : "border-white/20 text-lp-muted"
            }`}
          >
            {active ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-mono text-sm font-medium text-white">{agent.name}</h2>
            <p className="truncate font-mono text-xs text-lp-subtle">{agent.role}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge label={active ? "Running" : agent.label} />
          <ChevronDown className="h-4 w-4 text-lp-subtle transition group-open:rotate-180" />
        </div>
      </summary>
      <div className="ml-12 mt-4 space-y-4 text-sm leading-6 text-lp-muted">
        <p className="font-mono text-xs text-white">
          {/* DecryptedText reveals status line as agent reports */}
          {statusText}
        </p>
        <div>
          <p className="mono-label">Live steps</p>
          <ul className="mt-2 space-y-1">
            {(agent.liveSteps || []).map((step) => (
              <li key={step} className="flex gap-2 font-mono text-xs">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mono-label">Finding</p>
          <p className="mt-2">{agent.finding}</p>
        </div>
      </div>
    </details>
  );
}

export default function ResearchPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<FounderProfile>(demoProfile);
  const [brief, setBrief] = useState<LaunchBrief>(() => generateLaunchBrief(demoProfile));
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState(false);

  const visibleLogs = useMemo(() => {
    const realLogs = brief.research.logs || [];
    return [...stagedLogs.slice(0, activeStep + 1), ...realLogs].slice(-9);
  }, [activeStep, brief.research.logs]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setInterval(() => {
      setActiveStep((step) => Math.min(step + 1, stagedLogs.length - 1));
    }, 900);

    const boot = window.setTimeout(() => {
      const savedProfile = localStorage.getItem("launchpilot-profile");
      const parsedProfile = savedProfile ? JSON.parse(savedProfile) : demoProfile;
      if (cancelled) return;
      setProfile(parsedProfile);
      setBrief(generateLaunchBrief(parsedProfile));

      fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: parsedProfile }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (cancelled) return;
          setBrief(data.brief);
          localStorage.setItem("launchpilot-brief", JSON.stringify(data.brief));
          setDone(true);
          setActiveStep(stagedLogs.length - 1);
        })
        .catch(() => {
          if (cancelled) return;
          const fallback = generateLaunchBrief(parsedProfile);
          setBrief(fallback);
          localStorage.setItem("launchpilot-brief", JSON.stringify(fallback));
          setDone(true);
        })
        .finally(() => window.clearInterval(timer));
    }, 0);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(boot);
    };
  }, []);

  return (
    <main className="shell-bg min-h-screen">
      <Nav />
      <section className="mx-auto max-w-4xl px-5 pb-10 pt-6">
        <p className="mono-label">Live agent view</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Market research in progress</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-lp-muted">
          Real-time status for {profile.name}&apos;s founder profile. No background animation — readability first.
        </p>

        <div className="terminal-card mt-8 p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-sm text-white">{done ? "Synthesis complete" : stagedLogs[activeStep]}</p>
            <Badge label={done ? "Complete" : "Running"} />
          </div>
          <div className="mt-4 h-px bg-white/20">
            <div
              className="h-px bg-white transition-all duration-700"
              style={{ width: `${done ? 100 : ((activeStep + 1) / stagedLogs.length) * 100}%` }}
            />
          </div>
          <div className="mt-4 space-y-1 font-mono text-xs text-lp-subtle">
            {visibleLogs.map((log, index) => (
              <p key={`${log}-${index}`}>&gt; {log}</p>
            ))}
          </div>
        </div>

        <div className="mt-6 terminal-card px-5">
          <p className="mono-label border-b border-white/10 py-4">Agent pipeline</p>
          {brief.agents
            .filter((agent) => AGENT_NAMES.includes(agent.name))
            .map((agent, index) => (
              <AgentStatusLine
                key={agent.name}
                agent={agent}
                active={!done && index === activeStep % brief.agents.length}
                statusText={activeStep === index && !done ? stagedLogs[activeStep] : agent.finding.slice(0, 80)}
              />
            ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => router.push("/dashboard")}>
            Open Launch Brief
          </button>
          <button className="btn-secondary" onClick={() => router.push("/scoring")}>
            View evidence score
          </button>
        </div>
      </section>
    </main>
  );
}
